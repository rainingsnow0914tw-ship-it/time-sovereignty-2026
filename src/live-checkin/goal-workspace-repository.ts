import { Firestore } from "@google-cloud/firestore";

import type { CloudConfig } from "../infrastructure/gcp/config";
import {
  GoalAttendanceEntrySchema,
  GoalDeletionTombstoneSchema,
  GoalPlanRevisionSchema,
  GoalWorkspaceSchema,
  type GoalAttendanceEntry,
  type GoalDeletionTombstone,
  type GoalPlanRevision,
  type GoalWorkspace,
  type GoalWorkspaceStatus,
} from "../domain/goals/workspace-schemas";

export class LiveGoalWorkspaceStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveGoalWorkspaceStateError";
  }
}

export interface LiveGoalWorkspaceRepository {
  create(options: {
    workspace: GoalWorkspace;
    planRevision: GoalPlanRevision;
  }): Promise<{ workspace: GoalWorkspace; duplicate: boolean }>;
  list(ownerId: string): Promise<GoalWorkspace[]>;
  find(ownerId: string, goalId: string): Promise<GoalWorkspace | null>;
  findPlanRevision(
    ownerId: string,
    goalId: string,
    revisionId: string,
  ): Promise<GoalPlanRevision | null>;
  isDeliverable(goalId: string): Promise<boolean>;
  transition(options: {
    ownerId: string;
    goalId: string;
    expectedRevision: number;
    status: GoalWorkspaceStatus;
  }): Promise<{ workspace: GoalWorkspace; invalidatedTaskName: string | null }>;
  savePlanRevision(options: {
    ownerId: string;
    workspace: GoalWorkspace;
    planRevision: GoalPlanRevision;
    expectedRevision: number;
  }): Promise<GoalWorkspace>;
  attachNextOccurrence(options: {
    ownerId: string;
    goalId: string;
    expectedRevision: number;
    nextOccurrenceAt: string | null;
    nextCheckInId: string | null;
    nextTaskName: string | null;
  }): Promise<GoalWorkspace>;
  recordAttendance(options: {
    ownerId: string;
    entry: GoalAttendanceEntry;
  }): Promise<{ entry: GoalAttendanceEntry; duplicate: boolean }>;
  listAttendance(ownerId: string, goalId: string): Promise<GoalAttendanceEntry[]>;
  delete(options: {
    ownerId: string;
    goalId: string;
    expectedRevision: number;
  }): Promise<{ tombstone: GoalDeletionTombstone; duplicate: boolean }>;
  findTombstone(ownerId: string, goalId: string): Promise<GoalDeletionTombstone | null>;
}

const STATUS_TRANSITIONS: Record<
  GoalWorkspaceStatus,
  readonly GoalWorkspaceStatus[]
> = {
  ACTIVE: ["PAUSED", "COMPLETED", "ARCHIVED"],
  PAUSED: ["ACTIVE", "COMPLETED", "ARCHIVED"],
  COMPLETED: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: ["ACTIVE"],
};

function domainGoalStatus(status: GoalWorkspaceStatus) {
  if (status === "ARCHIVED") return "RETIRED" as const;
  return status;
}

function domainActionStatus(status: GoalWorkspaceStatus) {
  if (status === "ACTIVE") return "READY" as const;
  if (status === "ARCHIVED") return "RETIRED" as const;
  return status;
}

export function transitionGoalWorkspace(options: {
  current: GoalWorkspace;
  status: GoalWorkspaceStatus;
  now: Date;
}): GoalWorkspace {
  if (options.current.status === options.status) return options.current;
  if (!STATUS_TRANSITIONS[options.current.status].includes(options.status)) {
    throw new LiveGoalWorkspaceStateError(
      `Cannot transition goal from ${options.current.status} to ${options.status}.`,
    );
  }
  const timestamp = options.now.toISOString();
  const active = options.status === "ACTIVE";
  return GoalWorkspaceSchema.parse({
    ...options.current,
    status: options.status,
    goal: {
      ...options.current.goal,
      status: domainGoalStatus(options.status),
      updatedAt: timestamp,
    },
    action: {
      ...options.current.action,
      status: domainActionStatus(options.status),
      nextCheckAt: active ? options.current.action.nextCheckAt : null,
      updatedAt: timestamp,
    },
    schedule: active
      ? options.current.schedule
      : { ...options.current.schedule, nextOccurrenceAt: null },
    nextCheckInId: active ? options.current.nextCheckInId : null,
    nextTaskName: active ? options.current.nextTaskName : null,
    revision: options.current.revision + 1,
    updatedAt: timestamp,
  });
}

