import type { GoalPlan } from "../domain/goals/schemas";
import {
  GoalAttendanceEntrySchema,
  type GoalAttendanceEntry,
  type GoalSchedulePolicy,
  type GoalWorkspace,
} from "../domain/goals/workspace-schemas";
import type { LiveCheckInConfig } from "./config";
import type { LiveCheckInRepository } from "./firestore-repository";
import type { LiveGoalWorkspaceRepository } from "./goal-workspace-repository";
import { createLiveGoalWorkspaceRepository } from "./goal-workspace-repository";
import type { LiveCheckInDocument } from "./schemas";
import { createLiveCheckInScheduler } from "./scheduler";
import { sha256 } from "./session-auth";

type CheckInWriter = Pick<
  LiveCheckInRepository,
  "createScheduled" | "attachTask" | "findById"
>;
type WorkspaceWriter = Pick<
  LiveGoalWorkspaceRepository,
  | "attachNextOccurrence"
  | "recordAttendance"
  | "transition"
  | "find"
  | "findPlanRevision"
>;
type TaskWriter = ReturnType<typeof createLiveCheckInScheduler>;

function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      read("weekday"),
    ),
  };
}

function localDateTimeToUtc(options: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timezone: string;
}) {
  const desired = Date.UTC(
    options.year,
    options.month - 1,
    options.day,
    options.hour,
    options.minute,
  );
  let candidate = new Date(desired);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const actual = zonedParts(candidate, options.timezone);
    const represented = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    candidate = new Date(candidate.getTime() + desired - represented);
  }
  return candidate;
}

function clockMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function isQuiet(localTime: string, schedule: GoalSchedulePolicy) {
  const value = clockMinutes(localTime);
  const start = clockMinutes(schedule.quietHours.start);
  const end = clockMinutes(schedule.quietHours.end);
  if (start === end) return false;
  return start < end
    ? value >= start && value < end
    : value >= start || value < end;
}

function allowedWeekday(schedule: GoalSchedulePolicy, weekday: number) {
  if (schedule.mode === "WEEKDAYS") return weekday >= 1 && weekday <= 5;
  if (schedule.mode === "WEEKLY") return schedule.weekdays.includes(weekday);
  return true;
}

function withinGoalWindow(candidate: Date, schedule: GoalSchedulePolicy) {
  return (
    !schedule.targetEndAt ||
    candidate.getTime() < new Date(schedule.targetEndAt).getTime()
  );
}

export function nextGoalOccurrence(options: {
  schedule: GoalSchedulePolicy;
  after: Date;
  preferredAt?: string | null;
}): string | null {
  const { schedule, after } = options;
  if (options.preferredAt) {
    const preferred = new Date(options.preferredAt);
    const local = zonedParts(preferred, schedule.timezone);
    const localTime = `${String(local.hour).padStart(2, "0")}:${String(
      local.minute,
    ).padStart(2, "0")}`;
    if (
      preferred.getTime() > after.getTime() + 2_000 &&
      withinGoalWindow(preferred, schedule) &&
      !isQuiet(localTime, schedule)
    ) {
      return preferred.toISOString();
    }
  }

  const localAfter = zonedParts(after, schedule.timezone);
  const baseDate = new Date(
    Date.UTC(localAfter.year, localAfter.month - 1, localAfter.day),
  );
  const slots = [...schedule.slots].sort((left, right) =>
    left.localTime.localeCompare(right.localTime),
  );
  for (let dayOffset = 0; dayOffset <= 14; dayOffset += 1) {
    const localDay = new Date(baseDate);
    localDay.setUTCDate(localDay.getUTCDate() + dayOffset);
    const weekday = localDay.getUTCDay();
    if (!allowedWeekday(schedule, weekday)) continue;
    for (const slot of slots) {
      if (isQuiet(slot.localTime, schedule)) continue;
      const [hour, minute] = slot.localTime.split(":").map(Number);
      const candidate = localDateTimeToUtc({
        year: localDay.getUTCFullYear(),
        month: localDay.getUTCMonth() + 1,
        day: localDay.getUTCDate(),
        hour,
        minute,
        timezone: schedule.timezone,
      });
      if (candidate.getTime() <= after.getTime() + 2_000) continue;
      if (!withinGoalWindow(candidate, schedule)) return null;
      return candidate.toISOString();
    }
  }
  return null;
}

