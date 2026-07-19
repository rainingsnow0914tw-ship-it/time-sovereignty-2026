import { NextRequest } from "next/server";

import { createCatchDeviceRepository } from "@/catch-v2/firestore-device-repository";
import { authenticateCatchDeviceRequest, catchV2ErrorResponse, catchV2Json } from "@/catch-v2/route-helpers";
import { readLiveCheckInConfig } from "@/live-checkin/config";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { device } = await authenticateCatchDeviceRequest(request);
    return catchV2Json({
      ok: true,
      paired: true,
      deviceLabel: device.deviceLabel,
      locale: device.locale,
      expiresAt: device.expiresAt,
      fullScreenEnabled: device.fullScreenConsentAt !== null,
    });
  } catch (error) {
    return catchV2ErrorResponse(error, "native-session-read");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { device } = await authenticateCatchDeviceRequest(request);
    const live = readLiveCheckInConfig();
    await createCatchDeviceRepository(live.cloud).revoke(device.id);
    return catchV2Json({ ok: true, revoked: true });
  } catch (error) {
    return catchV2ErrorResponse(error, "native-session-revoke");
  }
}
