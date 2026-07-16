import { describe, expect, it } from "vitest";

import {
  ChiefOfStaffOutputSchema,
  GoalArchitectOutputSchema,
} from "./agents/schemas";
import { MemoryRecordSchema } from "./memories/schemas";

describe("agent output contracts", () => {
  it("accepts a complete Goal Architect plan", () => {
    const result = GoalArchitectOutputSchema.safeParse({
      goalSummary: "Ship the recovery-loop MVP",
      motivation: "Protect the Build Week demo without abandoning the thesis",
      targetWindow: "By the final submission deadline",
      feasibilityNotes: ["Use one vertical slice before visual polish"],
      firstMilestone: "Finish deterministic domain behavior",
      bestNextAction: "Implement and test both state machines",
      minimumViableAction: "Write the transition maps",
      initialCheckInProposal: {
        scheduledFor: "2026-07-16T12:00:00.000Z",
        rationale: "Check immediately after the foundation milestone",
      },
      assumptionsNeedingConfirmation: ["Cloud project access is available"],
    });

    expect(result.success).toBe(true);
  });

  it("does not let the Chief of Staff dispatch itself as a sub-agent", () => {
    const result = ChiefOfStaffOutputSchema.safeParse({
      userMessage: "I will help you choose the next move.",
      dispatchedAgents: ["CHIEF_OF_STAFF"],
      selectedStrategy: "CONTINUE",
      nextFollowUpAt: "2026-07-16T12:00:00.000Z",
      memoryProposals: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("memory trust boundary", () => {
  it("prevents an AI hypothesis from silently becoming confirmed", () => {
    const result = MemoryRecordSchema.safeParse({
      id: "memory-1",
      userId: "user-1",
      goalId: "goal-1",
      kind: "STRATEGY",
      state: "ACTIVE",
      sourceType: "AI_HYPOTHESIS",
      value: { possiblePattern: "evening conflict" },
      confidence: 0.68,
      sensitivity: "MODERATE",
      userEditable: true,
      evidenceRefs: ["intervention-1"],
      validFrom: "2026-07-16T10:00:00.000Z",
      validUntil: null,
      confirmedAt: "2026-07-16T10:05:00.000Z",
      supersededById: null,
      createdAt: "2026-07-16T10:00:00.000Z",
      updatedAt: "2026-07-16T10:05:00.000Z",
    });

    expect(result.success).toBe(false);
  });
});
