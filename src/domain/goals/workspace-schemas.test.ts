import { describe, expect, it } from "vitest";

import { GoalPlanOutputSchema } from "./schemas";
import {
  GoalAttendanceEntrySchema,
  GoalDeletionTombstoneSchema,
  GoalSchedulePolicySchema,
  GoalWorkspaceSchema,
} from "./workspace-schemas";

const createdAt = "2026-07-20T00:00:00.000Z";

function plan() {
  return GoalPlanOutputSchema.parse({
    goalSummary: "Practise English speaking for one month",
    motivation: "Understand AI topics in English",
    targetWindow: "One month",
    cadence: {
      kind: "HABIT",
      targetEndAt: "2026-08-20T00:00:00.000Z",
      checkInFrequency: "DAILY",
      preferredCheckInTime: "21:00",
      reviewFrequencyDays: 7,
      rationale: "Daily practice supports continuity.",
      completionSignal: "Thirty spoken practice records exist.",
    },
    feasibilityNotes: [],
    firstMilestone: "Complete the first seven practices",
    bestNextAction: "Record three sentences about one AI tool",
    minimumViableAction: "Say one complete English sentence",
    initialCheckInProposal: {
      scheduledFor: "2026-07-20T13:00:00.000Z",
      rationale: "Return after the first practice.",
    },
    assumptionsNeedingConfirmation: [],
  });
}

function schedule() {
  return GoalSchedulePolicySchema.parse({
    version: 1,
    mode: "DAILY",
    timezone: "Asia/Macau",
    slots: [
      { id: "morning", localTime: "09:00", label: "Morning" },
      { id: "afternoon", localTime: "15:00", label: "Afternoon" },
      { id: "evening", localTime: "21:00", label: "Evening" },
    ],
    weekdays: [],
    quietHours: {
      start: "22:30",
      end: "08:00",
      timezone: "Asia/Macau",
    },
    targetEndAt: "2026-08-20T00:00:00.000Z",
    nextOccurrenceAt: "2026-07-20T01:00:00.000Z",
  });
}