export async function scheduleNextGoalOccurrence(options: {
  workspace: GoalWorkspace;
  plan: GoalPlan;
  sessionId: string;
  ownerId: string;
  sourceKey: string;
  config: LiveCheckInConfig;
  checkInRepository: CheckInWriter;
  workspaceRepository?: WorkspaceWriter;
  scheduler?: TaskWriter;
  now?: () => Date;
  preferredAt?: string | null;
  nextAction?: string;
}): Promise<{
  workspace: GoalWorkspace;
  checkIn: LiveCheckInDocument | null;
}> {
  if (options.workspace.status !== "ACTIVE") {
    return { workspace: options.workspace, checkIn: null };
  }
  const now = options.now ?? (() => new Date());
  const scheduledFor = nextGoalOccurrence({
    schedule: options.workspace.schedule,
    after: now(),
    preferredAt: options.preferredAt,
  });
  if (!scheduledFor) {
    return { workspace: options.workspace, checkIn: null };
  }
  const checkInId = `goal-${sha256(
    `${options.workspace.id}:${options.sourceKey}:${scheduledFor}`,
  ).slice(0, 48)}`;
  const created = await options.checkInRepository.createScheduled({
    id: checkInId,
    sessionId: options.sessionId,
    ownerId: options.ownerId,
    message: `How did “${options.nextAction ?? options.workspace.action.title}” go?`,
    context: {
      goalId: options.workspace.id,
      goal: options.workspace.goal.title,
      motivation: options.workspace.goal.motivation,
      targetWindow: options.workspace.goal.targetWindow,
      cadence: options.plan.cadence,
      currentAction: options.nextAction ?? options.workspace.action.title,
      minimumAction:
        options.nextAction ?? options.workspace.action.minimumVersion,
      preferredTone: options.workspace.supportAgreement.preferredTone,
      locale: /\p{Script=Han}/u.test(options.workspace.goal.title)
        ? "zh-TW"
        : "en",
      quietHours: options.workspace.schedule.quietHours,
    },
    scheduledFor,
  });
  let checkIn = created.checkIn;
  if (!checkIn.taskName) {
    const scheduler =
      options.scheduler ?? createLiveCheckInScheduler(options.config.cloud);
    const scheduled = await scheduler.schedule(checkIn);
    checkIn = await options.checkInRepository.attachTask(
      checkIn.id,
      scheduled.taskName,
    );
  }
  const workspaceRepository =
    options.workspaceRepository ??
    createLiveGoalWorkspaceRepository(options.config.cloud);
  const workspace = await workspaceRepository.attachNextOccurrence({
    ownerId: options.ownerId,
    goalId: options.workspace.id,
    expectedRevision: options.workspace.revision,
    nextOccurrenceAt: scheduledFor,
    nextCheckInId: checkIn.id,
    nextTaskName: checkIn.taskName,
    nextAction: options.nextAction,
  });
  return { workspace, checkIn };
}