function assertOwner(workspace: GoalWorkspace, ownerId: string): void {
  if (workspace.ownerId !== ownerId) {
    throw new LiveGoalWorkspaceStateError("Goal workspace owner does not match.");
  }
}

function assertRevision(workspace: GoalWorkspace, expectedRevision: number): void {
  if (workspace.revision !== expectedRevision) {
    throw new LiveGoalWorkspaceStateError("Goal workspace revision is stale.");
  }
}

let sharedFirestore: Firestore | null = null;

export function createLiveGoalWorkspaceRepository(
  config: CloudConfig,
  options: { firestore?: Firestore; now?: () => Date } = {},
): LiveGoalWorkspaceRepository {
  if (!options.firestore && !sharedFirestore) {
    sharedFirestore = new Firestore({
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId,
    });
  }
  const firestore = options.firestore ?? sharedFirestore!;
  const now = options.now ?? (() => new Date());
  const workspaceRef = (goalId: string) =>
    firestore.collection("live_goal_workspaces").doc(goalId);
  const tombstoneRef = (goalId: string) =>
    firestore.collection("live_goal_tombstones").doc(goalId);

  return {
    async create({ workspace: rawWorkspace, planRevision: rawPlanRevision }) {
      const workspace = GoalWorkspaceSchema.parse(rawWorkspace);
      const planRevision = GoalPlanRevisionSchema.parse(rawPlanRevision);
      if (
        workspace.ownerId !== planRevision.ownerId ||
        workspace.id !== planRevision.goalId ||
        workspace.currentPlanRevisionId !== planRevision.id
      ) {
        throw new LiveGoalWorkspaceStateError(
          "Initial goal workspace and plan revision do not match.",
        );
      }
      const ref = workspaceRef(workspace.id);
      const revisionRef = ref.collection("revisions").doc(planRevision.id);
      const deletedRef = tombstoneRef(workspace.id);
      return firestore.runTransaction(async (transaction) => {
        const [snapshot, deletedSnapshot] = await Promise.all([
          transaction.get(ref),
          transaction.get(deletedRef),
        ]);
        if (deletedSnapshot.exists) {
          const tombstone = GoalDeletionTombstoneSchema.parse(
            deletedSnapshot.data(),
          );
          if (tombstone.ownerId === workspace.ownerId) {
            throw new LiveGoalWorkspaceStateError(
              "A deleted goal identity cannot be silently reused.",
            );
          }
        }
        if (snapshot.exists) {
          const current = GoalWorkspaceSchema.parse(snapshot.data());
          assertOwner(current, workspace.ownerId);
          if (
            current.currentPlanRevisionId === planRevision.id &&
            current.revision === workspace.revision
          ) {
            return { workspace: current, duplicate: true };
          }
          throw new LiveGoalWorkspaceStateError(
            "Goal workspace already exists with different content.",
          );
        }
        transaction.set(ref, workspace);
        transaction.set(revisionRef, planRevision);
        return { workspace, duplicate: false };
      });
    },

    async list(ownerId) {
      const snapshot = await firestore
        .collection("live_goal_workspaces")
        .where("ownerId", "==", ownerId)
        .get();
      return snapshot.docs
        .map((document) => GoalWorkspaceSchema.parse(document.data()))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },

    async find(ownerId, goalId) {
      const snapshot = await workspaceRef(goalId).get();
      if (!snapshot.exists) return null;
      const workspace = GoalWorkspaceSchema.parse(snapshot.data());
      assertOwner(workspace, ownerId);
      return workspace;
    },

    async findPlanRevision(ownerId, goalId, revisionId) {
      const [workspaceSnapshot, revisionSnapshot] = await Promise.all([
        workspaceRef(goalId).get(),
        workspaceRef(goalId).collection("revisions").doc(revisionId).get(),
      ]);
      if (!workspaceSnapshot.exists || !revisionSnapshot.exists) return null;
      const workspace = GoalWorkspaceSchema.parse(workspaceSnapshot.data());
      assertOwner(workspace, ownerId);
      const revision = GoalPlanRevisionSchema.parse(revisionSnapshot.data());
      if (revision.ownerId !== ownerId || revision.goalId !== goalId) {
        throw new LiveGoalWorkspaceStateError(
          "Goal plan revision does not belong to this workspace.",
        );
      }
      return revision;
    },

    async isDeliverable(goalId) {
      const [workspaceSnapshot, deletedSnapshot] = await Promise.all([
        workspaceRef(goalId).get(),
        tombstoneRef(goalId).get(),
      ]);
      if (deletedSnapshot.exists || !workspaceSnapshot.exists) return false;
      const workspace = GoalWorkspaceSchema.parse(workspaceSnapshot.data());
      return workspace.status === "ACTIVE";
    },

    async transition({ ownerId, goalId, expectedRevision, status }) {
      const ref = workspaceRef(goalId);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) {
          throw new LiveGoalWorkspaceStateError("Goal workspace was not found.");
        }
        const current = GoalWorkspaceSchema.parse(snapshot.data());
        assertOwner(current, ownerId);
        assertRevision(current, expectedRevision);
        const invalidatedTaskName =
          status === "ACTIVE" ? null : current.nextTaskName;
        const workspace = transitionGoalWorkspace({
          current,
          status,
          now: now(),
        });
        transaction.set(ref, workspace);
        return { workspace, invalidatedTaskName };
      });
    },

    async savePlanRevision({
      ownerId,
      workspace: rawWorkspace,
      planRevision: rawPlanRevision,
      expectedRevision,
    }) {
      const workspace = GoalWorkspaceSchema.parse(rawWorkspace);
      const planRevision = GoalPlanRevisionSchema.parse(rawPlanRevision);
      assertOwner(workspace, ownerId);
      if (
        planRevision.ownerId !== ownerId ||
        planRevision.goalId !== workspace.id ||
        workspace.currentPlanRevisionId !== planRevision.id
      ) {
        throw new LiveGoalWorkspaceStateError(
          "Goal plan revision does not match its workspace.",
        );
      }
      const ref = workspaceRef(workspace.id);
      const revisionRef = ref.collection("revisions").doc(planRevision.id);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) {
          throw new LiveGoalWorkspaceStateError("Goal workspace was not found.");
        }
        const current = GoalWorkspaceSchema.parse(snapshot.data());
        assertOwner(current, ownerId);
        assertRevision(current, expectedRevision);
        const next = GoalWorkspaceSchema.parse({
          ...workspace,
          revision: current.revision + 1,
          createdAt: current.createdAt,
          updatedAt: now().toISOString(),
        });
        transaction.set(ref, next);
        transaction.set(revisionRef, planRevision);
        return next;
      });
    },

    async attachNextOccurrence({
      ownerId,
      goalId,
      expectedRevision,
      nextOccurrenceAt,
      nextCheckInId,
      nextTaskName,
    }) {
      const ref = workspaceRef(goalId);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) {
          throw new LiveGoalWorkspaceStateError("Goal workspace was not found.");
        }
        const current = GoalWorkspaceSchema.parse(snapshot.data());
        assertOwner(current, ownerId);
        assertRevision(current, expectedRevision);
        if (current.status !== "ACTIVE") {
          throw new LiveGoalWorkspaceStateError(
            "Only an active goal can receive a next occurrence.",
          );
        }
        const timestamp = now().toISOString();
        const next = GoalWorkspaceSchema.parse({
          ...current,
          schedule: { ...current.schedule, nextOccurrenceAt },
          action: { ...current.action, nextCheckAt: nextOccurrenceAt, updatedAt: timestamp },
          nextCheckInId,
          nextTaskName,
          revision: current.revision + 1,
          updatedAt: timestamp,
        });
        transaction.set(ref, next);
        return next;
      });
    },

    async recordAttendance({ ownerId, entry: rawEntry }) {
      const entry = GoalAttendanceEntrySchema.parse(rawEntry);
      if (entry.ownerId !== ownerId) {
        throw new LiveGoalWorkspaceStateError("Attendance owner does not match.");
      }
      const ref = workspaceRef(entry.goalId);
      const attendanceRef = ref.collection("attendance").doc(entry.id);
      return firestore.runTransaction(async (transaction) => {
        const [workspaceSnapshot, attendanceSnapshot] = await Promise.all([
          transaction.get(ref),
          transaction.get(attendanceRef),
        ]);
        if (!workspaceSnapshot.exists) {
          throw new LiveGoalWorkspaceStateError("Goal workspace was not found.");
        }
        const workspace = GoalWorkspaceSchema.parse(workspaceSnapshot.data());
        assertOwner(workspace, ownerId);
        if (attendanceSnapshot.exists) {
          return {
            entry: GoalAttendanceEntrySchema.parse(attendanceSnapshot.data()),
            duplicate: true,
          };
        }
        transaction.set(attendanceRef, entry);
        transaction.set(ref, {
          ...workspace,
          lastAttendanceAt: entry.recordedAt,
          revision: workspace.revision + 1,
          updatedAt: now().toISOString(),
        });
        return { entry, duplicate: false };
      });
    },

    async listAttendance(ownerId, goalId) {
      const workspace = await this.find(ownerId, goalId);
      if (!workspace) return [];
      const snapshot = await workspaceRef(goalId).collection("attendance").get();
      return snapshot.docs
        .map((document) => GoalAttendanceEntrySchema.parse(document.data()))
        .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
    },

    async delete({ ownerId, goalId, expectedRevision }) {
      const ref = workspaceRef(goalId);
      const deletedRef = tombstoneRef(goalId);
      const result = await firestore.runTransaction(async (transaction) => {
        const [snapshot, deletedSnapshot] = await Promise.all([
          transaction.get(ref),
          transaction.get(deletedRef),
        ]);
        if (deletedSnapshot.exists) {
          const tombstone = GoalDeletionTombstoneSchema.parse(
            deletedSnapshot.data(),
          );
          if (tombstone.ownerId !== ownerId) {
            throw new LiveGoalWorkspaceStateError(
              "Goal deletion owner does not match.",
            );
          }
          return { tombstone, duplicate: true };
        }
        if (!snapshot.exists) {
          throw new LiveGoalWorkspaceStateError("Goal workspace was not found.");
        }
        const workspace = GoalWorkspaceSchema.parse(snapshot.data());
        assertOwner(workspace, ownerId);
        assertRevision(workspace, expectedRevision);
        const tombstone = GoalDeletionTombstoneSchema.parse({
          version: 1,
          goalId,
          ownerId,
          invalidatedCheckInId: workspace.nextCheckInId,
          invalidatedTaskName: workspace.nextTaskName,
          deletedAt: now().toISOString(),
        });
        transaction.set(deletedRef, tombstone);
        transaction.delete(ref);
        return { tombstone, duplicate: false };
      });
      if (!result.duplicate) {
        await firestore.recursiveDelete(ref);
      }
      return result;
    },

    async findTombstone(ownerId, goalId) {
      const snapshot = await tombstoneRef(goalId).get();
      if (!snapshot.exists) return null;
      const tombstone = GoalDeletionTombstoneSchema.parse(snapshot.data());
      if (tombstone.ownerId !== ownerId) {
        throw new LiveGoalWorkspaceStateError(
          "Goal deletion owner does not match.",
        );
      }
      return tombstone;
    },
  };
}
