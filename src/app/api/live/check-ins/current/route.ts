import { NextRequest } from "next/server";

import {
  authenticateLiveRequest,
  clientCheckIn,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { config, repository, session } = await authenticateLiveRequest(request);
    const checkIn = await repository.findCurrent(session.id);
    const lastConfirmed = session.lastConfirmedCheckInId
      ? await repository.findById(session.lastConfirmedCheckInId)
      : null;
    return liveJson({
      ok: true,
      paired: true,
      checkIn: checkIn ? await clientCheckIn(checkIn, config) : null,
      lastConfirmedCheckIn: lastConfirmed
        ? await clientCheckIn(lastConfirmed, config)
        : null,
    });
  } catch (error) {
    return liveErrorResponse(error, "current-read");
  }
}
