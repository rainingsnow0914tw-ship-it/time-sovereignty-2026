import { describe, expect, it, vi } from "vitest";

import type { GoalPlan } from "../domain/goals/schemas";
import type { GoalWorkspace } from "../domain/goals/workspace-schemas";
import type { LiveCheckInDocument } from "./schemas";
import {
  advanceGoalAfterConfirmation,
  attendanceFromConfirmedCheckIn,
  nextGoalOccurrence,
  scheduleNextGoalOccurrence,
} from "./goal-loop";
import type { LiveCheckInConfig } from "./config";

const timestamp = "2026-07-20T00:00:00.000Z";

const plan: GoalPlan = {
  goalSummary: "每天做三次一分鐘橋式",
  motivation: "改善久坐後的僵硬",
  targetWindow: "一個月",
  cadence: {
    kind: "HABIT",
    targetEndAt: "2026-08-20T00:00:00.000Z",
    checkInFrequency: "DAILY",
    preferredCheckInTime: "09:00",
    reviewFrequencyDays: 7,
    rationale: "用三個短時段降低阻力。",
    completionSignal: "每天完成三次並留下回報。",
  },
  feasibilityNotes: [],
  firstMilestone: "完成今天第一次",
  bestNextAction: "做一分鐘橋式",
  minimumViableAction: "做一次舒適抬臀",
  initialCheckInProposal: {
    scheduledFor: "2026-07-20T01:00:00.000Z",
    rationale: "早上第一次後確認。",
  },
  assumptionsNeedingConfirmation: [],
};

