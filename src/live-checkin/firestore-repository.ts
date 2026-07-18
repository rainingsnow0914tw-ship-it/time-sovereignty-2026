import { randomUUID } from "node:crypto";

import { Firestore } from "@google-cloud/firestore";

import type {
  AgentRunTrace,
  CommitmentRecoveryOutput,
} from "../domain/agents/schemas";
import { PersistedAgentRunSchema } from "../infrastructure/firestore/agent-trace-repository";
import type { CloudConfig } from "../infrastructure/gcp/config";
import {
  LiveCheckInDocumentSchema,
  LiveDeviceSessionSchema,
  type LiveCheckInContext,
  type LiveCheckInDocument,
  type LiveChiefOfStaffDecision,
  type LiveDeviceSession,
} from "./schemas";

const SESSION_DOCUMENT_ID = "single-device";
const REPLY_LEASE_SECONDS = 300;

export class LivePairingAlreadyUsedError extends Error {
  constructor() {
    super("This pairing code has already been used.");
    this.name = "LivePairingAlreadyUsedError";
  }
}

export class LiveDeviceAlreadyPairedError extends Error {
  constructor() {
    super("A live device is already paired.");
    this.name = "LiveDeviceAlreadyPairedError";
  }
}

export class LiveSessionStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveSessionStateError";
  }
}

export class LiveCheckInStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveCheckInStateError";
  }
}

export type LiveReplyClaim =
  | { kind: "CLAIMED"; checkIn: LiveCheckInDocument; leaseToken: string }
  | { kind: "DUPLICATE"; checkIn: LiveCheckInDocument }
  | { kind: "BUSY"; retryAfterSeconds: number };

export interface LiveCheckInRepository {
  pair(options: {
    pairingFingerprint: string;
    deviceLabel: string;
    expiresAt: string;
  }): Promise<LiveDeviceSession>;
  authenticate(sessionId: string): Promise<LiveDeviceSession>;
  revoke(sessionId: string): Promise<void>;
  createScheduled(options: {
    id: string;
    sessionId: string;
    message: string;
    context: LiveCheckInContext;
    scheduledFor: string;
  }): Promise<{ checkIn: LiveCheckInDocument; duplicate: boolean }>;
  attachTask(checkInId: string, taskName: string): Promise<LiveCheckInDocument>;
  findCurrent(sessionId: string): Promise<LiveCheckInDocument | null>;
  findById(checkInId: string): Promise<LiveCheckInDocument | null>;
  markPending(options: {
    checkInId: string;
    taskName: string | null;
  }): Promise<{ checkIn: LiveCheckInDocument; duplicate: boolean }>;
  claimReply(options: {
    checkInId: string;
    sessionId: string;
    replyId: string;
    replyFingerprint: string;
  }): Promise<LiveReplyClaim>;
  saveTriage(options: {
    checkInId: string;
    leaseToken: string;
    triage: LiveChiefOfStaffDecision;
    trace: AgentRunTrace;
  }): Promise<LiveCheckInDocument>;
  saveRecovery(options: {
    checkInId: string;
    leaseToken: string;
    recovery: CommitmentRecoveryOutput;
    trace: AgentRunTrace;
  }): Promise<LiveCheckInDocument>;
  completeDecision(options: {
    checkInId: string;
    leaseToken: string;
    decision: LiveChiefOfStaffDecision;
    trace?: AgentRunTrace;
  }): Promise<LiveCheckInDocument>;
  failReply(options: {
    checkInId: string;
    leaseToken: string;
    errorName: string;
  }): Promise<void>;
  confirm(options: {
    checkInId: string;
    sessionId: string;
    confirmationId: string;
  }): Promise<{ checkIn: LiveCheckInDocument; duplicate: boolean }>;
  attachNextTask(options: {
    checkInId: string;
    nextCheckInId: string;
    nextTaskName: string;
  }): Promise<LiveCheckInDocument>;
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

export function createLiveCheckInRepository(
  config: CloudConfig,
  options: {
    firestore?: Firestore;
    now?: () => Date;
    idFactory?: () => string;
  } = {},
): LiveCheckInRepository {
  const firestore = options.firestore ?? getFirestore(config);
  const now = options.now ?? (() => new Date());
  const idFactory = options.idFactory ?? randomUUID;
  const sessionRef = firestore
    .collection("live_device_sessions")
    .doc(SESSION_DOCUMENT_ID);

  return {
    async pair({ pairingFingerprint, deviceLabel, expiresAt }) {
      const claimRef = firestore
        .collection("live_pairing_claims")
        .doc(pairingFingerprint);
      return firestore.runTransaction(async (transaction) => {
        const [claimSnapshot, sessionSnapshot] = await Promise.all([
          transaction.get(claimRef),
          transaction.get(sessionRef),
        ]);
        if (claimSnapshot.exists) throw new LivePairingAlreadyUsedError();

        if (sessionSnapshot.exists) {
          const current = LiveDeviceSessionSchema.parse(sessionSnapshot.data());
          const isActive =
            current.revokedAt === null &&
            new Date(current.expiresAt).getTime() > now().getTime();
          if (isActive) throw new LiveDeviceAlreadyPairedError();
        }

        const timestamp = now().toISOString();
        const session = LiveDeviceSessionSchema.parse({
          version: 1,
          id: idFactory(),
          deviceLabel,
          expiresAt,
          activeCheckInId: null,
          lastConfirmedCheckInId: null,
          createdAt: timestamp,
          revokedAt: null,
          updatedAt: timestamp,
        });
        transaction.set(sessionRef, session);
        transaction.set(claimRef, {
          version: 1,
          sessionId: session.id,
          usedAt: timestamp,
        });
        return session;
      });
    },

    async authenticate(sessionId) {
      const snapshot = await sessionRef.get();
      if (!snapshot.exists) throw new LiveSessionStateError("Session not found.");
      const session = LiveDeviceSessionSchema.parse(snapshot.data());
      if (
        session.id !== sessionId ||
        session.revokedAt !== null ||
        new Date(session.expiresAt).getTime() <= now().getTime()
      ) {
        throw new LiveSessionStateError("Session is not active.");
      }
      return session;
    },

    async revoke(sessionId) {
      await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(sessionRef);
        if (!snapshot.exists) return;
        const session = LiveDeviceSessionSchema.parse(snapshot.data());
        if (session.id !== sessionId || session.revokedAt !== null) return;
        const timestamp = now().toISOString();
        transaction.set(sessionRef, {
          ...session,
          revokedAt: timestamp,
          updatedAt: timestamp,
        });
      });
    },

