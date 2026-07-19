import { describe, expect, it } from "vitest";

import {
  CatchDeviceAuthenticationError,
  createOpaqueCredential,
  credentialMatchesHash,
  hashOpaqueCredential,
  readBearerCredential,
} from "./native-auth";

describe("V2 native credential boundary", () => {
  it("issues high-entropy opaque values and stores only deterministic hashes", () => {
    const credential = createOpaqueCredential();
    expect(credential.length).toBeGreaterThanOrEqual(32);
    expect(hashOpaqueCredential(credential)).toMatch(/^[a-f0-9]{64}$/u);
    expect(credentialMatchesHash(credential, hashOpaqueCredential(credential))).toBe(
      true,
    );
    expect(credentialMatchesHash(`${credential}x`, hashOpaqueCredential(credential))).toBe(
      false,
    );
  });

  it("accepts one strict bearer credential and rejects ambiguous headers", () => {
    expect(readBearerCredential("Bearer private-device-value")).toBe(
      "private-device-value",
    );
    expect(() => readBearerCredential(null)).toThrow(
      CatchDeviceAuthenticationError,
    );
    expect(() => readBearerCredential("Basic value")).toThrow(
      CatchDeviceAuthenticationError,
    );
    expect(() => readBearerCredential("Bearer one two")).toThrow(
      CatchDeviceAuthenticationError,
    );
  });
});
