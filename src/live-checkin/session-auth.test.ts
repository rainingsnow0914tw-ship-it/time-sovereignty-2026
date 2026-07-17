import { describe, expect, it } from "vitest";

import {
  createSessionCookie,
  LiveSessionAuthenticationError,
  readSessionCookie,
  secretMatches,
} from "./session-auth";
import {
  ClientLiveCheckInSchema,
  LiveCheckInDocumentSchema,
} from "./schemas";

const secret = "s".repeat(32);
const payload = {
  sessionId: "session-proof",
  expiresAt: "2026-07-18T00:00:00.000Z",
};

describe("live session authentication", () => {
  it("round-trips an unmodified signed cookie", () => {
    const cookie = createSessionCookie(payload, secret);
    expect(readSessionCookie(cookie, secret, new Date("2026-07-17T00:00:00Z"))).toEqual(
      payload,
    );
  });

  it("rejects tampering and expiry", () => {
    const cookie = createSessionCookie(payload, secret);
    expect(() =>
      readSessionCookie(`${cookie}x`, secret, new Date("2026-07-17T00:00:00Z")),
    ).toThrow(LiveSessionAuthenticationError);
    expect(() =>
      readSessionCookie(cookie, secret, new Date("2026-07-18T00:00:00Z")),
    ).toThrow("expired");
  });

  it("compares pairing values without returning the secret", () => {
    expect(secretMatches("pair-me-once", "pair-me-once")).toBe(true);
    expect(secretMatches("pair-me-once", "different-value")).toBe(false);
  });
});

describe("client-safe live document", () => {
  it("strips internal lease and reply fingerprint fields", () => {
    const document = LiveCheckInDocumentSchema.parse({
      version: 1,
      id: "live-proof",
      sessionId: "session-proof",
      status: "SCHEDULED",
      message: "What is true?",
      context: {
        goal: "Ship",
        motivation: "Use it",
        targetWindow: "Tonight",
        currentAction: "Test",
        minimumAction: "Open",
        preferredTone: "Warm",
      },
      scheduledFor: "2026-07-17T12:00:00.000Z",
      taskName: "private-task-name",
      pendingAt: null,
      replyId: null,
      replyFingerprint: "a".repeat(64),
      attemptCount: 0,
      leaseToken: null,
      leaseExpiresAt: null,
      recovery: null,
      decision: null,
      traceRunIds: [],
      confirmedAt: null,
      confirmationId: null,
      nextCheckInId: null,
      nextTaskName: null,
      errorName: null,
      createdAt: "2026-07-17T11:59:00.000Z",
      updatedAt: "2026-07-17T11:59:00.000Z",
    });
    const client = ClientLiveCheckInSchema.parse({ ...document, traces: [] });
    expect(client).not.toHaveProperty("taskName");
    expect(client).not.toHaveProperty("replyFingerprint");
    expect(client).not.toHaveProperty("leaseToken");
  });
});
