import { describe, expect, it } from "vitest";

import { MockAiProvider } from "../providers/ai/mock-provider";
import type {
  AiProvider,
  StructuredAgentRequest,
} from "../providers/ai/types";
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

const blockedTriage = {
  assessment: "BLOCKED" as const,
  userMessage: "The current plan no longer fits tonight's conditions.",
  adaptedCommitment: "Pause and choose a smaller honest step.",
  dispatchedAgents: ["COMMITMENT_RECOVERY" as const],
  selectedStrategy: null,
  nextFollowUpAt: "2026-07-17T14:00:00.000Z",
  memoryProposal: null,
};

const blockedDecision = {
  assessment: "BLOCKED" as const,
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

const onTrackDecision = {
  assessment: "ON_TRACK" as const,
  userMessage: "That visible result counts; keep the next step small.",
  adaptedCommitment: "Add one paragraph to the draft.",
  dispatchedAgents: [],
  selectedStrategy: "CONTINUE" as const,
  nextFollowUpAt: "2026-07-17T14:00:00.000Z",
  memoryProposal: null,
};

function claimedCheckIn(options: {
  triage?: typeof blockedTriage | null;
  recovery?: typeof recovery | null;
} = {}) {
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
      locale: "en",
    },
    scheduledFor: "2026-07-17T12:00:00.000Z",
    taskName: "task-proof",
    pendingAt: "2026-07-17T12:00:00.000Z",
    replyId: "reply-proof",
    replyFingerprint: "a".repeat(64),
    attemptCount: 1,
    leaseToken: "00000000-0000-4000-8000-000000000001",
    leaseExpiresAt: "2026-07-17T12:05:00.000Z",
    triage: options.triage ?? null,
    recovery: options.recovery ?? null,
    decision: null,
    traceRunIds: [],
    confirmedAt: null,
    confirmationId: null,
    nextCheckInId: null,
    nextTaskName: null,
    errorName: null,
    createdAt: "2026-07-17T11:59:00.000Z",
    updatedAt: "2026-07-17T12:00:00.000Z",
  });
}

const report = {
  replyId: "reply-proof",
  intent: "REPORT_PROGRESS" as const,
  reply: "I lost two hours to deployment debugging.",
  image: null,
};

describe("live progress-aware Agent orchestration", () => {
  it("tells Chief that progress photos are ephemeral and must not be described as stored", async () => {
    const baseProvider = new MockAiProvider({
      LIVE_CHECK_IN_TRIAGE: onTrackDecision,
    });
    const capturedRequests: StructuredAgentRequest<unknown>[] = [];
    const provider: AiProvider = {
      generateStructured: (request, schema) => {
        capturedRequests.push(request as StructuredAgentRequest<unknown>);
        return baseProvider.generateStructured(request, schema);
      },
    };

    await runLiveCheckInAgents({
      checkIn: claimedCheckIn(),
      reply: {
        ...report,
        reply: "I finished the sketch.",
        image: {
          mimeType: "image/jpeg",
          dataUrl: "data:image/jpeg;base64,AA==",
        },
      },
      provider,
      onTriage: async () => undefined,
      onRecovery: async () => undefined,
      onDecision: async () => undefined,
    });

    expect(capturedRequests).toHaveLength(1);
    expect(capturedRequests[0]?.imageInputs).toHaveLength(1);
    expect(capturedRequests[0]?.additionalInstructions).toContain(
      "Photo input is ephemeral and is never stored by this app.",
    );
    expect(capturedRequests[0]?.additionalInstructions).toContain(
      "must not imply server-side media persistence",
    );
  });

  it("lets Chief finish an on-track report without inventing a recovery", async () => {
    const result = await runLiveCheckInAgents({
      checkIn: claimedCheckIn(),
      reply: { ...report, reply: "I finished the first visible result." },
      provider: new MockAiProvider({
        LIVE_CHECK_IN_TRIAGE: onTrackDecision,
      }),
      onTriage: async () => undefined,
      onRecovery: async () => {
        throw new Error("Recovery must not run for on-track progress");
      },
      onDecision: async () => undefined,
    });

    expect(result.recovery).toBeNull();
    expect(result.decision.assessment).toBe("ON_TRACK");
    expect(result.traces.map((trace) => trace.agent)).toEqual([
      "CHIEF_OF_STAFF",
    ]);
  });

  it("runs Chief triage, Recovery, then Chief synthesis for a real blocker", async () => {
    const persistedTraces: unknown[] = [];
    const result = await runLiveCheckInAgents({
      checkIn: claimedCheckIn(),
      reply: report,
      provider: new MockAiProvider({
        LIVE_CHECK_IN_TRIAGE: blockedTriage,
        LIVE_CHECK_IN_RECOVERY: recovery,
        LIVE_CHECK_IN_FINAL: blockedDecision,
      }),
      onTriage: async (_triage, trace) => {
        persistedTraces.push(trace);
      },
      onRecovery: async (_recovery, trace) => {
        persistedTraces.push(trace);
      },
      onDecision: async (_decision, trace) => {
        if (trace) persistedTraces.push(trace);
      },
    });

    expect(result.traces.map((trace) => trace.agent)).toEqual([
      "CHIEF_OF_STAFF",
      "COMMITMENT_RECOVERY",
      "CHIEF_OF_STAFF",
    ]);
    expect(JSON.stringify(persistedTraces)).not.toContain("lost two hours");
    expect(result.decision).toEqual(blockedDecision);
  });

  it("reuses persisted triage and Recovery after a partial failure", async () => {
    const result = await runLiveCheckInAgents({
      checkIn: claimedCheckIn({ triage: blockedTriage, recovery }),
      reply: { ...report, reply: "Same reply" },
      provider: new MockAiProvider({
        LIVE_CHECK_IN_FINAL: blockedDecision,
      }),
      onTriage: async () => {
        throw new Error("Triage must not run twice");
      },
      onRecovery: async () => {
        throw new Error("Recovery must not run twice");
      },
      onDecision: async () => undefined,
    });

    expect(result.traces).toHaveLength(1);
    expect(result.traces[0]?.agent).toBe("CHIEF_OF_STAFF");
  });
});
