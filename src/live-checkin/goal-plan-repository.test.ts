import { describe, expect, it } from "vitest";

import {
  decideLiveGoalPlanClaim,
  LiveGoalPlanStateError,
  type LiveGoalPlanReceipt,
} from "./goal-plan-repository";

const now = new Date("2026-07-18T01:00:00.000Z");
const leaseToken = "11111111-1111-4111-8111-111111111111";

function claim(current: LiveGoalPlanReceipt | null) {
  return decideLiveGoalPlanClaim({
    id: "goal-plan-1",
    sessionId: "paired-session",
    requestId: "request-1",
    requestFingerprint: "a".repeat(64),
    current,
    now,
    leaseToken,
  });
}

describe("live Goal Architect idempotency lease", () => {
  it("claims one request without storing raw onboarding answers", () => {
    const result = claim(null);
    expect(result.kind).toBe("CLAIMED");
    if (result.kind !== "CLAIMED") return;
    expect(result.receipt).toMatchObject({
      status: "IN_FLIGHT",
      requestFingerprint: "a".repeat(64),
      attemptCount: 1,
      plan: null,
      trace: null,
    });
    expect(result.receipt).not.toHaveProperty("answers");
  });

  it("returns busy while the first model call owns the lease", () => {
    const first = claim(null);
    if (first.kind !== "CLAIMED") throw new Error("Expected claim");
    expect(claim(first.receipt)).toEqual({
      kind: "BUSY",
      retryAfterSeconds: 300,
    });
  });

  it("rejects reuse of a request identity with different input", () => {
    const first = claim(null);
    if (first.kind !== "CLAIMED") throw new Error("Expected claim");
    expect(() =>
      decideLiveGoalPlanClaim({
        id: "goal-plan-1",
        sessionId: "paired-session",
        requestId: "request-1",
        requestFingerprint: "b".repeat(64),
        current: first.receipt,
        now,
        leaseToken,
      }),
    ).toThrow(LiveGoalPlanStateError);
  });
});
