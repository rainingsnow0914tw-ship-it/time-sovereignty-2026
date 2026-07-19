import type { AiProvider } from "../providers/ai/types";
import type { LiveCheckInRepository } from "./firestore-repository";
import { runLiveCheckInAgents, type LiveCheckInAgentResult } from "./orchestrator";
import type { LiveCheckInDocument, LiveReplyRequest } from "./schemas";
import { sha256 } from "./session-auth";

export type LiveReplyProcessingResult =
  | { kind: "COMPLETED"; checkIn: LiveCheckInDocument; agentResult: LiveCheckInAgentResult }
  | { kind: "DUPLICATE"; checkIn: LiveCheckInDocument }
  | { kind: "BUSY"; retryAfterSeconds: number };

export async function processLiveReply(options: {
  repository: LiveCheckInRepository;
  sessionId: string;
  checkInId: string;
  reply: LiveReplyRequest;
  provider: AiProvider;
}): Promise<LiveReplyProcessingResult> {
  const { repository, sessionId, checkInId, reply, provider } = options;
  const replyFingerprint = sha256(
    JSON.stringify({
      intent: reply.intent,
      reply: reply.reply,
      imageFingerprint: reply.image ? sha256(reply.image.dataUrl) : null,
    }),
  );
  const claim = await repository.claimReply({
    checkInId,
    sessionId,
    replyId: reply.replyId,
    replyFingerprint,
    evidenceKinds: [
      ...(reply.reply ? (["TEXT"] as const) : []),
      ...(reply.image ? (["PHOTO"] as const) : []),
    ],
  });
  if (claim.kind === "DUPLICATE") {
    return { kind: "DUPLICATE", checkIn: claim.checkIn };
  }
  if (claim.kind === "BUSY") {
    return { kind: "BUSY", retryAfterSeconds: claim.retryAfterSeconds };
  }

  try {
    const relevantMemories = await repository.findRelevantMemories({
      sessionId,
      context: claim.checkIn.context,
      limit: 8,
    });
    let completedCheckIn: LiveCheckInDocument | null = null;
    const agentResult = await runLiveCheckInAgents({
      checkIn: claim.checkIn,
      reply,
      relevantMemories,
      provider,
      onTriage: async (triage, trace) => {
        await repository.saveTriage({
          checkInId,
          leaseToken: claim.leaseToken,
          triage,
          trace,
        });
      },
      onRecovery: async (recovery, trace) => {
        await repository.saveRecovery({
          checkInId,
          leaseToken: claim.leaseToken,
          recovery,
          trace,
        });
      },
      onDecision: async (decision, trace) => {
        completedCheckIn = await repository.completeDecision({
          checkInId,
          leaseToken: claim.leaseToken,
          decision,
          retrievedMemoryIds: relevantMemories.map((memory) => memory.id),
          trace,
        });
      },
    });
    if (!completedCheckIn) throw new Error("Live decision was not persisted.");
    return { kind: "COMPLETED", checkIn: completedCheckIn, agentResult };
  } catch (error) {
    await repository.failReply({
      checkInId,
      leaseToken: claim.leaseToken,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    throw error;
  }
}
