import {
  GoalPlanRevisionSchema,
  GoalScheduleModeSchema,
  GoalWorkspaceSchema,
  type GoalPlanRevision,
  type GoalScheduleMode,
  type GoalWorkspace,
} from "../domain/goals/workspace-schemas";
import type { LocalOnboardingRecord } from "../repositories/local-onboarding-repository";

function scheduleMode(
  frequency: LocalOnboardingRecord["supportAgreement"]["checkInFrequency"],
): GoalScheduleMode {
  return GoalScheduleModeSchema.parse(
    frequency === "CUSTOM" ? "AI_LED" : frequency,
  );
}

function localWeekday(instant: string, timezone: string): number {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(new Date(instant));
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value);
}

export function createInitialGoalWorkspace(options: {
  ownerId: string;
  requestId: string;
  record: LocalOnboardingRecord;
  scheduleTimes?: string[];
}): { workspace: GoalWorkspace; planRevision: GoalPlanRevision } {
  const { record } = options;
  const goalId = record.goal.id;
  const revisionId = `${goalId}-${options.requestId}-plan-1`.slice(0, 128);
  const timezone = record.supportAgreement.quietHours.timezone;
  const mode = scheduleMode(record.supportAgreement.checkInFrequency);
  const scheduleTimes = options.scheduleTimes?.length
    ? options.scheduleTimes
    : [record.supportAgreement.preferredCheckInTime];
  const schedule = {
    version: 1 as const,
    mode,
    timezone,
    slots: scheduleTimes.map((localTime, index) => ({
      id: `${goalId}-slot-${index + 1}`.slice(0, 128),
      localTime,
      label: scheduleTimes.length > 1 ? `Session ${index + 1}` : null,
    })),
    weekdays:
      mode === "WEEKLY"
        ? [localWeekday(record.plan.initialCheckInProposal.scheduledFor, timezone)]
        : [],
    quietHours: record.supportAgreement.quietHours,
    targetEndAt: record.plan.cadence.targetEndAt,
    nextOccurrenceAt: record.plan.initialCheckInProposal.scheduledFor,
  };
  const workspace = GoalWorkspaceSchema.parse({
    version: 1,
    id: goalId,
    ownerId: options.ownerId,
    status: "ACTIVE",
    goal: { ...record.goal, status: "ACTIVE" },
    action: {
      ...record.action,
      status: "READY",
      nextCheckAt: record.plan.initialCheckInProposal.scheduledFor,
    },
    supportAgreement: record.supportAgreement,
    currentPlanRevisionId: revisionId,
    schedule,
    nextCheckInId: null,
    nextTaskName: null,
    lastAttendanceAt: null,
    revision: 1,
    createdAt: record.savedAt,
    updatedAt: record.savedAt,
  });
  const planRevision = GoalPlanRevisionSchema.parse({
    version: 1,
    id: revisionId,
    ownerId: options.ownerId,
    goalId,
    ordinal: 1,
    source: "GOAL_ARCHITECT",
    plan: record.plan,
    assumptions: record.plan.assumptionsNeedingConfirmation.map(
      (statement, index) => ({
        id: `${revisionId}-assumption-${index + 1}`.slice(0, 128),
        statement,
        disposition: "PENDING",
        userNote: null,
      }),
    ),
    feedbackSummary: null,
    trace: record.agentTrace,
    createdAt: record.savedAt,
  });
  return { workspace, planRevision };
}
