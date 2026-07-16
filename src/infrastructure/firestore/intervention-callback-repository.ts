import { randomUUID } from "node:crypto";

import { Firestore } from "@google-cloud/firestore";
import { z } from "zod";

import {
  InterventionSchema,
  type Intervention,
} from "../../domain/interventions/schemas";
import { transitionIntervention } from "../../domain/state-machines/intervention-machine";
import type { CloudConfig } from "../gcp/config";

export const CallbackReceiptSchema = z
  .object({
    version: z.literal(1),
    interventionId: z.string().trim().min(1),
    status: z.enum(["IN_FLIGHT", "COMPLETED"]),
    leaseToken: z.string().uuid(),
    leaseExpiresAt: z.string().datetime({ offset: true }),
    taskName: z.string().trim().min(1).max(1_000).nullable(),
    retryCount: z.number().int().nonnegative(),
    attemptCount: z.number().int().positive(),
    claimedAt: z.string().datetime({ offset: true }),
    completedAt: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

export type CallbackReceipt = z.infer<typeof CallbackReceiptSchema>;

export class InterventionNotFoundError extends Error {
  constructor(interventionId: string) {
    super(`Intervention not found: ${interventionId}`);
    this.name = "InterventionNotFoundError";
  }
}

export class InterventionCallbackStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterventionCallbackStateError";
  }
}

export class InterventionCallbackLeaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterventionCallbackLeaseError";
  }
}

export type ClaimDecision =
  | {
      kind: "CLAIMED";
      intervention: Intervention;
      receipt: CallbackReceipt;
    }
  | {
      kind: "BUSY";
      retryAfterSeconds: number;
    }
  | {
      kind: "DUPLICATE";
      intervention: Intervention;
      receipt: CallbackReceipt;
    };

interface ClaimInput {
  intervention: Intervention;
  receipt: CallbackReceipt | null;
  now: Date;
  leaseSeconds: number;
  leaseToken: string;
  taskName: string | null;
  retryCount: number;
}

export function decideInterventionCallbackClaim({
  intervention,
  receipt,
  now,
  leaseSeconds,
  leaseToken,
  taskName,
  retryCount,
}: ClaimInput): ClaimDecision {
  if (receipt?.status === "COMPLETED") {
    return { kind: "DUPLICATE", intervention, receipt };
  }

  if (receipt?.status === "IN_FLIGHT") {
    const remainingMs = new Date(receipt.leaseExpiresAt).getTime() - now.getTime();
    if (remainingMs > 0) {
      return {
        kind: "BUSY",
        retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1_000)),
      };
    }
  }

  let nextIntervention: Intervention;
  if (intervention.state === "SCHEDULED") {
    nextIntervention = transitionIntervention(intervention, "DUE", now);
  } else if (intervention.state === "DUE" && receipt?.status === "IN_FLIGHT") {
    nextIntervention = intervention;
  } else {
    throw new InterventionCallbackStateError(
      `Intervention ${intervention.id} cannot be claimed from ${intervention.state}.`,
    );
  }

  const claimedAt = now.toISOString();
  const nextReceipt = CallbackReceiptSchema.parse({
    version: 1,
    interventionId: intervention.id,
    status: "IN_FLIGHT",
    leaseToken,
    leaseExpiresAt: new Date(now.getTime() + leaseSeconds * 1_000).toISOString(),
    taskName,
    retryCount,
    attemptCount: (receipt?.attemptCount ?? 0) + 1,
    claimedAt,
    completedAt: null,
  });

  return {
    kind: "CLAIMED",
    intervention: nextIntervention,
    receipt: nextReceipt,
  };
}

export function completeCallbackReceipt(
  receipt: CallbackReceipt,
  leaseToken: string,
  now: Date,
): CallbackReceipt {
  if (receipt.status === "COMPLETED") return receipt;
  if (receipt.leaseToken !== leaseToken) {
    throw new InterventionCallbackLeaseError(
      "Callback completion does not own the active lease.",
    );
  }

  return CallbackReceiptSchema.parse({
    ...receipt,
    status: "COMPLETED",
    completedAt: now.toISOString(),
  });
}

export interface InterventionCallbackRepository {
  claim(options: {
    interventionId: string;
    taskName: string | null;
    retryCount: number;
  }): Promise<ClaimDecision>;
  complete(options: {
    interventionId: string;
    leaseToken: string;
  }): Promise<CallbackReceipt>;
}

let sharedFirestore: Firestore | null = null;

function getFirestore(config: CloudConfig): Firestore {
  if (!sharedFirestore) {
    sharedFirestore = new Firestore({
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId,
      preferRest: true,
    });
  }
  return sharedFirestore;
}

export function createInterventionCallbackRepository(
  config: CloudConfig,
  options: {
    firestore?: Firestore;
    now?: () => Date;
    leaseTokenFactory?: () => string;
  } = {},
): InterventionCallbackRepository {
  const firestore = options.firestore ?? getFirestore(config);
  const now = options.now ?? (() => new Date());
  const leaseTokenFactory = options.leaseTokenFactory ?? randomUUID;

  return {
    async claim({ interventionId, taskName, retryCount }) {
      const interventionRef = firestore.collection("interventions").doc(interventionId);
      const receiptRef = interventionRef.collection("delivery_receipts").doc("cloud-task");

      return firestore.runTransaction(async (transaction) => {
        const interventionSnapshot = await transaction.get(interventionRef);
        const receiptSnapshot = await transaction.get(receiptRef);
        if (!interventionSnapshot.exists) {
          throw new InterventionNotFoundError(interventionId);
        }

        const intervention = InterventionSchema.parse(interventionSnapshot.data());
        const receipt = receiptSnapshot.exists
          ? CallbackReceiptSchema.parse(receiptSnapshot.data())
          : null;
        const decision = decideInterventionCallbackClaim({
          intervention,
          receipt,
          now: now(),
          leaseSeconds: config.callbackLeaseSeconds,
          leaseToken: leaseTokenFactory(),
          taskName,
          retryCount,
        });

        if (decision.kind === "CLAIMED") {
          transaction.set(interventionRef, decision.intervention);
          transaction.set(receiptRef, decision.receipt);
        }

        return decision;
      });
    },

    async complete({ interventionId, leaseToken }) {
      const receiptRef = firestore
        .collection("interventions")
        .doc(interventionId)
        .collection("delivery_receipts")
        .doc("cloud-task");

      return firestore.runTransaction(async (transaction) => {
        const receiptSnapshot = await transaction.get(receiptRef);
        if (!receiptSnapshot.exists) {
          throw new InterventionCallbackLeaseError(
            `Callback receipt not found for ${interventionId}.`,
          );
        }

        const current = CallbackReceiptSchema.parse(receiptSnapshot.data());
        const completed = completeCallbackReceipt(current, leaseToken, now());
        if (completed !== current) transaction.set(receiptRef, completed);
        return completed;
      });
    },
  };
}
