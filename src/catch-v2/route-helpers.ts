import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { readLiveCheckInConfig } from "../live-checkin/config";
import type { CatchDeviceDocument } from "./device";
import {
  CatchDeviceAlreadyPairedError,
  CatchDeviceStateError,
  CatchPairingTicketError,
  createCatchDeviceRepository,
} from "./firestore-device-repository";
import {
  CatchDeviceAuthenticationError,
  credentialMatchesHash,
  readBearerCredential,
} from "./native-auth";
import { CatchV2DisabledError, readCatchV2Config } from "./config";

export async function authenticateCatchDeviceRequest(
  request: NextRequest,
): Promise<{ device: CatchDeviceDocument }> {
  readCatchV2Config();
  const liveConfig = readLiveCheckInConfig();
  const deviceId = request.headers.get("x-time-sovereignty-device")?.trim();
  if (!deviceId) throw new CatchDeviceAuthenticationError();
  const credential = readBearerCredential(request.headers.get("authorization"));
  const repository = createCatchDeviceRepository(liveConfig.cloud);
  const device = await repository.findById(deviceId);
  if (
    !device ||
    device.revokedAt !== null ||
    new Date(device.expiresAt).getTime() <= Date.now() ||
    !credentialMatchesHash(credential, device.credentialHash)
  ) {
    throw new CatchDeviceAuthenticationError();
  }
  return { device };
}

export function catchV2Json(
  body: unknown,
  init: { status?: number; headers?: HeadersInit } = {},
): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: { "Cache-Control": "no-store", ...init.headers },
  });
}

export function catchV2ErrorResponse(
  error: unknown,
  operation: string,
): NextResponse {
  if (error instanceof CatchV2DisabledError) {
    return catchV2Json({ ok: false, enabled: false }, { status: 404 });
  }
  if (error instanceof CatchDeviceAuthenticationError) {
    return catchV2Json({ ok: false, error: "native_device_unauthorized" }, { status: 401 });
  }
  if (error instanceof CatchPairingTicketError) {
    return catchV2Json({ ok: false, error: "pairing_ticket_invalid" }, { status: 401 });
  }
  if (error instanceof CatchDeviceAlreadyPairedError) {
    return catchV2Json({ ok: false, error: "native_device_already_paired" }, { status: 409 });
  }
  if (error instanceof CatchDeviceStateError) {
    return catchV2Json({ ok: false, error: "native_device_conflict" }, { status: 409 });
  }
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return catchV2Json({ ok: false, error: "invalid_native_request" }, { status: 400 });
  }
  console.error(`[catch-v2] ${operation} failed`, {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  return catchV2Json({ ok: false, error: "native_delivery_failed" }, { status: 500 });
}
