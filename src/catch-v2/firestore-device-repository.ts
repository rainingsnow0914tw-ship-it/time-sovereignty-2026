import { createHash } from "node:crypto";

import { Firestore } from "@google-cloud/firestore";

import type { CloudConfig } from "../infrastructure/gcp/config";
import {
  CatchDeviceDocumentSchema,
  CatchPairingTicketDocumentSchema,
  type CatchDeviceDocument,
  type CatchNativePairRequest,
  type CatchPairingTicketDocument,
} from "./device";

const DEVICE_DOCUMENT_ID = "single-native-device";

export class CatchPairingTicketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatchPairingTicketError";
  }
}

export class CatchDeviceAlreadyPairedError extends Error {
  constructor() {
    super("An active native device is already paired.");
    this.name = "CatchDeviceAlreadyPairedError";
  }
}

export class CatchDeviceStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatchDeviceStateError";
  }
}

export interface CatchDeviceRepository {
  createPairingTicket(ticket: CatchPairingTicketDocument): Promise<void>;
  claimPairingTicket(options: {
    ticketHash: string;
    deviceId: string;
    credentialHash: string;
    request: CatchNativePairRequest;
  }): Promise<CatchDeviceDocument>;
  findById(deviceId: string): Promise<CatchDeviceDocument | null>;
  findActiveBySession(sessionId: string): Promise<CatchDeviceDocument | null>;
  revoke(deviceId: string): Promise<void>;
  revokeBySession(sessionId: string): Promise<void>;
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

export function createCatchDeviceRepository(
  config: CloudConfig,
  options: { firestore?: Firestore; now?: () => Date } = {},
): CatchDeviceRepository {
  const firestore = options.firestore ?? getFirestore(config);
  const now = options.now ?? (() => new Date());
  const deviceRef = firestore
    .collection("catch_native_devices")
    .doc(DEVICE_DOCUMENT_ID);

  return {
    async createPairingTicket(ticket) {
      const parsed = CatchPairingTicketDocumentSchema.parse(ticket);
      await firestore
        .collection("catch_pairing_tickets")
        .doc(parsed.ticketHash)
        .create(parsed);
    },

    async claimPairingTicket({
      ticketHash,
      deviceId,
      credentialHash,
      request,
    }) {
      const ticketRef = firestore
        .collection("catch_pairing_tickets")
        .doc(ticketHash);
      return firestore.runTransaction(async (transaction) => {
        const [ticketSnapshot, deviceSnapshot] = await Promise.all([
          transaction.get(ticketRef),
          transaction.get(deviceRef),
        ]);
        if (!ticketSnapshot.exists) {
          throw new CatchPairingTicketError("Pairing ticket does not exist.");
        }
        const ticket = CatchPairingTicketDocumentSchema.parse(
          ticketSnapshot.data(),
        );
        assertPairingTicketClaimable(ticket, now());

        if (deviceSnapshot.exists) {
          const current = CatchDeviceDocumentSchema.parse(deviceSnapshot.data());
          if (isActiveCatchDevice(current, now())) {
            throw new CatchDeviceAlreadyPairedError();
          }
        }

        const timestamp = now().toISOString();
        const device = CatchDeviceDocumentSchema.parse({
          version: 1,
          id: deviceId,
          sessionId: ticket.sessionId,
          deviceLabel: request.deviceLabel,
          locale: request.locale,
          fcmToken: request.fcmToken,
          fcmTokenFingerprint: sha256Hex(request.fcmToken),
          credentialHash,
          notificationConsentAt: timestamp,
          fullScreenConsentAt: request.fullScreenConsent ? timestamp : null,
          expiresAt: ticket.deviceExpiresAt,
          revokedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        transaction.update(ticketRef, { claimedAt: timestamp });
        transaction.set(deviceRef, device);
        return device;
      });
    },

    async findById(deviceId) {
      const snapshot = await deviceRef.get();
      if (!snapshot.exists) return null;
      const device = CatchDeviceDocumentSchema.parse(snapshot.data());
      return device.id === deviceId ? device : null;
    },

    async findActiveBySession(sessionId) {
      const snapshot = await deviceRef.get();
      if (!snapshot.exists) return null;
      const device = CatchDeviceDocumentSchema.parse(snapshot.data());
      return device.sessionId === sessionId && isActiveCatchDevice(device, now())
        ? device
        : null;
    },

    async revoke(deviceId) {
      await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(deviceRef);
        if (!snapshot.exists) return;
        const current = CatchDeviceDocumentSchema.parse(snapshot.data());
        if (current.id !== deviceId) {
          throw new CatchDeviceStateError("Native device identity mismatch.");
        }
        if (current.revokedAt !== null) return;
        const timestamp = now().toISOString();
        transaction.update(deviceRef, {
          revokedAt: timestamp,
          updatedAt: timestamp,
        });
      });
    },

    async revokeBySession(sessionId) {
      await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(deviceRef);
        if (!snapshot.exists) return;
        const current = CatchDeviceDocumentSchema.parse(snapshot.data());
        if (current.sessionId !== sessionId || current.revokedAt !== null) return;
        const timestamp = now().toISOString();
        transaction.update(deviceRef, {
          revokedAt: timestamp,
          updatedAt: timestamp,
        });
      });
    },
  };
}

export function assertPairingTicketClaimable(
  ticket: CatchPairingTicketDocument,
  now: Date,
): void {
  if (ticket.claimedAt !== null) {
    throw new CatchPairingTicketError("Pairing ticket was already claimed.");
  }
  if (new Date(ticket.expiresAt).getTime() <= now.getTime()) {
    throw new CatchPairingTicketError("Pairing ticket expired.");
  }
}

export function isActiveCatchDevice(
  device: CatchDeviceDocument,
  now: Date,
): boolean {
  return (
    device.revokedAt === null &&
    new Date(device.expiresAt).getTime() > now.getTime()
  );
}

function sha256Hex(value: string): string {
  // Keep device tokens out of logs; only the fingerprint is safe for equality.
  return createHash("sha256").update(value, "utf8").digest("hex");
}
