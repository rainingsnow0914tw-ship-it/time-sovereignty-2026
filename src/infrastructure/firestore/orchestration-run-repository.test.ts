import { describe, expect, it } from "vitest";

import type { ChiefOfStaffOutput } from "../../domain/agents/schemas";
import {
  completeOrchestrationRun,
  decideOrchestrationRunClaim,
  failOrchestrationRun,
  OrchestrationRunLeaseError,
  type OrchestrationRunReceipt,
} from "./orchestration-run-repository";

const now = new Date("2026-07-16T15:30:00.000Z");
const leaseToken = "11111111-1111-4111-8111-111111111111";

const decision: ChiefOfStaffOutput = {
  userMessage: "Let's continue with the smallest visible next action.",
  dispatchedAgents: ["COMMITMENT_RECOVERY"],
  selectedStrategy: "REDUCE",
  nextFollowUpAt: null,
  memoryProposals: [],
};

function receipt(
  overrides: Partial<OrchestrationRunReceipt> = {},
): OrchestrationRunReceipt {
  return {
    version: 1,
    requestId: "phase4-run-1",
    status: "IN_FLIGHT",
    leaseToken,
    leaseExpiresAt: "2026-07-16T15:35:00.000Z",
    taskName: "phase4-task",
    attemptCount: 1,
    dispatchedAgents: ["COMMITMENT_RECOVERY"],
    decision: null,
    errorName: null,
    startedAt: now.toISOString(),
    completedAt: null,
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

describe("orchestration run lease", () => {
  it("claims a new request with a five-minute lease", () => {
    const result = decideOrchestrationRunClaim({
      requestId: "phase4-run-1",
      current: null,
      dispatchedAgents: ["COMMITMENT_RECOVERY"],
      taskName: "phase4-task",
      now,
      leaseSeconds: 300,
      leaseToken,
    });

    expect(result.kind).toBe("CLAIMED");
    if (result.kind !== "CLAIMED") return;
    expect(result.receipt.attemptCount).toBe(1);
    expect(result.receipt.leaseExpiresAt).toBe("2026-07-16T15:35:00.000Z");
  });

  it("asks a concurrent retry to wait for the active lease", () => {
    const result = decideOrchestrationRunClaim({
      requestId: "phase4-run-1",
      current: receipt(),
      dispatchedAgents: ["COMMITMENT_RECOVERY"],
      taskName: "phase4-retry",
      now,
      leaseSeconds: 300,
      leaseToken,
    });

    expect(result).toEqual({ kind: "BUSY", retryAfterSeconds: 300 });
  });

  it("reclaims a failed run and increments the attempt", () => {
    const result = decideOrchestrationRunClaim({
      requestId: "phase4-run-1",
      current: receipt({ status: "FAILED", errorName: "APIError" }),
      dispatchedAgents: ["COMMITMENT_RECOVERY"],
      taskName: "phase4-retry",
      now,
      leaseSeconds: 300,
      leaseToken: "22222222-2222-4222-8222-222222222222",
    });

    expect(result.kind).toBe("CLAIMED");
    if (result.kind !== "CLAIMED") return;
    expect(result.receipt.attemptCount).toBe(2);
    expect(result.receipt.errorName).toBeNull();
  });

  it("treats a completed run as a duplicate", () => {
    const completed = receipt({
      status: "COMPLETED",
      decision,
      completedAt: "2026-07-16T15:31:00.000Z",
    });
    const result = decideOrchestrationRunClaim({
      requestId: "phase4-run-1",
      current: completed,
      dispatchedAgents: ["COMMITMENT_RECOVERY"],
      taskName: "phase4-duplicate",
      now,
      leaseSeconds: 300,
      leaseToken,
    });

    expect(result).toEqual({ kind: "DUPLICATE", receipt: completed });
  });

  it("completes or fails only for the active lease owner", () => {
    expect(
      completeOrchestrationRun(receipt(), leaseToken, decision, now).status,
    ).toBe("COMPLETED");
    expect(failOrchestrationRun(receipt(), leaseToken, "APIError", now)).toMatchObject({
      status: "FAILED",
      errorName: "APIError",
    });
    expect(() =>
      completeOrchestrationRun(
        receipt(),
        "22222222-2222-4222-8222-222222222222",
        decision,
        now,
      ),
    ).toThrow(OrchestrationRunLeaseError);
  });
});
