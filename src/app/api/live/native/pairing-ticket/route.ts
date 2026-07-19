import { randomBytes } from "node:crypto";

import { NextRequest } from "next/server";

import { readCatchV2Config } from "@/catch-v2/config";
import { CatchPairingTicketResponseSchema } from "@/catch-v2/device";
import { createCatchDeviceRepository } from "@/catch-v2/firestore-device-repository";
import { hashOpaqueCredential } from "@/catch-v2/native-auth";
import { catchV2ErrorResponse, catchV2Json } from "@/catch-v2/route-helpers";
import { authenticateLiveRequest } from "@/live-checkin/route-helpers";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const v2 = readCatchV2Config();
    const { config, session } = await authenticateLiveRequest(request);
    assertAllowedOrigin(request, config);

    const now = new Date();
    const rawTicket = randomBytes(32).toString("base64url");
    const ticketExpiresAt = new Date(
      now.getTime() + v2.pairingTicketMinutes * 60_000,
    ).toISOString();
    const requestedDeviceExpiry = new Date(
      now.getTime() + v2.deviceHours * 60 * 60_000,
    ).getTime();
    const deviceExpiresAt = new Date(
      Math.min(requestedDeviceExpiry, new Date(session.expiresAt).getTime()),
    ).toISOString();

    await createCatchDeviceRepository(config.cloud).createPairingTicket({
      version: 1,
      ticketHash: hashOpaqueCredential(rawTicket),
      sessionId: session.id,
      expiresAt: ticketExpiresAt,
      deviceExpiresAt,
      claimedAt: null,
      createdAt: now.toISOString(),
    });

    return catchV2Json(
      CatchPairingTicketResponseSchema.parse({
        ok: true,
        pairingTicket: rawTicket,
        expiresAt: ticketExpiresAt,
      }),
    );
  } catch (error) {
    return catchV2ErrorResponse(error, "pairing-ticket-create");
  }
}