function workspace(overrides: Partial<GoalWorkspace> = {}): GoalWorkspace {
  return {
    version: 1,
    id: "goal-bridge",
    ownerId: "private-single-device",
    status: "ACTIVE",
    goal: {
      id: "goal-bridge",
      userId: "private-user",
      title: plan.goalSummary,
      motivation: plan.motivation,
      targetWindow: plan.targetWindow,
      status: "ACTIVE",
      supportAgreementId: "support-bridge",
      currentActionId: "action-bridge",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    action: {
      id: "action-bridge",
      goalId: "goal-bridge",
      title: plan.bestNextAction,
      minimumVersion: plan.minimumViableAction,
      status: "READY",
      nextCheckAt: plan.initialCheckInProposal.scheduledFor,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    supportAgreement: {
      id: "support-bridge",
      userId: "private-user",
      goalId: "goal-bridge",
      checkInFrequency: "DAILY",
      preferredCheckInTime: "09:00",
      quietHours: {
        start: "22:30",
        end: "08:00",
        timezone: "Asia/Macau",
      },
      interventionIntensity: "BALANCED",
      preferredTone: "溫暖、直接、務實",
      allowedChannels: ["TEXT", "TTS", "VOICE"],
      progressSharingFormats: ["TEXT", "PHOTO", "VOICE"],
      desiredFeedbackStyle: "具體指出有效之處",
      pauseConditions: ["生病或緊急事件"],
      strongerFollowUpConditions: ["連續延後兩次"],
      reviewFrequencyDays: 7,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    currentPlanRevisionId: "revision-bridge",
    schedule: {
      version: 1,
      mode: "DAILY",
      timezone: "Asia/Macau",
      slots: [
        { id: "morning", localTime: "09:00", label: "Morning" },
        { id: "afternoon", localTime: "14:00", label: "Afternoon" },
        { id: "evening", localTime: "19:00", label: "Evening" },
      ],
      weekdays: [],
      quietHours: {
        start: "22:30",
        end: "08:00",
        timezone: "Asia/Macau",
      },
      targetEndAt: "2026-08-20T00:00:00.000Z",
      nextOccurrenceAt: null,
    },
    nextCheckInId: null,
    nextTaskName: null,
    lastAttendanceAt: null,
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function checkIn(): LiveCheckInDocument {
  return {
    version: 1,
    id: "check-in-bridge-1",
    sessionId: "old-session",
    ownerId: "private-single-device",
    status: "CONFIRMED",
    message: "完成了嗎？",
    context: {
      goalId: "goal-bridge",
      goal: plan.goalSummary,
      motivation: plan.motivation,
      targetWindow: plan.targetWindow,
      cadence: plan.cadence,
      currentAction: plan.bestNextAction,
      minimumAction: plan.minimumViableAction,
      preferredTone: "溫暖、直接、務實",
      locale: "zh-TW",
      quietHours: workspace().schedule.quietHours,
    },
    scheduledFor: "2026-07-20T01:00:00.000Z",
    taskName: "task-bridge-1",
    pendingAt: "2026-07-20T01:00:00.000Z",
    replyId: "reply-bridge-1",
    replyFingerprint: "a".repeat(64),
    attemptCount: 1,
    leaseToken: null,
    leaseExpiresAt: null,
    triage: null,
    recovery: null,
    decision: {
      assessment: "ON_TRACK",
      userMessage: "你完成了今天第一次橋式。",
      adaptedCommitment: "下午兩點再做一分鐘橋式",
      selectedStrategy: "CONTINUE",
      nextFollowUpAt: "2026-07-20T06:00:00.000Z",
      memoryProposal: null,
      dispatchedAgents: [],
    },
    traceRunIds: [],
    evidenceKinds: ["TEXT"],
    retrievedMemoryIds: [],
    memoryDisposition: "DEFER",
    memoryCurationStatus: "COMPLETED",
    memoryCurationLeaseToken: null,
    memoryCurationLeaseExpiresAt: null,
    memoryCurationSummary: "No durable strategy yet.",
    confirmedAt: "2026-07-20T01:01:00.000Z",
    confirmationId: "confirmation-bridge-1",
    nextCheckInId: null,
    nextTaskName: null,
    errorName: null,
    createdAt: timestamp,
    updatedAt: "2026-07-20T01:01:00.000Z",
  };
}

describe("longitudinal goal loop", () => {
  it("walks the three local slots without creating a thirty-day task batch", () => {
    const schedule = workspace().schedule;
    expect(
      nextGoalOccurrence({
        schedule,
        after: new Date("2026-07-20T00:30:00.000Z"),
      }),
    ).toBe("2026-07-20T01:00:00.000Z");
    expect(
      nextGoalOccurrence({
        schedule,
        after: new Date("2026-07-20T01:01:00.000Z"),
      }),
    ).toBe("2026-07-20T06:00:00.000Z");
  });

  it("creates exactly one check-in and attaches exactly one task pointer", async () => {
    const created = {
      ...checkIn(),
      status: "SCHEDULED" as const,
      taskName: null,
      decision: null,
    };
    const attached = { ...created, taskName: "task-next" };
    const checkInRepository = {
      createScheduled: vi.fn(async () => ({ checkIn: created, duplicate: false })),
      attachTask: vi.fn(async () => attached),
      findById: vi.fn(async () => null),
    };
    const nextWorkspace = workspace({
      nextCheckInId: created.id,
      nextTaskName: "task-next",
      revision: 2,
    });
    const workspaceRepository = {
      attachNextOccurrence: vi.fn(async () => nextWorkspace),
      recordAttendance: vi.fn(),
      transition: vi.fn(),
      find: vi.fn(),
      findPlanRevision: vi.fn(),
    };
    const scheduler = {
      schedule: vi.fn(async () => ({
        taskName: "task-next",
        callbackUrl: "https://example.test/callback",
        scheduledFor: "2026-07-20T01:00:00.000Z",
        alreadyExisted: false,
      })),
      cancel: vi.fn(),
    };

    const result = await scheduleNextGoalOccurrence({
      workspace: workspace(),
      plan,
      sessionId: "current-session",
      ownerId: "private-single-device",
      sourceKey: "initial-save",
      config: {} as LiveCheckInConfig,
      checkInRepository,
      workspaceRepository,
      scheduler,
      now: () => new Date("2026-07-20T00:30:00.000Z"),
    });

    expect(result.workspace.nextTaskName).toBe("task-next");
    expect(checkInRepository.createScheduled).toHaveBeenCalledOnce();
    expect(scheduler.schedule).toHaveBeenCalledOnce();
    expect(workspaceRepository.attachNextOccurrence).toHaveBeenCalledOnce();
  });

  it("records attendance and schedules the next AI-selected occurrence", async () => {
    const currentWorkspace = workspace({
      nextCheckInId: "check-in-bridge-1",
      nextTaskName: "task-bridge-1",
      revision: 2,
    });
    const next = { ...checkIn(), id: "check-in-bridge-2", status: "SCHEDULED" as const, decision: null };
    const workspaceRepository = {
      find: vi.fn(async () => currentWorkspace),
      recordAttendance: vi.fn(async ({ entry }) => ({ entry, duplicate: false })),
      findPlanRevision: vi.fn(async () => ({
        version: 1 as const,
        id: "revision-bridge",
        ownerId: "private-single-device",
        goalId: "goal-bridge",
        ordinal: 1,
        source: "GOAL_ARCHITECT" as const,
        plan,
        assumptions: [],
        feedbackSummary: null,
        trace: null,
        createdAt: timestamp,
      })),
      attachNextOccurrence: vi.fn(async () =>
        workspace({
          nextCheckInId: next.id,
          nextTaskName: "task-bridge-2",
          revision: 3,
        }),
      ),
      transition: vi.fn(),
    };
    const checkInRepository = {
      createScheduled: vi.fn(async () => ({ checkIn: next, duplicate: false })),
      attachTask: vi.fn(async () => ({ ...next, taskName: "task-bridge-2" })),
      findById: vi.fn(async () => null),
    };
    const scheduler = {
      schedule: vi.fn(async () => ({
        taskName: "task-bridge-2",
        callbackUrl: "https://example.test/callback",
        scheduledFor: "2026-07-20T06:00:00.000Z",
        alreadyExisted: false,
      })),
      cancel: vi.fn(),
    };

    const result = await advanceGoalAfterConfirmation({
      checkIn: checkIn(),
      sessionId: "new-session",
      ownerId: "private-single-device",
      config: {} as LiveCheckInConfig,
      checkInRepository,
      workspaceRepository,
      scheduler,
      now: () => new Date("2026-07-20T01:01:00.000Z"),
    });

    expect(result.nextCheckIn?.id).toBe("check-in-bridge-2");
    expect(workspaceRepository.recordAttendance).toHaveBeenCalledWith({
      ownerId: "private-single-device",
      entry: expect.objectContaining({
        status: "COMPLETED",
        goalId: "goal-bridge",
        countsTowardGoal: true,
      }),
    });
    expect(checkInRepository.createScheduled).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "new-session",
        ownerId: "private-single-device",
        scheduledFor: "2026-07-20T06:00:00.000Z",
      }),
    );
  });

  it("turns structured decisions into content-safe attendance", () => {
    expect(
      attendanceFromConfirmedCheckIn({
        workspace: workspace(),
        checkIn: checkIn(),
        recordedAt: "2026-07-20T01:01:00.000Z",
      }),
    ).toMatchObject({
      ownerId: "private-single-device",
      goalId: "goal-bridge",
      status: "COMPLETED",
      evidenceKinds: ["TEXT"],
      selectedStrategy: "CONTINUE",
    });
  });
});
