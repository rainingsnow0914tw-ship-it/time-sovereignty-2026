import type { GoalPlan } from "../domain/goals/schemas";
import {
  GoalAttendanceEntrySchema,
  type GoalAttendanceEntry,
  type GoalWorkspace,
} from "../domain/goals/workspace-schemas";
import type { LiveCheckInConfig } from "./config";
import type { LiveCheckInRepository } from "./firestore-repository";
import type { LiveGoalWorkspaceRepository } from "./goal-workspace-repository";
import { createLiveGoalWorkspaceRepository } from "./goal-workspace-repository";
import type { LiveCheckInDocument } from "./schemas";
import { nextGoalOccurrence } from "./goal-schedule";
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
