import { describe, expect, it } from "vitest";

import { MockAiProvider } from "../providers/ai/mock-provider";
import { runLiveCheckInAgents } from "./orchestrator";
import { LiveCheckInDocumentSchema } from "./schemas";

const recovery = {
  possibleReason: "The action is larger than tonight's remaining window",
  confidence: 0.75,
  needsClarification: false,
  suggestedQuestion: null,
  strategyCandidates: ["REDUCE" as const, "RESCHEDULE" as const],
  recommendedFollowUpAt: "2026-07-17T14:00:00.000Z",
};

const decision = {
  userMessage: "Keep continuity with one smaller, honest step.",
  adaptedCommitment: "Open the demo and record the first live check-in.",
  dispatchedAgents: ["COMMITMENT_RECOVERY" as const],
  selectedStrategy: "REDUCE" as const,
  nextFollowUpAt: "2026-07-17T14:00:00.000Z",
  memoryProposal: {
    summary: "A smaller recording step restores momentum when time is short.",
    confidence: 0.75,
    requiresUserConfirmation: true,
  },
};

function claimedCheckIn(withRecovery = false) {
  return LiveCheckInDocumentSchema.parse({
    version: 1,
    id: "live-proof",
    sessionId: "session-proof",
    status: "PROCESSING",
    message: "What is true right now?",
    context: {
      goal: "Ship the demo",
      motivation: "Protect the work",
      targetWindow: "Tonight",
      currentAction: "Record everything",
      minimumAction: "Open the PWA",
      preferredTone: "Warm and direct",
    },
    scheduledFor: "2026-07-17T12:00:00.000Z",
    taskName: "task-proof",
    pendingAt: "2026-07-17T12:00:00.000Z",
    replyId: "reply-proof",
    replyFingerprint: "a".repeat(64),
    attemptCount: 1,
    leaseToken: "00000000-0000-4000-8000-000000000001",
    leaseExpiresAt: "2026-07-17T12:05:00.000Z",
    recovery: withRecovery ? recovery : null,
    decision: null,
    traceRunIds: withRecovery ? ["saved-recovery"] : [],
    confirmedAt: null,
    confirmationId: null,
    nextCheckInId: null,
    nextTaskName: null,
    errorName: null,
    createdAt: "2026-07-17T11:59:00.000Z",
    updatedAt: "2026-07-17T12:00:00.000Z",
  });
}

describe("live two-Agent orchestration", () => {
  it("runs Recovery then Chief and persists only safe traces", async () => {
    const persistedTraces: unknown[] = [];
    let savedRecovery = false;
    const result = await runLiveCheckInAgents({
      checkIn: claimedCheckIn(),
      reply: "I lost two hours to deployment debugging.",
      provider: new MockAiProvider({
        COMMITMENT_RECOVERY: recovery,
        CHIEF_OF_STAFF: decision,
      }),
      onRecovery: async (recoveryResult, trace) => {
        expect(recoveryResult).toEqual(recovery);
        savedRecovery = true;
        persistedTraces.push(trace);
      },
      onDecision: async (decisionResult, trace) => {
        expect(decisionResult).toEqual(decision);
        persistedTraces.push(trace);
      },
    });
    expect(savedRecovery).toBe(true);
    expect(result.traces.map((trace) => trace.agent)).toEqual([
      "COMMITMENT_RECOVERY",
      "CHIEF_OF_STAFF",
    ]);
    expect(JSON.stringify(persistedTraces)).not.toContain("lost two hours");
    expect(result.decision.dispatchedAgents).toEqual(["COMMITMENT_RECOVERY"]);
  });

  it("reuses a persisted Recovery result after a partial failure", async () => {
    const result = await runLiveCheckInAgents({
      checkIn: claimedCheckIn(true),
      reply: "Same reply",
      provider: new MockAiProvider({ CHIEF_OF_STAFF: decision }),
      onRecovery: async () => {
        throw new Error("Recovery must not run twice");
      },
      onDecision: async () => undefined,
    });
    expect(result.traces).toHaveLength(1);
    expect(result.traces[0]?.agent).toBe("CHIEF_OF_STAFF");
  });
});
