import { describe, expect, it } from "vitest";

import type { Action } from "../goals/schemas";
import { ActionStatusSchema } from "../goals/schemas";
import type { Intervention } from "../interventions/schemas";
import { InterventionStateSchema } from "../interventions/schemas";
import {
  shouldScheduleInterventionForAction,
  transitionAction,
} from "./action-machine";
import { DomainInvariantError, InvalidTransitionError } from "./errors";
import {
  activateRescheduledIntervention,
  assertSingleActiveIntervention,
  assertUniqueDeliveryKeys,
  requiresPatternAnalysis,
  rescheduleIntervention,
  transitionIntervention,
} from "./intervention-machine";

const INITIAL_TIME = "2026-07-16T10:00:00.000Z";

function makeAction(status: Action["status"]): Action {
  return {
    id: "action-1",
    goalId: "goal-1",
    title: "Implement the recovery flow",
    minimumVersion: "Write one transition test",
    status,
    nextCheckAt: "2026-07-16T12:00:00.000Z",
    createdAt: INITIAL_TIME,
    updatedAt: INITIAL_TIME,
  };
}

function makeIntervention(
  state: Intervention["state"],
  overrides: Partial<Intervention> = {},
): Intervention {
  return {
    id: "intervention-1",
    actionId: "action-1",
    state,
    trigger: "NEXT_CHECK_AT",
    channel: "TEXT",
    scheduledFor: "2026-07-16T12:00:00.000Z",
    deliveryKey: "action-1:2026-07-16T12:00:00.000Z",
    delayCount: 0,
    delayHistory: [],
    createdAt: INITIAL_TIME,
    updatedAt: INITIAL_TIME,
    ...overrides,
  };
}

describe("dual state-machine boundary", () => {
  it("keeps action progress separate from intervention delivery", () => {
    expect(ActionStatusSchema.safeParse("DUE").success).toBe(false);
    expect(InterventionStateSchema.safeParse("DUE").success).toBe(true);
    expect(ActionStatusSchema.safeParse("IN_PROGRESS").success).toBe(true);
    expect(InterventionStateSchema.safeParse("IN_PROGRESS").success).toBe(
      false,
    );
  });
});

describe("action state machine", () => {
  it("moves through a valid work lifecycle", () => {
    const ready = transitionAction(
      makeAction("PLANNED"),
      "READY",
      new Date("2026-07-16T10:01:00.000Z"),
    );
    const inProgress = transitionAction(
      ready,
      "IN_PROGRESS",
      new Date("2026-07-16T10:02:00.000Z"),
    );
    const awaitingUpdate = transitionAction(
      inProgress,
      "AWAITING_UPDATE",
      new Date("2026-07-16T10:03:00.000Z"),
    );
    const completed = transitionAction(
      awaitingUpdate,
      "COMPLETED",
      new Date("2026-07-16T10:04:00.000Z"),
    );

    expect(completed.status).toBe("COMPLETED");
    expect(completed.updatedAt).toBe("2026-07-16T10:04:00.000Z");
  });

  it("rejects transitions out of terminal states", () => {
    expect(() =>
      transitionAction(
        makeAction("COMPLETED"),
        "IN_PROGRESS",
        new Date("2026-07-16T10:05:00.000Z"),
      ),
    ).toThrow(InvalidTransitionError);
  });

  it("never schedules reminders for paused or terminal actions", () => {
    expect(shouldScheduleInterventionForAction(makeAction("READY"))).toBe(true);
    expect(shouldScheduleInterventionForAction(makeAction("PAUSED"))).toBe(
      false,
    );
    expect(shouldScheduleInterventionForAction(makeAction("COMPLETED"))).toBe(
      false,
    );
    expect(shouldScheduleInterventionForAction(makeAction("RETIRED"))).toBe(
      false,
    );
    expect(shouldScheduleInterventionForAction(makeAction("CANCELLED"))).toBe(
      false,
    );
  });
});

describe("intervention state machine", () => {
  it("accepts one delay and reschedules without entering adaptation", () => {
    let intervention = makeIntervention("SCHEDULED");
    intervention = transitionIntervention(
      intervention,
      "DUE",
      new Date("2026-07-16T12:00:00.000Z"),
    );
    intervention = transitionIntervention(
      intervention,
      "DELIVERED",
      new Date("2026-07-16T12:00:01.000Z"),
    );
    intervention = transitionIntervention(
      intervention,
      "USER_RESPONDED",
      new Date("2026-07-16T12:01:00.000Z"),
    );
    intervention = rescheduleIntervention(
      intervention,
      "2026-07-16T14:00:00.000Z",
      "An urgent meeting arrived",
      new Date("2026-07-16T12:02:00.000Z"),
    );

    expect(intervention.state).toBe("RESCHEDULED");
    expect(intervention.delayCount).toBe(1);
    expect(intervention.delayHistory).toHaveLength(1);
    expect(requiresPatternAnalysis(intervention, 2)).toBe(false);

    intervention = activateRescheduledIntervention(
      intervention,
      new Date("2026-07-16T12:03:00.000Z"),
    );
    expect(intervention.state).toBe("SCHEDULED");
  });

  it("flags a configurable repeated-delay threshold", () => {
    const onceDelayed = makeIntervention("USER_RESPONDED", {
      delayCount: 1,
      scheduledFor: "2026-07-16T14:00:00.000Z",
    });
    const twiceDelayed = rescheduleIntervention(
      onceDelayed,
      "2026-07-17T09:00:00.000Z",
      "The evening slot conflicts again",
      new Date("2026-07-16T14:02:00.000Z"),
    );

    expect(twiceDelayed.delayCount).toBe(2);
    expect(requiresPatternAnalysis(twiceDelayed, 2)).toBe(true);
    expect(() => requiresPatternAnalysis(twiceDelayed, 0)).toThrow(
      DomainInvariantError,
    );
  });

  it("validates a revised schedule at the runtime boundary", () => {
    expect(() =>
      rescheduleIntervention(
        makeIntervention("USER_RESPONDED"),
        "not-a-date",
        null,
        new Date("2026-07-16T12:02:00.000Z"),
      ),
    ).toThrow();
  });

  it("enforces one active intervention per action", () => {
    const first = makeIntervention("SCHEDULED");
    const second = makeIntervention("DUE", {
      id: "intervention-2",
      deliveryKey: "action-1:second",
    });

    expect(() =>
      assertSingleActiveIntervention("action-1", [first, second]),
    ).toThrow(DomainInvariantError);

    expect(() =>
      assertSingleActiveIntervention("action-1", [
        first,
        { ...second, state: "CLOSED" },
      ]),
    ).not.toThrow();
  });

  it("reserves unique delivery keys for idempotent handlers", () => {
    const first = makeIntervention("SCHEDULED");
    const duplicate = makeIntervention("CLOSED", { id: "intervention-2" });

    expect(() => assertUniqueDeliveryKeys([first, duplicate])).toThrow(
      DomainInvariantError,
    );
  });
});
