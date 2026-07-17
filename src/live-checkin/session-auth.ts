import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import type { NextRequest } from "next/server";

import type { LiveCheckInConfig } from "./config";

export const LIVE_SESSION_COOKIE = "ts_live_device";

type SessionPayload = { sessionId: string; expiresAt: string };

export class LiveSessionAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveSessionAuthenticationError";
  }
}

export class LiveOriginError extends Error {
  constructor() {
    super("Request origin is not authorized.");
    this.name = "LiveOriginError";
  }
}

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function secretMatches(candidate: string, expected: string): boolean {
  const left = createHash("sha256").update(candidate, "utf8").digest();
  const right = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(left, right);
}

export function assertAllowedOrigin(
  request: NextRequest,
  config: LiveCheckInConfig,
): void {
  const origin = request.headers.get("origin");
  if (!origin || !config.allowedOrigins.includes(origin)) {
    throw new LiveOriginError();
  }
}

export function createSessionCookie(
  payload: SessionPayload,
  secret: string,
): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signature = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function readSessionCookie(
  rawCookie: string | undefined,
  secret: string,
  now = new Date(),
): SessionPayload {
  const [encoded, suppliedSignature, extra] = rawCookie?.split(".") ?? [];
  if (!encoded || !suppliedSignature || extra) {
    throw new LiveSessionAuthenticationError("Missing live-device session.");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(encoded)
    .digest();
  let supplied: Buffer;
  try {
    supplied = Buffer.from(suppliedSignature, "base64url");
  } catch {
    throw new LiveSessionAuthenticationError("Invalid live-device session.");
  }
  if (
    supplied.length !== expectedSignature.length ||
    !timingSafeEqual(supplied, expectedSignature)
  ) {
    throw new LiveSessionAuthenticationError("Invalid live-device signature.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new LiveSessionAuthenticationError("Invalid live-device payload.");
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as SessionPayload).sessionId !== "string" ||
    typeof (payload as SessionPayload).expiresAt !== "string" ||
    !Number.isFinite(new Date((payload as SessionPayload).expiresAt).getTime())
  ) {
    throw new LiveSessionAuthenticationError("Invalid live-device payload.");
  }
  const parsed = payload as SessionPayload;
  if (new Date(parsed.expiresAt).getTime() <= now.getTime()) {
    throw new LiveSessionAuthenticationError("Live-device session expired.");
  }
  return parsed;
}