describe("longitudinal goal workspace contracts", () => {
  it("supports several daily check-in slots without creating several goals", () => {
    expect(schedule().slots.map((slot) => slot.localTime)).toEqual([
      "09:00",
      "15:00",
      "21:00",
    ]);
  });

  it("rejects duplicate local times", () => {
    expect(() =>
      GoalSchedulePolicySchema.parse({
        ...schedule(),
        slots: [
          { id: "one", localTime: "21:00", label: null },
          { id: "two", localTime: "21:00", label: null },
        ],
      }),
    ).toThrow("duplicate local times");
  });

  it("keeps goal, action, agreement, and cloud workspace identities aligned", () => {
    const goalId = "goal-english";
    const workspace = GoalWorkspaceSchema.parse({
      version: 1,
      id: goalId,
      ownerId: "private-single-device",
      status: "ACTIVE",
      goal: {
        id: goalId,
        userId: "private-user",
        title: plan().goalSummary,
        motivation: plan().motivation,
        targetWindow: plan().targetWindow,
        status: "ACTIVE",
        supportAgreementId: "support-english",
        currentActionId: "action-english",
        createdAt,
        updatedAt: createdAt,
      },
      action: {
        id: "action-english",
        goalId,
        title: plan().bestNextAction,
        minimumVersion: plan().minimumViableAction,
        status: "READY",
        nextCheckAt: "2026-07-20T01:00:00.000Z",
        createdAt,
        updatedAt: createdAt,
      },
      supportAgreement: {
        id: "support-english",
        userId: "private-user",
        goalId,
        checkInFrequency: "DAILY",
        preferredCheckInTime: "21:00",
        quietHours: schedule().quietHours,
        interventionIntensity: "BALANCED",
        preferredTone: "Warm, direct, and practical",
        allowedChannels: ["TEXT", "TTS", "VOICE"],
        progressSharingFormats: ["TEXT", "PHOTO", "VOICE"],
        desiredFeedbackStyle: "Specific recognition and one next step",
        pauseConditions: ["Illness or an emergency"],
        strongerFollowUpConditions: ["Two delays without a replacement"],
        reviewFrequencyDays: 7,
        createdAt,
        updatedAt: createdAt,
      },
      currentPlanRevisionId: "revision-one",
      schedule: schedule(),
      nextCheckInId: "check-in-one",
      nextTaskName: "projects/test/locations/test/queues/test/tasks/one",
      lastAttendanceAt: null,
      revision: 1,
      createdAt,
      updatedAt: createdAt,
    });

    expect(workspace.id).toBe(goalId);
    expect(workspace.schedule.slots).toHaveLength(3);
  });

  it("does not allow a paused goal to retain an active task", () => {
    const base = {
      version: 1,
      id: "goal-english",
      ownerId: "private-single-device",
      status: "PAUSED",
      goal: {
        id: "goal-english",
        userId: "private-user",
        title: plan().goalSummary,
        motivation: plan().motivation,
        targetWindow: plan().targetWindow,
        status: "PAUSED",
        supportAgreementId: "support-english",
        currentActionId: "action-english",
        createdAt,
        updatedAt: createdAt,
      },
      action: {
        id: "action-english",
        goalId: "goal-english",
        title: plan().bestNextAction,
        minimumVersion: plan().minimumViableAction,
        status: "PAUSED",
        nextCheckAt: null,
        createdAt,
        updatedAt: createdAt,
      },
      supportAgreement: {
        id: "support-english",
        userId: "private-user",
        goalId: "goal-english",
        checkInFrequency: "DAILY",
        preferredCheckInTime: "21:00",
        quietHours: schedule().quietHours,
        interventionIntensity: "BALANCED",
        preferredTone: "Warm and direct",
        allowedChannels: ["TEXT"],
        progressSharingFormats: ["TEXT"],
        desiredFeedbackStyle: "Be specific",
        pauseConditions: ["Illness"],
        strongerFollowUpConditions: ["Two unexplained delays"],
        reviewFrequencyDays: 7,
        createdAt,
        updatedAt: createdAt,
      },
      currentPlanRevisionId: "revision-one",
      schedule: { ...schedule(), nextOccurrenceAt: null },
      nextCheckInId: "ghost-check-in",
      nextTaskName: "ghost-task",
      lastAttendanceAt: null,
      revision: 2,
      createdAt,
      updatedAt: createdAt,
    };

    expect(() => GoalWorkspaceSchema.parse(base)).toThrow(
      "cannot retain an active check-in",
    );
  });

  it("stores an attendance outcome without raw evidence", () => {
    const attendance = GoalAttendanceEntrySchema.parse({
      version: 1,
      id: "attendance-one",
      ownerId: "private-single-device",
      goalId: "goal-english",
      checkInId: "check-in-one",
      scheduledFor: "2026-07-20T13:00:00.000Z",
      recordedAt: "2026-07-20T13:04:00.000Z",
      status: "COMPLETED",
      evidenceKinds: ["VOICE"],
      summary: "The user spoke three sentences about an AI tool.",
      selectedStrategy: "CONTINUE",
      countsTowardGoal: true,
    });

    expect(attendance).not.toHaveProperty("rawReply");
    expect(attendance).not.toHaveProperty("image");
  });

  it("keeps deletion tombstones free of goal content", () => {
    const tombstone = GoalDeletionTombstoneSchema.parse({
      version: 1,
      goalId: "goal-english",
      ownerId: "private-single-device",
      invalidatedCheckInId: "check-in-one",
      invalidatedTaskName: "task-one",
      deletedAt: "2026-07-20T02:00:00.000Z",
    });

    expect(Object.keys(tombstone)).not.toContain("title");
    expect(Object.keys(tombstone)).not.toContain("plan");
  });
});
