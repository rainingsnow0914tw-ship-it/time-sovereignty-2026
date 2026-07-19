import { describe, expect, it } from "vitest";

import {
  checkInBelongsToGoal,
  goalCheckInPointers,
  withActiveGoalCheckIn,
  withLastConfirmedGoalCheckIn,
} from "./goal-scope";
import {
  LiveCheckInDocumentSchema,
  LiveDeviceSessionSchema,
} from "./schemas";

const timestamp = "2026-07-20T06:00:00.000Z";

function session() {
  return LiveDeviceSessionSchema.parse({
    version: 1,
    id: "session-one",
    deviceLabel: "S25",
    expiresAt: "2026-07-22T06:00:00.000Z",
    activeCheckInId: null,
    lastConfirmedCheckInId: null,
    createdAt: timestamp,
    revokedAt: null,
    updatedAt: timestamp,
  });
}

function checkIn(goalId: string, id: string) {
  return LiveCheckInDocumentSchema.parse({
    version: 1,
    id,
    sessionId: "session-one",
    status: "SCHEDULED",
    message: "What is true now?",
    context: {
      goalId,
      goal: "A goal title that may later be renamed",
      motivation: "Make progress",
      targetWindow: "This month",
      currentAction: "Take one step",
      minimumAction: "Open the work",
      preferredTone: "Warm",
    },
    scheduledFor: "2026-07-20T06:10:00.000Z",
    taskName: null,
    pendingAt: null,
    replyId: null,
    replyFingerprint: null,
    attemptCount: 0,
    leaseToken: null,
    leaseExpiresAt: null,
    triage: null,
    recovery: null,
    decision: null,
    traceRunIds: [],
    confirmedAt: null,
    confirmationId: null,
    nextCheckInId: null,
    nextTaskName: null,
    errorName: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

describe("goal-scoped live check-in pointers", () => {
  it("upgrades a legacy session to independent goal rooms", () => {
    const drawing = withActiveGoalCheckIn(
      session(),
      "goal-drawing",
      "check-drawing",
      timestamp,
    );
    const both = withActiveGoalCheckIn(
      drawing,
      "goal-bridge",
      "check-bridge",
      timestamp,
    );
    const confirmedDrawing = withLastConfirmedGoalCheckIn(
      both,
      "goal-drawing",
      "check-drawing",
      timestamp,
    );

    expect(goalCheckInPointers(confirmedDrawing, "goal-drawing")).toMatchObject({
      activeCheckInId: "check-drawing",
      lastConfirmedCheckInId: "check-drawing",
    });
    expect(goalCheckInPointers(confirmedDrawing, "goal-bridge")).toMatchObject({
      activeCheckInId: "check-bridge",
      lastConfirmedCheckInId: null,
    });
  });

  it("never treats another goal's event as the current goal", () => {
    expect(checkInBelongsToGoal(checkIn("goal-drawing", "drawing"), "goal-bridge"))
      .toBe(false);
    expect(checkInBelongsToGoal(checkIn("goal-bridge", "bridge"), "goal-bridge"))
      .toBe(true);
  });
});
