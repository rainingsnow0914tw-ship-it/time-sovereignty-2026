import { describe, expect, it } from "vitest";

import {
  applyMemoryOutcome,
  buildStrategyMemory,
  memoryContextForModel,
  selectRelevantLiveMemories,
} from "./live-memory";
import { LiveCheckInDocumentSchema } from "./schemas";

function confirmedCandidate() {
  return LiveCheckInDocumentSchema.parse({
    version: 1,
    id: "first-phone-task",
    sessionId: "private-device",
    status: "DECISION_READY",
    message: "What is true now?",
    context: {
      goal: "Build a sustainable sketch practice",
      motivation: "Draw small illustrations",
      targetWindow: "One month",
      currentAction: "Draw one cup for 20 minutes",
      minimumAction: "Draw the outline",
      preferredTone: "Warm and direct",
      locale: "zh-TW",
    },
    scheduledFor: "2026-07-19T01:00:00.000Z",
    taskName: "task-one",
    pendingAt: "2026-07-19T01:00:00.000Z",
    replyId: "reply-one",
    replyFingerprint: "a".repeat(64),
    attemptCount: 1,
    leaseToken: null,
    leaseExpiresAt: null,
    triage: null,
    recovery: null,
    decision: {
      assessment: "COMPLETED",
      userMessage: "The cup sketch is visibly complete.",
      adaptedCommitment: "Keep the lesson: finish before judging.",
      dispatchedAgents: [],
      selectedStrategy: "CONTINUE",
      nextFollowUpAt: null,
      memoryProposal: {
        summary: "A short live deadline may reduce repeated erasing.",
        confidence: 0.9,
        requiresUserConfirmation: true,
      },
    },
    traceRunIds: [],
    confirmedAt: null,
    confirmationId: null,
    nextCheckInId: null,
    nextTaskName: null,
    errorName: null,
    evidenceKinds: ["TEXT", "PHOTO"],
    retrievedMemoryIds: [],
    memoryDisposition: null,
    memoryCurationStatus: null,
    memoryCurationLeaseToken: null,
    memoryCurationLeaseExpiresAt: null,
    memoryCurationSummary: null,
    createdAt: "2026-07-19T00:59:00.000Z",
    updatedAt: "2026-07-19T01:01:00.000Z",
  });
}

describe("live layered memory", () => {
  it("caps a first observed Strategy Card and labels it as limited evidence", () => {
    const memory = buildStrategyMemory({
      checkIn: confirmedCandidate(),
      disposition: "DEFER",
      timestamp: "2026-07-19T01:02:00.000Z",
    });
    expect(memory?.confirmationState).toBe("TENTATIVE");
    expect(memory?.confidence).toBe(0.45);
    expect(memoryContextForModel([memory!])[0]?.instruction).toContain(
      "LIMITED_EVIDENCE",
    );
  });

  it("retrieves only same-goal or user memories and updates second outcome effectiveness", () => {
    const first = buildStrategyMemory({
      checkIn: confirmedCandidate(),
      disposition: "DEFER",
      timestamp: "2026-07-19T01:02:00.000Z",
    })!;
    const retrieved = selectRelevantLiveMemories({
      memories: [first, { ...first, id: "other-goal", goalKey: "f".repeat(32) }],
      context: confirmedCandidate().context,
      now: new Date("2026-07-20T01:00:00.000Z"),
    });
    expect(retrieved.map((memory) => memory.id)).toEqual([first.id]);

    const updated = applyMemoryOutcome({
      memory: first,
      assessment: "COMPLETED",
      checkInId: "second-phone-task",
      timestamp: "2026-07-20T01:02:00.000Z",
    });
    expect(updated.effectiveness).toMatchObject({ attempts: 1, successes: 1 });
    expect(updated.confidence).toBeCloseTo(0.57);
    expect(updated.confirmationState).toBe("TENTATIVE");
  });
});
