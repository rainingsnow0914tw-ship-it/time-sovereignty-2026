import { NextRequest } from "next/server";

import {
  authenticateLiveRequest,
  clientCheckIn,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";
import {
  LiveConfirmRequestSchema,
  LiveScheduleContextSchema,
} from "@/live-checkin/schemas";
import { runLiveMemoryCurator } from "@/live-checkin/memory-curator";
import { createLiveCheckInScheduler } from "@/live-checkin/scheduler";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";
import { selectLiveFollowUpTime } from "@/live-checkin/quiet-hours";
import { OpenAiResponsesProvider } from "@/providers/ai/openai-provider";

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
      memoryDisposition: body.memoryDisposition,
    });
    let confirmedCheckIn = confirmation.checkIn;
    const curationClaim = await auth.repository.claimMemoryCuration({
      checkInId,
      sessionId: auth.session.id,
    });
    if (curationClaim.kind === "CLAIMED") {
      try {
        const relevantMemories = await auth.repository.findRelevantMemories({
          sessionId: auth.session.id,
          context: curationClaim.checkIn.context,
          limit: 8,
        });
        const curated = await runLiveMemoryCurator({
          checkIn: curationClaim.checkIn,
          relevantMemories,
          disposition: body.memoryDisposition,
          provider: new OpenAiResponsesProvider(),
        });
        confirmedCheckIn = await auth.repository.finishMemoryCuration({
          checkInId,
          leaseToken: curationClaim.leaseToken,
          output: curated.output,
          trace: curated.trace,
        });
      } catch (error) {
        confirmedCheckIn = await auth.repository.failMemoryCuration({
          checkInId,
          leaseToken: curationClaim.leaseToken,
        });
        console.error("[live-check-in] memory curation failed", {
          checkInId,
          name: error instanceof Error ? error.name : "UnknownError",
        });
      }
    } else {
      confirmedCheckIn = curationClaim.checkIn;
    }
    const decision = confirmedCheckIn.decision;
    if (!decision) throw new Error("Confirmed live check-in has no decision.");

    if (decision.assessment === "COMPLETED" || !decision.nextFollowUpAt) {
      return liveJson({
        ok: true,
        duplicate: confirmation.duplicate,
        checkIn: await clientCheckIn(confirmedCheckIn, auth.config),
        nextCheckIn: null,
      });
    }

    if (
      !confirmedCheckIn.context.goalId ||
      !confirmedCheckIn.context.locale ||
      !confirmedCheckIn.context.quietHours
    ) {
      throw new Error("Confirmed live check-in has no stable goal identity.");
    }

    const nextCheckInId = `follow-${checkInId}`.slice(0, 128);
    const scheduledFor = selectLiveFollowUpTime({
      proposedAt: decision.nextFollowUpAt,
      now: new Date(),
      quietHours: confirmedCheckIn.context.quietHours,
    });
    const nextContext = LiveScheduleContextSchema.parse({
      ...confirmedCheckIn.context,
      goalId: confirmedCheckIn.context.goalId,
      locale: confirmedCheckIn.context.locale,
      quietHours: confirmedCheckIn.context.quietHours,
      currentAction: decision.adaptedCommitment,
      minimumAction: decision.adaptedCommitment,
    });
    const next = await auth.repository.createScheduled({
      id: nextCheckInId,
      sessionId: auth.session.id,
      message: `How did “${decision.adaptedCommitment}” go?`,
      context: nextContext,
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
