import { randomUUID } from "node:crypto";

import { NextRequest } from "next/server";

import { readLiveCheckInConfig } from "@/live-checkin/config";
import { createLiveCheckInRepository } from "@/live-checkin/firestore-repository";
import { LivePairRequestSchema } from "@/live-checkin/schemas";
import {
  assertAllowedOrigin,
  createSessionCookie,
  LIVE_SESSION_COOKIE,
  secretMatches,
  sha256,
} from "@/live-checkin/session-auth";
import { liveErrorResponse, liveJson } from "@/live-checkin/route-helpers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const config = readLiveCheckInConfig();
    assertAllowedOrigin(request, config);
    const body = LivePairRequestSchema.parse(await request.json());
    if (!secretMatches(body.pairingCode, config.pairingSecret)) {
      return liveJson({ ok: false, error: "pairing_denied" }, { status: 401 });
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + config.sessionHours * 60 * 60 * 1_000,
    ).toISOString();
    const repository = createLiveCheckInRepository(config.cloud, {
      idFactory: randomUUID,
    });
    const session = await repository.pair({
      pairingFingerprint: sha256(config.pairingSecret),
      deviceLabel: body.deviceLabel,
      expiresAt,
    });
    const response = liveJson({
      ok: true,
      paired: true,
      expiresAt: session.expiresAt,
      deviceLabel: session.deviceLabel,
    });
    response.cookies.set({
      name: LIVE_SESSION_COOKIE,
      value: createSessionCookie(
        { sessionId: session.id, expiresAt: session.expiresAt },
        config.sessionSecret,
      ),
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: config.sessionHours * 60 * 60,
    });
    return response;
  } catch (error) {
    return liveErrorResponse(error, "pair");
  }
}