export function attendanceFromConfirmedCheckIn(options: {
  workspace: GoalWorkspace;
  checkIn: LiveCheckInDocument;
  recordedAt: string;
}): GoalAttendanceEntry {
  const decision = options.checkIn.decision;
  if (!decision) throw new Error("Attendance requires a confirmed decision.");
  const status = {
    ON_TRACK: "COMPLETED",
    PARTIAL: "PARTIAL",
    BLOCKED: "BLOCKED",
    GOAL_CHANGED: "RESCHEDULED",
    COMPLETED: "COMPLETED",
  }[decision.assessment] as GoalAttendanceEntry["status"];
  return GoalAttendanceEntrySchema.parse({
    version: 1,
    id: `attendance-${sha256(options.checkIn.id).slice(0, 40)}`,
    ownerId: options.workspace.ownerId,
    goalId: options.workspace.id,
    checkInId: options.checkIn.id,
    scheduledFor: options.checkIn.scheduledFor,
    recordedAt: options.recordedAt,
    status,
    evidenceKinds: options.checkIn.evidenceKinds.map((kind) =>
      kind === "PHOTO" ? "PHOTO" : "TEXT",
    ),
    summary: decision.userMessage,
    selectedStrategy: decision.selectedStrategy,
    countsTowardGoal: ["ON_TRACK", "PARTIAL", "COMPLETED"].includes(
      decision.assessment,
    ),
  });
}

export async function advanceGoalAfterConfirmation(options: {
  checkIn: LiveCheckInDocument;
  sessionId: string;
  ownerId: string;
  config: LiveCheckInConfig;
  checkInRepository: CheckInWriter;
  workspaceRepository?: WorkspaceWriter;
  scheduler?: TaskWriter;
  now?: () => Date;
}): Promise<{
  workspace: GoalWorkspace;
  nextCheckIn: LiveCheckInDocument | null;
}> {
  const goalId = options.checkIn.context.goalId;
  if (!goalId || !options.checkIn.decision) {
    throw new Error("A confirmed goal check-in needs a goal and decision.");
  }
  const now = options.now ?? (() => new Date());
  const repository =
    options.workspaceRepository ??
    createLiveGoalWorkspaceRepository(options.config.cloud);
  const workspace = await repository.find(options.ownerId, goalId);
  if (!workspace) throw new Error("The confirmed goal workspace was not found.");
  await repository.recordAttendance({
    ownerId: options.ownerId,
    entry: attendanceFromConfirmedCheckIn({
      workspace,
      checkIn: options.checkIn,
      recordedAt: now().toISOString(),
    }),
  });

  if (workspace.status !== "ACTIVE") {
    return { workspace, nextCheckIn: null };
  }
  if (
    workspace.nextCheckInId &&
    workspace.nextCheckInId !== options.checkIn.id
  ) {
    return {
      workspace,
      nextCheckIn: await options.checkInRepository.findById(
        workspace.nextCheckInId,
      ),
    };
  }
  if (options.checkIn.decision.assessment === "COMPLETED") {
    const completed = await repository.transition({
      ownerId: options.ownerId,
      goalId,
      expectedRevision: workspace.revision,
      status: "COMPLETED",
    });
    return { workspace: completed.workspace, nextCheckIn: null };
  }

  const planRevision = await repository.findPlanRevision(
    options.ownerId,
    goalId,
    workspace.currentPlanRevisionId,
  );
  if (!planRevision) throw new Error("The current goal plan was not found.");
  const scheduled = await scheduleNextGoalOccurrence({
    workspace,
    plan: planRevision.plan,
    sessionId: options.sessionId,
    ownerId: options.ownerId,
    sourceKey: `after-${options.checkIn.id}`,
    config: options.config,
    checkInRepository: options.checkInRepository,
    workspaceRepository: repository,
    scheduler: options.scheduler,
    now,
    preferredAt: options.checkIn.decision.nextFollowUpAt,
    nextAction: options.checkIn.decision.adaptedCommitment,
  });
  if (scheduled.checkIn) {
    return { workspace: scheduled.workspace, nextCheckIn: scheduled.checkIn };
  }
  const completed = await repository.transition({
    ownerId: options.ownerId,
    goalId,
    expectedRevision: scheduled.workspace.revision,
    status: "COMPLETED",
  });
  return { workspace: completed.workspace, nextCheckIn: null };
}
