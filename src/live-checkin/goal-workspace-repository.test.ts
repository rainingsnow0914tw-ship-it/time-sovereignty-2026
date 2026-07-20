import { describe, expect, it } from "vitest";

import type { GoalWorkspace } from "../domain/goals/workspace-schemas";
import {
  LiveGoalWorkspaceStateError,
  transitionGoalWorkspace,
} from "./goal-workspace-repository";

const timestamp = "2026-07-20T00:00:00.000Z";

function workspace(status: GoalWorkspace["status"] = "ACTIVE"): GoalWorkspace {
  return {
    version: 1,
    id: "goal-one",
    ownerId: "private-single-device",
    status,
    goal: {
      id: "goal-one",
      userId: "private-user",
      title: "Practise speaking",
      motivation: "Learn AI English",
      targetWindow: "One month",
      status: status === "ARCHIVED" ? "RETIRED" : status,
      supportAgreementId: "support-one",
      currentActionId: "action-one",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    action: {
      id: "action-one",
      goalId: "goal-one",
      title: "Say three sentences",
      minimumVersion: "Say one sentence",
      status:
        status === "ACTIVE"
          ? "READY"
          : status === "ARCHIVED"
            ? "RETIRED"
            : status,
      nextCheckAt: status === "ACTIVE" ? "2026-07-20T13:00:00.000Z" : null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    supportAgreement: {
      id: "support-one",
      userId: "private-user",
      goalId: "goal-one",
      checkInFrequency: "DAILY",
      preferredCheckInTime: "21:00",
      quietHours: {
        start: "22:30",
        end: "08:00",
        timezone: "Asia/Macau",
      },
      interventionIntensity: "BALANCED",
      preferredTone: "Warm and direct",
      allowedChannels: ["TEXT"],
      progressSharingFormats: ["TEXT"],
      desiredFeedbackStyle: "Specific recognition",
      pauseConditions: ["Illness"],
      strongerFollowUpConditions: ["Two delays"],
      reviewFrequencyDays: 7,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    currentPlanRevisionId: "revision-one",
    schedule: {
      version: 1,
      mode: "DAILY",
      timezone: "Asia/Macau",
      slots: [{ id: "evening", localTime: "21:00", label: null }],
      weekdays: [],
      quietHours: {
        start: "22:30",
        end: "08:00",
        timezone: "Asia/Macau",
      },
      targetEndAt: "2026-08-20T00:00:00.000Z",
      nextOccurrenceAt:
        status === "ACTIVE" ? "2026-07-20T13:00:00.000Z" : null,
    },
    nextCheckInId: status === "ACTIVE" ? "check-in-one" : null,
    nextTaskName: status === "ACTIVE" ? "task-one" : null,
    lastAttendanceAt: null,
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("goal workspace state transitions", () => {
  it("pauses a goal and clears every active wake-up pointer", () => {
    const paused = transitionGoalWorkspace({
      current: workspace(),
      status: "PAUSED",
      now: new Date("2026-07-20T01:00:00.000Z"),
    });

    expect(paused.status).toBe("PAUSED");
    expect(paused.action.status).toBe("PAUSED");
    expect(paused.schedule.nextOccurrenceAt).toBeNull();
    expect(paused.nextCheckInId).toBeNull();
    expect(paused.nextTaskName).toBeNull();
  });

  it("allows an explicitly archived goal to be restored", () => {
    const restored = transitionGoalWorkspace({
      current: workspace("ARCHIVED"),
      status: "ACTIVE",
      now: new Date("2026-07-20T01:00:00.000Z"),
    });

    expect(restored.status).toBe("ACTIVE");
    expect(restored.goal.status).toBe("ACTIVE");
    expect(restored.nextTaskName).toBeNull();
  });

  it("rejects an unsupported direct transition", () => {
    expect(() =>
      transitionGoalWorkspace({
        current: workspace("COMPLETED"),
        status: "PAUSED",
        now: new Date("2026-07-20T01:00:00.000Z"),
      }),
    ).toThrow(LiveGoalWorkspaceStateError);
  });
});
