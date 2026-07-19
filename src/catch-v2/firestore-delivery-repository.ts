import { createHash, randomUUID } from "node:crypto";

import { Firestore } from "@google-cloud/firestore";
import { z } from "zod";

import type { CloudConfig } from "../infrastructure/gcp/config";
import { CatchLevelSchema, type CatchLevel } from "./schemas";

export const CatchDeliveryReceiptSchema = z
  .object({
    version: z.literal(1),
    eventId: z.string().trim().min(1).max(128),
    level: CatchLevelSchema,
    idempotencyKey: z.string().trim().min(1).max(256),
    status: z.enum([
      "IN_FLIGHT",
      "DELIVERED",
      "INVALID_TOKEN",
      "FAILED_PERMANENT",
    ]),
    leaseToken: z.string().uuid(),
    leaseExpiresAt: z.string().datetime({ offset: true }),
    attemptCount: z.number().int().positive(),
    providerMessageName: z.string().trim().min(1).max(1_000).nullable(),
    completedAt: z.string().datetime({ offset: true }).nullable(),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type CatchDeliveryReceipt = z.infer<typeof CatchDeliveryReceiptSchema>;
export type CatchDeliveryOutcome = Exclude<
  CatchDeliveryReceipt["status"],
  "IN_FLIGHT"
>;

export type CatchDeliveryClaim =
  | { kind: "CLAIMED"; receipt: CatchDeliveryReceipt }
  | { kind: "BUSY"; retryAfterSeconds: number }
  | { kind: "DUPLICATE"; receipt: CatchDeliveryReceipt };

export function decideCatchDeliveryClaim(options: {
  current: CatchDeliveryReceipt | null;
  eventId: string;
  level: CatchLevel;
  now: Date;
  leaseToken: string;
  leaseSeconds: number;
}): CatchDeliveryClaim {
  const { current, eventId, level, now, leaseToken, leaseSeconds } = options;
  if (current && current.status !== "IN_FLIGHT") {
    return { kind: "DUPLICATE", receipt: current };
  }
  if (current?.status === "IN_FLIGHT") {
    const remaining = new Date(current.leaseExpiresAt).getTime() - now.getTime();
    if (remaining > 0) {
      return { kind: "BUSY", retryAfterSeconds: Math.ceil(remaining / 1_000) };
    }
  }
  const timestamp = now.toISOString();
  return {
    kind: "CLAIMED",
    receipt: CatchDeliveryReceiptSchema.parse({
      version: 1,
      eventId,
      level,
      idempotencyKey: `${eventId}:level:${level}`,
      status: "IN_FLIGHT",
      leaseToken,
      leaseExpiresAt: new Date(now.getTime() + leaseSeconds * 1_000).toISOString(),
      attemptCount: (current?.attemptCount ?? 0) + 1,
      providerMessageName: null,
      completedAt: null,
      updatedAt: timestamp,
    }),
  };
}

let sharedFirestore: Firestore | null = null;

function getFirestore(config: CloudConfig): Firestore {
  if (!sharedFirestore) {
    sharedFirestore = new Firestore({
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId,
    });
  }
  return sharedFirestore;
}

export function createCatchDeliveryRepository(
  config: CloudConfig,
  options: { firestore?: Firestore; now?: () => Date } = {},
): {
  claim(eventId: string, level: CatchLevel): Promise<CatchDeliveryClaim>;
  complete(input: {
    eventId: string;
    level: CatchLevel;
    leaseToken: string;
    outcome: CatchDeliveryOutcome;
    providerMessageName: string | null;
  }): Promise<CatchDeliveryReceipt>;
} {
  const firestore = options.firestore ?? getFirestore(config);
  const now = options.now ?? (() => new Date());
  const refFor = (eventId: string, level: CatchLevel) =>
    firestore
      .collection("catch_delivery_receipts")
      .doc(createHash("sha256").update(`${eventId}:${level}`).digest("hex"));
  return {
    async claim(eventId, level) {
      const ref = refFor(eventId, level);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists
          ? CatchDeliveryReceiptSchema.parse(snapshot.data())
          : null;
        const decision = decideCatchDeliveryClaim({
          current,
          eventId,
          level,
          now: now(),
          leaseToken: randomUUID(),
          leaseSeconds: 60,
        });
        if (decision.kind === "CLAIMED") transaction.set(ref, decision.receipt);
        return decision;
      });
    },
    async complete({ eventId, level, leaseToken, outcome, providerMessageName }) {
      const ref = refFor(eventId, level);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) throw new Error("Catch delivery receipt is missing.");
        const current = CatchDeliveryReceiptSchema.parse(snapshot.data());
        if (current.status !== "IN_FLIGHT") return current;
        if (current.leaseToken !== leaseToken) {
          throw new Error("Catch delivery lease is not owned.");
        }
        const timestamp = now().toISOString();
        const completed = CatchDeliveryReceiptSchema.parse({
          ...current,
          status: outcome,
          providerMessageName,
          completedAt: timestamp,
          updatedAt: timestamp,
        });
        transaction.set(ref, completed);
        return completed;
      });
    },
  };
}
