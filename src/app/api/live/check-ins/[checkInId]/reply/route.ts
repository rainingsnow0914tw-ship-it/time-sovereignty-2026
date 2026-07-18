import { NextRequest } from "next/server";

import { runLiveCheckInAgents } from "@/live-checkin/orchestrator";
import {
  authenticateLiveRequest,
  clientCheckIn,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";
import { LiveReplyRequestSchema } from "@/live-checkin/schemas";
import { assertAllowedOrigin, sha256 } from "@/live-checkin/session-auth";
import { OpenAiResponsesProvider } from "@/providers/ai/openai-provider";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ checkInId: string }> },
) {
  let claimed:
    | {
        repository: Awaited<ReturnType<typeof authenticateLiveRequest>>["repository"];
        checkInId: string;
        leaseToken: string;
      }
    | null = null;
  try {
    const auth = await authenticateLiveRequest(request);
    assertAllowedOrigin(request, auth.config);
    const { checkInId } = await context.params;
    const body = LiveReplyRequestSchema.parse(await request.json());
    const replyFingerprint = sha256(
      JSON.stringify({
        intent: body.intent,
        reply: body.reply,
        imageFingerprint: body.image ? sha256(body.image.dataUrl) : null,
      }),
    );
    const claim = await auth.repository.claimReply({
      checkInId,
      sessionId: auth.session.id,
      replyId: body.replyId,
      replyFingerprint,
    });
    if (claim.kind === "DUPLICATE") {
      return liveJson({
        ok: true,
        duplicate: true,
        checkIn: await clientCheckIn(claim.checkIn, auth.config),
      });
    }
    if (claim.kind === "BUSY") {
      return liveJson(
        { ok: false, error: "reply_processing" },
        {
          status: 409,
          headers: { "Retry-After": String(claim.retryAfterSeconds) },
        },
      );
    }

    claimed = {
      repository: auth.repository,
      checkInId,
      leaseToken: claim.leaseToken,
    };
    let completedCheckIn: typeof claim.checkIn | null = null;
    const result = await runLiveCheckInAgents({
      checkIn: claim.checkIn,
      reply: body,
      provider: new OpenAiResponsesProvider(),
      onTriage: async (triage, trace) => {
        await auth.repository.saveTriage({
          checkInId,
          leaseToken: claim.leaseToken,
          triage,
          trace,
        });
      },
      onRecovery: async (recovery, trace) => {
        await auth.repository.saveRecovery({
          checkInId,
          leaseToken: claim.leaseToken,
          recovery,
          trace,
        });
      },
      onDecision: async (decision, trace) => {
        completedCheckIn = await auth.repository.completeDecision({
          checkInId,
          leaseToken: claim.leaseToken,
          decision,
          trace,
        });
      },
    });
    if (!completedCheckIn) throw new Error("Live decision was not persisted.");
    claimed = null;

    console.info("[live-check-in] agents completed", {
      checkInId,
      replyId: body.replyId,
      assessment: result.decision.assessment,
      dispatchedAgents: result.decision.dispatchedAgents,
      providers: [...new Set(result.traces.map((trace) => trace.provider))],
      models: [...new Set(result.traces.map((trace) => trace.model))],
      totalTokens: result.traces.reduce(
        (total, trace) => total + (trace.tokenUsage?.totalTokens ?? 0),
        0,
      ),
    });
    return liveJson({
      ok: true,
      duplicate: false,
      checkIn: await clientCheckIn(completedCheckIn, auth.config),
    });
  } catch (error) {
    if (claimed) {
      await claimed.repository.failReply({
        checkInId: claimed.checkInId,
        leaseToken: claimed.leaseToken,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
    return liveErrorResponse(error, "reply");
  }
}
