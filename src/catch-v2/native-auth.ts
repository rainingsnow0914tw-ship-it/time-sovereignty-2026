import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export class CatchDeviceAuthenticationError extends Error {
  constructor(message = "Native device authentication failed.") {
    super(message);
    this.name = "CatchDeviceAuthenticationError";
  }
}

export function createOpaqueCredential(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueCredential(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function credentialMatchesHash(
  candidate: string,
  expectedHash: string,
): boolean {
  const actual = Buffer.from(hashOpaqueCredential(candidate), "hex");
  let expected: Buffer;
  try {
    expected = Buffer.from(expectedHash, "hex");
  } catch {
    return false;
  }
  return (
    expected.length === actual.length && timingSafeEqual(actual, expected)
  );
}

export function readBearerCredential(authorization: string | null): string {
  const match = /^Bearer\s+([^\s]+)$/iu.exec(authorization ?? "");
  if (!match) throw new CatchDeviceAuthenticationError();
  return match[1];
}
