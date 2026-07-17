import { describe, expect, it } from "vitest";

import {
  createSessionCookie,
  LiveSessionAuthenticationError,
  readSessionCookie,
  secretMatches,
} from "./session-auth";

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
