import { randomUUID } from "node:crypto";

import { Firestore } from "@google-cloud/firestore";
import { z } from "zod";

import {
  ChiefOfStaffOutputSchema,
  SubAgentRoleSchema,
  type ChiefOfStaffOutput,
  type SubAgentRole,
} from "../../domain/agents/schemas";
import type { CloudConfig } from "../gcp/config";

export const OrchestrationRunReceiptSchema = z
  .object({
    version: z.literal(1),
    requestId: z.string().trim().min(1).max(64),
    status: z.enum(["IN_FLIGHT", "COMPLETED", "FAILED"]),
    leaseToken: z.string().uuid(),
    leaseExpiresAt: z.string().datetime({ offset: true }),
    taskName: z.string().trim().min(1).max(1_000).nullable(),
    attemptCount: z.number().int().positive(),
    dispatchedAgents: z.array(SubAgentRoleSchema).max(3),
    decision: ChiefOfStaffOutputSchema.nullable(),
    errorName: z.string().trim().min(1).max(240).nullable(),
    startedAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }).nullable(),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type OrchestrationRunReceipt = z.infer<
  typeof OrchestrationRunReceiptSchema
>;

export class OrchestrationRunLeaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrchestrationRunLeaseError";
  }
}

export type OrchestrationRunClaim =
  | { kind: "CLAIMED"; receipt: OrchestrationRunReceipt }
  | { kind: "BUSY"; retryAfterSeconds: number }
  | { kind: "DUPLICATE"; receipt: OrchestrationRunReceipt };

interface ClaimInput {
  requestId: string;
  current: OrchestrationRunReceipt | null;
  dispatchedAgents: SubAgentRole[];
  taskName: string | null;
  now: Date;
  leaseSeconds: number;
  leaseToken: string;
}

export function decideOrchestrationRunClaim({
  requestId,
  current,
  dispatchedAgents,
  taskName,
  now,
  leaseSeconds,
  leaseToken,
}: ClaimInput): OrchestrationRunClaim {
  if (current?.status === "COMPLETED") {
    return { kind: "DUPLICATE", receipt: current };
  }

  if (current?.status === "IN_FLIGHT") {
    const remainingMs = new Date(current.leaseExpiresAt).getTime() - now.getTime();
    if (remainingMs > 0) {
      return {
        kind: "BUSY",
        retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1_000)),
      };
    }
  }

  const timestamp = now.toISOString();
  return {
    kind: "CLAIMED",
    receipt: OrchestrationRunReceiptSchema.parse({
      version: 1,
      requestId,
      status: "IN_FLIGHT",
      leaseToken,
      leaseExpiresAt: new Date(now.getTime() + leaseSeconds * 1_000).toISOString(),
      taskName,
      attemptCount: (current?.attemptCount ?? 0) + 1,
      dispatchedAgents,
      decision: null,
      errorName: null,
      startedAt: current?.startedAt ?? timestamp,
      completedAt: null,
      updatedAt: timestamp,
    }),
  };
}

export function completeOrchestrationRun(
  receipt: OrchestrationRunReceipt,
  leaseToken: string,
  decision: ChiefOfStaffOutput,
  now: Date,
): OrchestrationRunReceipt {
  if (receipt.status === "COMPLETED") return receipt;
  assertLeaseOwner(receipt, leaseToken);
  const timestamp = now.toISOString();
  return OrchestrationRunReceiptSchema.parse({
    ...receipt,
    status: "COMPLETED",
    decision,
    errorName: null,
    completedAt: timestamp,
    updatedAt: timestamp,
  });
}

export function failOrchestrationRun(
  receipt: OrchestrationRunReceipt,
  leaseToken: string,
  errorName: string,
  now: Date,
): OrchestrationRunReceipt {
  if (receipt.status === "COMPLETED") return receipt;
  assertLeaseOwner(receipt, leaseToken);
  return OrchestrationRunReceiptSchema.parse({
    ...receipt,
    status: "FAILED",
    decision: null,
    errorName: errorName.slice(0, 240) || "UnknownError",
    completedAt: null,
    updatedAt: now.toISOString(),
  });
}

function assertLeaseOwner(
  receipt: OrchestrationRunReceipt,
  leaseToken: string,
): void {
  if (receipt.leaseToken !== leaseToken) {
    throw new OrchestrationRunLeaseError(
      "Orchestration completion does not own the active lease.",
    );
  }
}

export interface OrchestrationRunRepository {
  claim(options: {
    requestId: string;
    dispatchedAgents: SubAgentRole[];
    taskName: string | null;
  }): Promise<OrchestrationRunClaim>;
  complete(options: {
    requestId: string;
    leaseToken: string;
    decision: ChiefOfStaffOutput;
  }): Promise<OrchestrationRunReceipt>;
  fail(options: {
    requestId: string;
    leaseToken: string;
    errorName: string;
  }): Promise<OrchestrationRunReceipt>;
}

let sharedFirestore: Firestore | null = null;

export function createFirestoreOrchestrationRunRepository(
  config: CloudConfig,
  options: {
    firestore?: Firestore;
    now?: () => Date;
    leaseSeconds?: number;
    leaseTokenFactory?: () => string;
  } = {},
): OrchestrationRunRepository {
  if (!sharedFirestore) {
    sharedFirestore = new Firestore({
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId,
    });
  }
  const firestore = options.firestore ?? sharedFirestore;
  const now = options.now ?? (() => new Date());
  const leaseSeconds = options.leaseSeconds ?? 300;
  const leaseTokenFactory = options.leaseTokenFactory ?? randomUUID;

  const receiptRef = (requestId: string) =>
    firestore.collection("orchestration_runs").doc(requestId);

  return {
    async claim({ requestId, dispatchedAgents, taskName }) {
      const ref = receiptRef(requestId);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists
          ? OrchestrationRunReceiptSchema.parse(snapshot.data())
          : null;
        const decision = decideOrchestrationRunClaim({
          requestId,
          current,
          dispatchedAgents,
          taskName,
          now: now(),
          leaseSeconds,
          leaseToken: leaseTokenFactory(),
        });
        if (decision.kind === "CLAIMED") {
          transaction.set(ref, decision.receipt);
        }
        return decision;
      });
    },

    async complete({ requestId, leaseToken, decision }) {
      const ref = receiptRef(requestId);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) {
          throw new OrchestrationRunLeaseError(
            `Orchestration run not found: ${requestId}`,
          );
        }
        const current = OrchestrationRunReceiptSchema.parse(snapshot.data());
        const completed = completeOrchestrationRun(
          current,
          leaseToken,
          decision,
          now(),
        );
        transaction.set(ref, completed);
        return completed;
      });
    },

    async fail({ requestId, leaseToken, errorName }) {
      const ref = receiptRef(requestId);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) {
          throw new OrchestrationRunLeaseError(
            `Orchestration run not found: ${requestId}`,
          );
        }
        const current = OrchestrationRunReceiptSchema.parse(snapshot.data());
        const failed = failOrchestrationRun(
          current,
          leaseToken,
          errorName,
          now(),
        );
        transaction.set(ref, failed);
        return failed;
      });
    },
  };
}
