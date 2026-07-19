import { describe, expect, it } from "vitest";

import { buildNativePairingUri } from "./native-pairing";

describe("private native pairing link", () => {
  it("puts the one-time ticket in the private app scheme", () => {
    const ticket = "a".repeat(43);
    expect(buildNativePairingUri(ticket)).toBe(
      `timesovereignty-private://pair?ticket=${ticket}`,
    );
  });

  it("rejects short or oversized values before opening another app", () => {
    expect(() => buildNativePairingUri("short")).toThrow(/invalid/i);
    expect(() => buildNativePairingUri("a".repeat(501))).toThrow(/invalid/i);
  });
});
