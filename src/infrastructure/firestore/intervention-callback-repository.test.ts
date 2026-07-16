import { describe, expect, it } from "vitest";

import type { Intervention } from "../../domain/interventions/schemas";
import {
  completeCallbackReceipt,
  decideInterventionCallbackClaim,
  InterventionCallbackLeaseError,
  type CallbackReceipt,
} from "./intervention-callback-repository";

const now = new Date("2026-07-16T14:30:00.000Z");
const leaseToken = "11111111-1111-4111-8111-111111111111";

function intervention(state: Intervention["state"] = "SCHEDULED"): Intervention {
  return {
    id: "intervention-phase3-proof",
    actionId: "action-phase3-proof",
    state,
    trigger: "NEXT_CHECK_AT",
    channel: "TEXT",
    scheduledFor: "2026-07-16T14:29:00.000Z",
    deliveryKey: "action-phase3-proof:2026-07-16T14:29:00.000Z",
    delayCount: 0,
    delayHistory: [],
    createdAt: "2026-07-16T14:20:00.000Z",
    updatedAt: "2026-07-16T14:20:00.000Z",
  };
}

function receipt(overrides: Partial<CallbackReceipt> = {}): CallbackReceipt {
  return {
    version: 1,
    interventionId: "intervention-phase3-proof",
    status: "IN_FLIGHT",
    leaseToken,
    leaseExpiresAt: "2026-07-16T14:31:00.000Z",
    taskName: "projects/example/locations/asia-east1/queues/checkins/tasks/proof",
    retryCount: 0,
    attemptCount: 1,
    claimedAt: now.toISOString(),
    completedAt: null,
    ...overrides,
  };
}

describe("intervention callback claim", () => {
  it("atomically moves a scheduled intervention to due and reserves delivery", () => {
    const result = decideInterventionCallbackClaim({
      intervention: intervention(),
      receipt: null,
      now,
      leaseSeconds: 60,
      leaseToken,
      taskName: "task-proof",
      retryCount: 0,
    });

    expect(result.kind).toBe("CLAIMED");
    if (result.kind !== "CLAIMED") return;
    expect(result.intervention.state).toBe("DUE");
    expect(result.receipt.status).toBe("IN_FLIGHT");
    expect(result.receipt.attemptCount).toBe(1);
  });

  it("asks Cloud Tasks to retry while another lease is active", () => {
    const result = decideInterventionCallbackClaim({
      intervention: intervention("DUE"),
      receipt: receipt(),
      now,
      leaseSeconds: 60,
      leaseToken: "22222222-2222-4222-8222-222222222222",
      taskName: "task-retry",
      retryCount: 1,
    });

    expect(result).toEqual({ kind: "BUSY", retryAfterSeconds: 60 });
  });

  it("takes over an expired lease without replaying the state transition", () => {
    const result = decideInterventionCallbackClaim({
      intervention: intervention("DUE"),
      receipt: receipt({ leaseExpiresAt: "2026-07-16T14:29:59.000Z" }),
      now,
      leaseSeconds: 60,
      leaseToken: "22222222-2222-4222-8222-222222222222",
      taskName: "task-retry",
      retryCount: 1,
    });

    expect(result.kind).toBe("CLAIMED");
    if (result.kind !== "CLAIMED") return;
    expect(result.intervention.state).toBe("DUE");
    expect(result.receipt.attemptCount).toBe(2);
  });

  it("treats a completed receipt as a successful duplicate", () => {
    const completed = receipt({
      status: "COMPLETED",
      completedAt: "2026-07-16T14:30:10.000Z",
    });
    const result = decideInterventionCallbackClaim({
      intervention: intervention("DUE"),
      receipt: completed,
      now,
      leaseSeconds: 60,
      leaseToken,
      taskName: "task-duplicate",
      retryCount: 1,
    });

    expect(result.kind).toBe("DUPLICATE");
  });

  it("only lets the lease owner complete the callback", () => {
    expect(() =>
      completeCallbackReceipt(
        receipt(),
        "22222222-2222-4222-8222-222222222222",
        now,
      ),
    ).toThrow(InterventionCallbackLeaseError);

    expect(completeCallbackReceipt(receipt(), leaseToken, now).status).toBe(
      "COMPLETED",
    );
  });
});
