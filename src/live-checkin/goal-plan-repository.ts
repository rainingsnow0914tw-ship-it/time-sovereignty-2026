import { randomUUID } from "node:crypto";

import { Firestore } from "@google-cloud/firestore";
import { z } from "zod";

import {
  AgentRunTraceSchema,
  type AgentRunTrace,
} from "../domain/agents/schemas";
import { GoalPlanSchema, type GoalPlan } from "../domain/goals/schemas";
import type { CloudConfig } from "../infrastructure/gcp/config";

const GOAL_PLAN_LEASE_SECONDS = 300;

export const LiveGoalPlanReceiptSchema = z
  .object({
    version: z.literal(1),
    id: z.string().trim().min(1).max(128),
    sessionId: z.string().trim().min(1).max(128),
    requestId: z.string().trim().min(1).max(128),
    requestFingerprint: z.string().length(64),
    status: z.enum(["IN_FLIGHT", "COMPLETED", "FAILED"]),
    leaseToken: z.string().uuid(),
    leaseExpiresAt: z.string().datetime({ offset: true }),
    attemptCount: z.number().int().positive(),
    plan: GoalPlanSchema.nullable(),
    trace: AgentRunTraceSchema.nullable(),
    errorName: z.string().trim().min(1).max(240).nullable(),
    createdAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }).nullable(),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type LiveGoalPlanReceipt = z.infer<typeof LiveGoalPlanReceiptSchema>;

export class LiveGoalPlanStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveGoalPlanStateError";
  }
}

export type LiveGoalPlanClaim =
  | { kind: "CLAIMED"; receipt: LiveGoalPlanReceipt }
  | { kind: "DUPLICATE"; receipt: LiveGoalPlanReceipt }
  | { kind: "BUSY"; retryAfterSeconds: number };

export interface LiveGoalPlanRepository {
  claim(options: {
    id: string;
    sessionId: string;
    requestId: string;
    requestFingerprint: string;
  }): Promise<LiveGoalPlanClaim>;
  complete(options: {
    id: string;
    leaseToken: string;
    plan: GoalPlan;
    trace: AgentRunTrace;
  }): Promise<LiveGoalPlanReceipt>;
  fail(options: {
    id: string;
    leaseToken: string;
    errorName: string;
  }): Promise<void>;
}

interface ClaimDecisionInput {
  id: string;
  sessionId: string;
  requestId: string;
  requestFingerprint: string;
  current: LiveGoalPlanReceipt | null;
  now: Date;
  leaseToken: string;
  leaseSeconds?: number;
}

export function decideLiveGoalPlanClaim({
  id,
  sessionId,
  requestId,
  requestFingerprint,
  current,
  now,
  leaseToken,
  leaseSeconds = GOAL_PLAN_LEASE_SECONDS,
}: ClaimDecisionInput): LiveGoalPlanClaim {
  if (current) {
    if (
      current.sessionId !== sessionId ||
      current.requestId !== requestId ||
      current.requestFingerprint !== requestFingerprint
    ) {
      throw new LiveGoalPlanStateError(
        "Goal-plan request identity does not match the stored receipt.",
      );
    }
    if (current.status === "COMPLETED") {
      if (!current.plan || !current.trace) {
        throw new LiveGoalPlanStateError(
          "Completed goal-plan receipt is missing its validated result.",
        );
      }
      return { kind: "DUPLICATE", receipt: current };
    }
    if (current.status === "IN_FLIGHT") {
      const remainingMs =
        new Date(current.leaseExpiresAt).getTime() - now.getTime();
      if (remainingMs > 0) {
        return {
          kind: "BUSY",
          retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1_000)),
        };
      }
    }
  }

  const timestamp = now.toISOString();
  return {
    kind: "CLAIMED",
    receipt: LiveGoalPlanReceiptSchema.parse({
      version: 1,
      id,
      sessionId,
      requestId,
      requestFingerprint,
      status: "IN_FLIGHT",
      leaseToken,
      leaseExpiresAt: new Date(
        now.getTime() + leaseSeconds * 1_000,
      ).toISOString(),
      attemptCount: (current?.attemptCount ?? 0) + 1,
      plan: null,
      trace: null,
      errorName: null,
      createdAt: current?.createdAt ?? timestamp,
      completedAt: null,
      updatedAt: timestamp,
    }),
  };
}

let sharedFirestore: Firestore | null = null;

export function createLiveGoalPlanRepository(
  config: CloudConfig,
  options: {
    firestore?: Firestore;
    now?: () => Date;
    leaseTokenFactory?: () => string;
  } = {},
): LiveGoalPlanRepository {
  if (!options.firestore && !sharedFirestore) {
    sharedFirestore = new Firestore({
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId,
    });
  }
  const firestore = options.firestore ?? sharedFirestore!;
  const now = options.now ?? (() => new Date());
  const leaseTokenFactory = options.leaseTokenFactory ?? randomUUID;
  const receiptRef = (id: string) =>
    firestore.collection("live_goal_plans").doc(id);

  return {
    async claim({ id, sessionId, requestId, requestFingerprint }) {
      const ref = receiptRef(id);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists
          ? LiveGoalPlanReceiptSchema.parse(snapshot.data())
          : null;
        const decision = decideLiveGoalPlanClaim({
          id,
          sessionId,
          requestId,
          requestFingerprint,
          current,
          now: now(),
          leaseToken: leaseTokenFactory(),
        });
        if (decision.kind === "CLAIMED") {
          transaction.set(ref, decision.receipt);
        }
        return decision;
      });
    },

    async complete({ id, leaseToken, plan, trace }) {
      const ref = receiptRef(id);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) {
          throw new LiveGoalPlanStateError("Goal-plan receipt was not found.");
        }
        const current = LiveGoalPlanReceiptSchema.parse(snapshot.data());
        if (current.status === "COMPLETED") return current;
        if (current.leaseToken !== leaseToken) {
          throw new LiveGoalPlanStateError(
            "Goal-plan completion does not own the active lease.",
          );
        }
        const timestamp = now().toISOString();
        const completed = LiveGoalPlanReceiptSchema.parse({
          ...current,
          status: "COMPLETED",
          plan,
          trace,
          errorName: null,
          completedAt: timestamp,
          updatedAt: timestamp,
        });
        transaction.set(ref, completed);
        return completed;
      });
    },

    async fail({ id, leaseToken, errorName }) {
      const ref = receiptRef(id);
      await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) return;
        const current = LiveGoalPlanReceiptSchema.parse(snapshot.data());
        if (
          current.status === "COMPLETED" ||
          current.leaseToken !== leaseToken
        ) {
          return;
        }
        transaction.set(
          ref,
          LiveGoalPlanReceiptSchema.parse({
            ...current,
            status: "FAILED",
            plan: null,
            trace: null,
            errorName: errorName.slice(0, 240) || "UnknownError",
            completedAt: null,
            updatedAt: now().toISOString(),
          }),
        );
      });
    },
  };
}
