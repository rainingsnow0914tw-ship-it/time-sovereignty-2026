import { NextRequest } from "next/server";

import {
  authenticateLiveRequest,
  clientCheckIn,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";
import { LiveConfirmRequestSchema } from "@/live-checkin/schemas";
import { createLiveCheckInScheduler } from "@/live-checkin/scheduler";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";
import { selectLiveFollowUpTime } from "@/live-checkin/quiet-hours";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ checkInId: string }> },
) {
  try {
    const auth = await authenticateLiveRequest(request);
    assertAllowedOrigin(request, auth.config);
    const { checkInId } = await context.params;
    const body = LiveConfirmRequestSchema.parse(await request.json());
    const confirmation = await auth.repository.confirm({
      checkInId,
      sessionId: auth.session.id,
      confirmationId: body.confirmationId,
    });
    const decision = confirmation.checkIn.decision;
    if (!decision) throw new Error("Confirmed live check-in has no decision.");

    const nextCheckInId = `follow-${checkInId}`.slice(0, 128);
    const scheduledFor = selectLiveFollowUpTime({
      proposedAt: decision.nextFollowUpAt,
      now: new Date(),
      quietHours: confirmation.checkIn.context.quietHours,
    });
    const next = await auth.repository.createScheduled({
      id: nextCheckInId,
      sessionId: auth.session.id,
      message: `How did “${decision.adaptedCommitment}” go?`,
      context: {
        ...confirmation.checkIn.context,
        currentAction: decision.adaptedCommitment,
        minimumAction: decision.adaptedCommitment,
      },
      scheduledFor,
    });
    let nextCheckIn = next.checkIn;
    if (!nextCheckIn.taskName) {
      const scheduled = await createLiveCheckInScheduler(auth.config.cloud).schedule(
        nextCheckIn,
      );
      nextCheckIn = await auth.repository.attachTask(
        nextCheckIn.id,
        scheduled.taskName,
      );
    }
    const confirmed = await auth.repository.attachNextTask({
      checkInId,
      nextCheckInId: nextCheckIn.id,
      nextTaskName: nextCheckIn.taskName ?? "unknown",
    });

    return liveJson({
      ok: true,
      duplicate: confirmation.duplicate,
      checkIn: await clientCheckIn(confirmed, auth.config),
      nextCheckIn: await clientCheckIn(nextCheckIn, auth.config),
    });
  } catch (error) {
    return liveErrorResponse(error, "confirm");
  }
}
