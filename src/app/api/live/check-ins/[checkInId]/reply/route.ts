import { NextRequest } from "next/server";

import { processLiveReply } from "@/live-checkin/process-reply";
import {
  authenticateLiveRequest,
  clientCheckIn,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";
import { LiveReplyRequestSchema } from "@/live-checkin/schemas";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";
import { OpenAiResponsesProvider } from "@/providers/ai/openai-provider";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ checkInId: string }> },
) {
  try {
    const auth = await authenticateLiveRequest(request);
    assertAllowedOrigin(request, auth.config);
    const { checkInId } = await context.params;
    const body = LiveReplyRequestSchema.parse(await request.json());
    const processed = await processLiveReply({
      repository: auth.repository,
      sessionId: auth.session.id,
      checkInId,
      reply: body,
      provider: new OpenAiResponsesProvider(),
    });
    if (processed.kind === "DUPLICATE") {
      return liveJson({
        ok: true,
        duplicate: true,
        checkIn: await clientCheckIn(processed.checkIn, auth.config),
      });
    }
    if (processed.kind === "BUSY") {
      return liveJson(
        { ok: false, error: "reply_processing" },
        {
          status: 409,
          headers: { "Retry-After": String(processed.retryAfterSeconds) },
        },
      );
    }

    console.info("[live-check-in] agents completed", {
      checkInId,
      replyId: body.replyId,
      assessment: processed.agentResult.decision.assessment,
      dispatchedAgents: processed.agentResult.decision.dispatchedAgents,
      providers: [...new Set(processed.agentResult.traces.map((trace) => trace.provider))],
      models: [...new Set(processed.agentResult.traces.map((trace) => trace.model))],
      totalTokens: processed.agentResult.traces.reduce(
        (total, trace) => total + (trace.tokenUsage?.totalTokens ?? 0),
        0,
      ),
      retrievedMemoryCount: processed.checkIn.retrievedMemoryIds.length,
    });
    return liveJson({
      ok: true,
      duplicate: false,
      checkIn: await clientCheckIn(processed.checkIn, auth.config),
    });
  } catch (error) {
    return liveErrorResponse(error, "reply");
  }
}
