import { createHash } from "node:crypto";

import { Firestore } from "@google-cloud/firestore";
import { z } from "zod";

import type { CloudConfig } from "../infrastructure/gcp/config";
import { CatchResponseSchema, type CatchResponse } from "./schemas";

export const CatchResponseRecordSchema = z
  .object({
    version: z.literal(1),
    responseId: z.string().trim().min(1).max(128),
    eventId: z.string().trim().min(1).max(128),
    deviceId: z.string().uuid(),
    sessionId: z.string().trim().min(1).max(128),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
    response: CatchResponseSchema,
    recordedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type CatchResponseRecord = z.infer<typeof CatchResponseRecordSchema>;

const CatchEventResponseMarkerSchema = z
  .object({
    version: z.literal(1),
    eventId: z.string().trim().min(1).max(128),
    sessionId: z.string().trim().min(1).max(128),
    responseId: z.string().trim().min(1).max(128),
    respondedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export class CatchResponseConflictError extends Error {
  constructor() {
    super("A native response id was reused with different content.");
    this.name = "CatchResponseConflictError";
  }
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

export function createCatchResponseRepository(
  config: CloudConfig,
  options: { firestore?: Firestore; now?: () => Date } = {},
): {
  record(input: {
    response: CatchResponse;
    deviceId: string;
    sessionId: string;
  }): Promise<{ record: CatchResponseRecord; duplicate: boolean }>;
  hasRecordedResponse(eventId: string, sessionId: string): Promise<boolean>;
} {
  const firestore = options.firestore ?? getFirestore(config);
  const now = options.now ?? (() => new Date());
  return {
    async record({ response, deviceId, sessionId }) {
      const fingerprint = createHash("sha256")
        .update(JSON.stringify(response), "utf8")
        .digest("hex");
      const ref = firestore.collection("catch_responses").doc(response.responseId);
      const markerRef = firestore
        .collection("catch_event_responses")
        .doc(response.eventId);
      return firestore.runTransaction(async (transaction) => {
        const [snapshot, markerSnapshot] = await Promise.all([
          transaction.get(ref),
          transaction.get(markerRef),
        ]);
        if (markerSnapshot.exists) {
          const marker = CatchEventResponseMarkerSchema.parse(
            markerSnapshot.data(),
          );
          if (
            marker.sessionId !== sessionId ||
            marker.responseId !== response.responseId
          ) {
            throw new CatchResponseConflictError();
          }
        }
        if (snapshot.exists) {
          const existing = CatchResponseRecordSchema.parse(snapshot.data());
          if (
            existing.fingerprint !== fingerprint ||
            existing.deviceId !== deviceId ||
            existing.sessionId !== sessionId ||
            existing.eventId !== response.eventId
          ) {
            throw new CatchResponseConflictError();
          }
          return { record: existing, duplicate: true };
        }
        const record = CatchResponseRecordSchema.parse({
          version: 1,
          responseId: response.responseId,
          eventId: response.eventId,
          deviceId,
          sessionId,
          fingerprint,
          response,
          recordedAt: now().toISOString(),
        });
        transaction.create(ref, record);
        transaction.set(
          markerRef,
          CatchEventResponseMarkerSchema.parse({
            version: 1,
            eventId: response.eventId,
            sessionId,
            responseId: response.responseId,
            respondedAt: response.respondedAt,
          }),
        );
        return { record, duplicate: false };
      });
    },
    async hasRecordedResponse(eventId, sessionId) {
      const snapshot = await firestore
        .collection("catch_event_responses")
        .doc(eventId)
        .get();
      if (!snapshot.exists) return false;
      const marker = CatchEventResponseMarkerSchema.parse(snapshot.data());
      return marker.eventId === eventId && marker.sessionId === sessionId;
    },
  };
}