    async createScheduled({ id, sessionId, message, context, scheduledFor }) {
      const checkInRef = firestore.collection("live_checkins").doc(id);
      return firestore.runTransaction(async (transaction) => {
        const [existingSnapshot, sessionSnapshot] = await Promise.all([
          transaction.get(checkInRef),
          transaction.get(sessionRef),
        ]);
        if (existingSnapshot.exists) {
          const existing = LiveCheckInDocumentSchema.parse(existingSnapshot.data());
          if (existing.sessionId !== sessionId) {
            throw new LiveCheckInStateError("Check-in identity is already in use.");
          }
          return { checkIn: existing, duplicate: true };
        }
        if (!sessionSnapshot.exists) {
          throw new LiveSessionStateError("Session not found.");
        }
        const session = LiveDeviceSessionSchema.parse(sessionSnapshot.data());
        if (session.id !== sessionId || session.revokedAt !== null) {
          throw new LiveSessionStateError("Session is not active.");
        }
        const timestamp = now().toISOString();
        const checkIn = LiveCheckInDocumentSchema.parse({
          version: 1,
          id,
          sessionId,
          status: "SCHEDULED",
          message,
          context,
          scheduledFor,
          taskName: null,
          pendingAt: null,
          replyId: null,
          replyFingerprint: null,
          attemptCount: 0,
          leaseToken: null,
          leaseExpiresAt: null,
          triage: null,
          recovery: null,
          decision: null,
          traceRunIds: [],
          confirmedAt: null,
          confirmationId: null,
          nextCheckInId: null,
          nextTaskName: null,
          errorName: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        transaction.set(checkInRef, checkIn);
        transaction.set(sessionRef, {
          ...session,
          activeCheckInId: id,
          updatedAt: timestamp,
        });
        return { checkIn, duplicate: false };
      });
    },

    async attachTask(checkInId, taskName) {
      const ref = firestore.collection("live_checkins").doc(checkInId);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) {
          throw new LiveCheckInStateError("Check-in not found.");
        }
        const current = LiveCheckInDocumentSchema.parse(snapshot.data());
        if (current.taskName && current.taskName !== taskName) {
          throw new LiveCheckInStateError("Check-in already has another task.");
        }
        const updated = LiveCheckInDocumentSchema.parse({
          ...current,
          taskName,
          updatedAt: now().toISOString(),
        });
        transaction.set(ref, updated);
        return updated;
      });
    },

    async findCurrent(sessionId) {
      const sessionSnapshot = await sessionRef.get();
      if (!sessionSnapshot.exists) return null;
      const session = LiveDeviceSessionSchema.parse(sessionSnapshot.data());
      if (session.id !== sessionId || !session.activeCheckInId) return null;
      const snapshot = await firestore
        .collection("live_checkins")
        .doc(session.activeCheckInId)
        .get();
      return snapshot.exists
        ? LiveCheckInDocumentSchema.parse(snapshot.data())
        : null;
    },

    async findById(checkInId) {
      const snapshot = await firestore.collection("live_checkins").doc(checkInId).get();
      return snapshot.exists
        ? LiveCheckInDocumentSchema.parse(snapshot.data())
        : null;
    },

    async markPending({ checkInId, taskName }) {
      const ref = firestore.collection("live_checkins").doc(checkInId);
      return firestore.runTransaction(async (transaction) => {
        const [snapshot, sessionSnapshot] = await Promise.all([
          transaction.get(ref),
          transaction.get(sessionRef),
        ]);
        if (!snapshot.exists) throw new LiveCheckInStateError("Check-in not found.");
        const current = LiveCheckInDocumentSchema.parse(snapshot.data());
        if (current.status !== "SCHEDULED") {
          return { checkIn: current, duplicate: true };
        }
        if (
          current.taskName &&
          taskName &&
          !taskIdentityMatches(current.taskName, taskName)
        ) {
          throw new LiveCheckInStateError("Cloud Task identity does not match.");
        }
        const timestamp = now().toISOString();
        const updated = LiveCheckInDocumentSchema.parse({
          ...current,
          status: "PENDING",
          pendingAt: timestamp,
          taskName: current.taskName ?? taskName,
          updatedAt: timestamp,
        });
        transaction.set(ref, updated);
        if (sessionSnapshot.exists) {
          const session = LiveDeviceSessionSchema.parse(sessionSnapshot.data());
          if (session.id === current.sessionId && session.revokedAt === null) {
            transaction.set(sessionRef, {
              ...session,
              activeCheckInId: current.id,
              updatedAt: timestamp,
            });
          }
        }
        return { checkIn: updated, duplicate: false };
      });
    },

    async claimReply({ checkInId, sessionId, replyId, replyFingerprint }) {
      const ref = firestore.collection("live_checkins").doc(checkInId);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) throw new LiveCheckInStateError("Check-in not found.");
        const current = LiveCheckInDocumentSchema.parse(snapshot.data());
        if (current.sessionId !== sessionId) {
          throw new LiveCheckInStateError("Check-in does not belong to this session.");
        }
        if (
          current.replyId === replyId &&
          current.replyFingerprint !== null &&
          current.replyFingerprint !== replyFingerprint
        ) {
          throw new LiveCheckInStateError("Reply id was reused with different content.");
        }
        if (
          (current.status === "DECISION_READY" || current.status === "CONFIRMED") &&
          current.replyId === replyId
        ) {
          return { kind: "DUPLICATE" as const, checkIn: current };
        }
        if (current.status === "PROCESSING") {
          const remaining = current.leaseExpiresAt
            ? new Date(current.leaseExpiresAt).getTime() - now().getTime()
            : 0;
          if (remaining > 0) {
            return {
              kind: "BUSY" as const,
              retryAfterSeconds: Math.max(1, Math.ceil(remaining / 1_000)),
            };
          }
        }
        if (
          !["PENDING", "FAILED", "PROCESSING"].includes(current.status) ||
          (current.replyId !== null && current.replyId !== replyId)
        ) {
          throw new LiveCheckInStateError(
            `Check-in cannot accept this reply from ${current.status}.`,
          );
        }
        const timestamp = now();
        const leaseToken = idFactory();
        const updated = LiveCheckInDocumentSchema.parse({
          ...current,
          status: "PROCESSING",
          replyId,
          replyFingerprint,
          attemptCount: current.attemptCount + 1,
          leaseToken,
          leaseExpiresAt: new Date(
            timestamp.getTime() + REPLY_LEASE_SECONDS * 1_000,
          ).toISOString(),
          errorName: null,
          updatedAt: timestamp.toISOString(),
        });
        transaction.set(ref, updated);
        return { kind: "CLAIMED" as const, checkIn: updated, leaseToken };
      });
    },

    async saveTriage({ checkInId, leaseToken, triage, trace }) {
      return updateOwnedReply(firestore, checkInId, leaseToken, now, (current) => ({
        ...current,
        triage,
        traceRunIds: [...new Set([...current.traceRunIds, trace.runId])],
      }), trace);
    },

    async saveRecovery({ checkInId, leaseToken, recovery, trace }) {
      return updateOwnedReply(firestore, checkInId, leaseToken, now, (current) => ({
        ...current,
        recovery,
        traceRunIds: [...new Set([...current.traceRunIds, trace.runId])],
      }), trace);
    },

    async completeDecision({ checkInId, leaseToken, decision, trace }) {
      return updateOwnedReply(firestore, checkInId, leaseToken, now, (current) => ({
        ...current,
        status: "DECISION_READY",
        decision,
        traceRunIds: trace
          ? [...new Set([...current.traceRunIds, trace.runId])]
          : current.traceRunIds,
        leaseToken: null,
        leaseExpiresAt: null,
      }), trace);
    },

    async failReply({ checkInId, leaseToken, errorName }) {
      try {
        await updateOwnedReply(firestore, checkInId, leaseToken, now, (current) => ({
          ...current,
          status: "FAILED",
          leaseToken: null,
          leaseExpiresAt: null,
          errorName: errorName.slice(0, 240) || "UnknownError",
        }));
      } catch (error) {
        if (!(error instanceof LiveCheckInStateError)) throw error;
      }
    },

    async confirm({ checkInId, sessionId, confirmationId }) {
      const ref = firestore.collection("live_checkins").doc(checkInId);
      return firestore.runTransaction(async (transaction) => {
        const [snapshot, sessionSnapshot] = await Promise.all([
          transaction.get(ref),
          transaction.get(sessionRef),
        ]);
        if (!snapshot.exists || !sessionSnapshot.exists) {
          throw new LiveCheckInStateError("Check-in or session not found.");
        }
        const current = LiveCheckInDocumentSchema.parse(snapshot.data());
        const session = LiveDeviceSessionSchema.parse(sessionSnapshot.data());
        if (current.sessionId !== sessionId || session.id !== sessionId) {
          throw new LiveCheckInStateError("Check-in does not belong to this session.");
        }
        if (current.status === "CONFIRMED") {
          if (current.confirmationId !== confirmationId) {
            throw new LiveCheckInStateError(
              "Confirmation id does not match the completed confirmation.",
            );
          }
          return { checkIn: current, duplicate: true };
        }
        if (current.status !== "DECISION_READY" || !current.decision) {
          throw new LiveCheckInStateError(
            `Check-in cannot be confirmed from ${current.status}.`,
          );
        }
        const timestamp = now().toISOString();
        const updated = LiveCheckInDocumentSchema.parse({
          ...current,
          status: "CONFIRMED",
          confirmedAt: timestamp,
          confirmationId,
          updatedAt: timestamp,
        });
        transaction.set(ref, updated);
        transaction.set(sessionRef, {
          ...session,
          lastConfirmedCheckInId: current.id,
          updatedAt: timestamp,
        });
        if (current.decision.memoryProposal) {
          transaction.set(
            firestore.collection("live_memories").doc(`memory-${current.id}`),
            {
              version: 1,
              id: `memory-${current.id}`,
              sessionId,
              checkInId: current.id,
              sourceType: "CONFIRMED_BY_USER",
              kind: "STRATEGY",
              summary: current.decision.memoryProposal.summary,
              confidence: current.decision.memoryProposal.confidence,
              confirmedAt: timestamp,
              createdAt: timestamp,
            },
          );
        }
        return { checkIn: updated, duplicate: false };
      });
    },

    async attachNextTask({ checkInId, nextCheckInId, nextTaskName }) {
      const ref = firestore.collection("live_checkins").doc(checkInId);
      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists) throw new LiveCheckInStateError("Check-in not found.");
        const current = LiveCheckInDocumentSchema.parse(snapshot.data());
        if (current.status !== "CONFIRMED") {
          throw new LiveCheckInStateError("Only a confirmed check-in can link follow-up.");
        }
        if (
          current.nextCheckInId &&
          (current.nextCheckInId !== nextCheckInId ||
            current.nextTaskName !== nextTaskName)
        ) {
          throw new LiveCheckInStateError("Another follow-up is already linked.");
        }
        const updated = LiveCheckInDocumentSchema.parse({
          ...current,
          nextCheckInId,
          nextTaskName,
          updatedAt: now().toISOString(),
        });
        transaction.set(ref, updated);
        return updated;
      });
    },
  };
}

