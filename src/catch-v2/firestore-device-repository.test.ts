import { describe, expect, it } from "vitest";

import type {
  CatchDeviceDocument,
  CatchPairingTicketDocument,
} from "./device";
import {
  assertPairingTicketClaimable,
  CatchPairingTicketError,
  isActiveCatchDevice,
} from "./firestore-device-repository";

const NOW = new Date("2026-07-19T12:00:00.000Z");

const TICKET: CatchPairingTicketDocument = {
  version: 1,
  ticketHash: "a".repeat(64),
  sessionId: "session-one",
  expiresAt: "2026-07-19T12:10:00.000Z",
  deviceExpiresAt: "2026-07-22T00:00:00.000Z",
  claimedAt: null,
  createdAt: "2026-07-19T12:00:00.000Z",
};

const DEVICE: CatchDeviceDocument = {
  version: 1,
  id: "device-one",
  sessionId: "session-one",
  deviceLabel: "S25 Ultra",
  locale: "zh-TW",
  fcmToken: "f".repeat(64),
  fcmTokenFingerprint: "b".repeat(64),
  credentialHash: "c".repeat(64),
  notificationConsentAt: "2026-07-19T12:00:00.000Z",
  fullScreenConsentAt: "2026-07-19T12:00:00.000Z",
  expiresAt: "2026-07-22T00:00:00.000Z",
  revokedAt: null,
  createdAt: "2026-07-19T12:00:00.000Z",
  updatedAt: "2026-07-19T12:00:00.000Z",
};

describe("V2 native device persistence guards", () => {
  it("accepts only an unclaimed ticket before its expiry", () => {
    expect(() => assertPairingTicketClaimable(TICKET, NOW)).not.toThrow();
    expect(() =>
      assertPairingTicketClaimable(
        { ...TICKET, claimedAt: "2026-07-19T12:01:00.000Z" },
        NOW,
      ),
    ).toThrow(CatchPairingTicketError);
    expect(() =>
      assertPairingTicketClaimable(
        { ...TICKET, expiresAt: "2026-07-19T12:00:00.000Z" },
        NOW,
      ),
    ).toThrow(/expired/i);
  });

  it("treats expiry and revocation as hard authentication stops", () => {
    expect(isActiveCatchDevice(DEVICE, NOW)).toBe(true);
    expect(
      isActiveCatchDevice(
        { ...DEVICE, revokedAt: "2026-07-19T12:01:00.000Z" },
        NOW,
      ),
    ).toBe(false);
    expect(
      isActiveCatchDevice(
        { ...DEVICE, expiresAt: "2026-07-19T12:00:00.000Z" },
        NOW,
      ),
    ).toBe(false);
  });
});
