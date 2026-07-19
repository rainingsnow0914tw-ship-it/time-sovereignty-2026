import { NextRequest } from "next/server";

import { createCatchResponseRepository, CatchResponseConflictError } from "@/catch-v2/firestore-response-repository";
import { catchResponseToLiveReply } from "@/catch-v2/response-mapping";
import { authenticateCatchDeviceRequest, catchV2ErrorResponse, catchV2Json } from "@/catch-v2/route-helpers";
import { CatchResponseSchema } from "@/catch-v2/schemas";
import { createLiveCheckInRepository, LiveCheckInStateError } from "@/live-checkin/firestore-repository";
import { readLiveCheckInConfig } from "@/live-checkin/config";
import { processLiveReply } from "@/live-checkin/process-reply";
import { OpenAiResponsesProvider } from "@/providers/ai/openai-provider";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const { device } = await authenticateCatchDeviceRequest(request);
    const { eventId } = await context.params;
    const response = CatchResponseSchema.parse(await request.json());
    if (response.eventId !== eventId) {
      return catchV2Json(
        { ok: false, error: "native_event_id_mismatch" },
        { status: 400 },
      );
    }
    if (response.type === "timeout") {
      return catchV2Json(
        { ok: false, error: "native_timeout_not_user_action" },
        { status: 400 },
      );
    }

    const live = readLiveCheckInConfig();
    const recorded = await createCatchResponseRepository(live.cloud).record({
      response,
      deviceId: device.id,
      sessionId: device.sessionId,
    });
    const processed = await processLiveReply({
      repository: createLiveCheckInRepository(live.cloud),
      sessionId: device.sessionId,
      checkInId: eventId,
      reply: catchResponseToLiveReply(response),
      provider: new OpenAiResponsesProvider(),
    });
    if (processed.kind === "BUSY") {
      return catchV2Json(
        { ok: false, error: "native_response_processing" },
        {
          status: 409,
          headers: { "Retry-After": String(processed.retryAfterSeconds) },
        },
      );
    }
    const decision = processed.checkIn.decision;
    if (!decision) throw new Error("Native response has no persisted decision.");

    console.info("[catch-v2] native response processed", {
      eventId,
      responseId: response.responseId,
      responseType: response.type,
      duplicateEvent: recorded.duplicate,
      duplicateDecision: processed.kind === "DUPLICATE",
      assessment: decision.assessment,
    });
    return catchV2Json({
      ok: true,
      duplicate: recorded.duplicate || processed.kind === "DUPLICATE",
      eventId,
      status: processed.checkIn.status,
      requiresConfirmation: processed.checkIn.status !== "CONFIRMED",
      decision: {
        assessment: decision.assessment,
        userMessage: decision.userMessage,
        adaptedCommitment: decision.adaptedCommitment,
        selectedStrategy: decision.selectedStrategy,
        nextFollowUpAt: decision.nextFollowUpAt,
        memoryProposal: decision.memoryProposal,
      },
    });
  } catch (error) {
    if (
      error instanceof CatchResponseConflictError ||
      error instanceof LiveCheckInStateError
    ) {
      return catchV2Json(
        { ok: false, error: "native_response_conflict" },
        { status: 409 },
      );
    }
    return catchV2ErrorResponse(error, "native-response");
  }
}