export function taskIdentityMatches(stored: string, delivered: string): boolean {
  if (stored === delivered) return true;
  const storedId = stored.split("/").at(-1);
  const deliveredId = delivered.split("/").at(-1);
  return Boolean(storedId && deliveredId && storedId === deliveredId);
}

async function updateOwnedReply(
  firestore: Firestore,
  checkInId: string,
  leaseToken: string,
  now: () => Date,
  update: (current: LiveCheckInDocument) => Record<string, unknown>,
  trace?: AgentRunTrace,
): Promise<LiveCheckInDocument> {
  const ref = firestore.collection("live_checkins").doc(checkInId);
  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new LiveCheckInStateError("Check-in not found.");
    const current = LiveCheckInDocumentSchema.parse(snapshot.data());
    if (current.status !== "PROCESSING" || current.leaseToken !== leaseToken) {
      throw new LiveCheckInStateError("Reply lease is not owned by this request.");
    }
    const updated = LiveCheckInDocumentSchema.parse({
      ...update(current),
      updatedAt: now().toISOString(),
    });
    transaction.set(ref, updated);
    if (trace) {
      transaction.set(
        firestore.collection("agent_runs").doc(trace.runId),
        PersistedAgentRunSchema.parse({ version: 1, ...trace }),
      );
    }
    return updated;
  });
}
