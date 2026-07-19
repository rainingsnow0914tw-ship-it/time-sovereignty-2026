import { NextRequest } from "next/server";

import {
  authenticateLiveRequest,
  clientCheckIn,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";
import { EntityIdSchema } from "@/domain/shared";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { config, repository, session } = await authenticateLiveRequest(request);
    const goalId = EntityIdSchema.parse(request.nextUrl.searchParams.get("goalId"));
    const [checkIn, lastConfirmed] = await Promise.all([
      repository.findCurrent(session.id, goalId),
      repository.findLastConfirmed(session.id, goalId),
    ]);
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
