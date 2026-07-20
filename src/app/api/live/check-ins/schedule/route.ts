import { NextRequest } from "next/server";

import {
  authenticateLiveRequest,
  clientCheckIn,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";
import { LiveScheduleRequestSchema } from "@/live-checkin/schemas";
import { createLiveCheckInScheduler } from "@/live-checkin/scheduler";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { config, repository, session } = await authenticateLiveRequest(request);
    assertAllowedOrigin(request, config);
    const body = LiveScheduleRequestSchema.parse(await request.json());
    const scheduledMillis = new Date(body.scheduledFor).getTime();
    const now = Date.now();
    if (scheduledMillis < now + 2_000 || scheduledMillis > now + 24 * 60 * 60 * 1_000) {
      return liveJson(
        { ok: false, error: "scheduled_time_out_of_range" },
        { status: 400 },
      );
    }

    const created = await repository.createScheduled({
      id: body.scheduleId,
      sessionId: session.id,
      ownerId: session.ownerId,
      message: body.message,
      context: body.context,
      scheduledFor: body.scheduledFor,
    });
    let checkIn = created.checkIn;
    if (!checkIn.taskName) {
      const scheduled = await createLiveCheckInScheduler(config.cloud).schedule(checkIn);
      checkIn = await repository.attachTask(checkIn.id, scheduled.taskName);
    }
    return liveJson({
      ok: true,
      duplicate: created.duplicate,
      checkIn: await clientCheckIn(checkIn, config),
    });
  } catch (error) {
    return liveErrorResponse(error, "schedule");
  }
}
