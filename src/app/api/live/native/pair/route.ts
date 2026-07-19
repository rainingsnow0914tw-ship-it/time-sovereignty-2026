import { randomUUID } from "node:crypto";

import { NextRequest } from "next/server";

import { readCatchV2Config } from "@/catch-v2/config";
import {
  CatchNativePairRequestSchema,
  CatchNativePairResponseSchema,
} from "@/catch-v2/device";
import { createCatchDeviceRepository } from "@/catch-v2/firestore-device-repository";
import {
  createOpaqueCredential,
  hashOpaqueCredential,
} from "@/catch-v2/native-auth";
import { catchV2ErrorResponse, catchV2Json } from "@/catch-v2/route-helpers";
import { readLiveCheckInConfig } from "@/live-checkin/config";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    readCatchV2Config();
    const live = readLiveCheckInConfig();
    const body = CatchNativePairRequestSchema.parse(await request.json());
    const credential = createOpaqueCredential();
    const deviceId = randomUUID();
    const device = await createCatchDeviceRepository(live.cloud).claimPairingTicket({
      ticketHash: hashOpaqueCredential(body.pairingTicket),
      deviceId,
      credentialHash: hashOpaqueCredential(credential),
      request: body,
    });

    return catchV2Json(
      CatchNativePairResponseSchema.parse({
        ok: true,
        deviceId: device.id,
        credential,
        expiresAt: device.expiresAt,
        fullScreenEnabled: device.fullScreenConsentAt !== null,
      }),
    );
  } catch (error) {
    return catchV2ErrorResponse(error, "native-pair");
  }
}
