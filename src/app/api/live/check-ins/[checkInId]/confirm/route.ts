import { NextRequest } from "next/server";

import {
  authenticateLiveRequest,
  clientCheckIn,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";
import { LiveConfirmRequestSchema } from "@/live-checkin/schemas";
import { runLiveMemoryCurator } from "@/live-checkin/memory-curator";
import { createLiveCheckInScheduler } from "@/live-checkin/scheduler";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";
import { selectLiveFollowUpTime } from "@/live-checkin/quiet-hours";
import { OpenAiResponsesProvider } from "@/providers/ai/openai-provider";
import { advanceGoalAfterConfirmation } from "@/live-checkin/goal-loop";
import { createLiveGoalWorkspaceRepository } from "@/live-checkin/goal-workspace-repository";

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
      ownerId: auth.session.ownerId,
      confirmationId: body.confirmationId,
      memoryDisposition: body.memoryDisposition,
    });
    let confirmedCheckIn = confirmation.checkIn;
    const curationClaim = await auth.repository.claimMemoryCuration({
      checkInId,
      sessionId: auth.session.id,
      ownerId: auth.session.ownerId,
    });
    if (curationClaim.kind === "CLAIMED") {
      try {
        const relevantMemories = await auth.repository.findRelevantMemories({
          sessionId: auth.session.id,
          ownerId: auth.session.ownerId,
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

    if (confirmedCheckIn.context.goalId) {
      const advanced = await advanceGoalAfterConfirmation({
        checkIn: confirmedCheckIn,
        sessionId: auth.session.id,
        ownerId: auth.session.ownerId,
        config: auth.config,
        checkInRepository: auth.repository,
        workspaceRepository: createLiveGoalWorkspaceRepository(
          auth.config.cloud,
        ),
      });
      return liveJson({
        ok: true,
        duplicate: confirmation.duplicate,
        checkIn: await clientCheckIn(confirmedCheckIn, auth.config),
        nextCheckIn: advanced.nextCheckIn
          ? await clientCheckIn(advanced.nextCheckIn, auth.config)
          : null,
        goal: advanced.workspace,
      });
    }

    if (decision.assessment === "COMPLETED" || !decision.nextFollowUpAt) {
      return liveJson({
        ok: true,
        duplicate: confirmation.duplicate,
        checkIn: await clientCheckIn(confirmedCheckIn, auth.config),
        nextCheckIn: null,
      });
    }

    const nextCheckInId = `follow-${checkInId}`.slice(0, 128);
    const scheduledFor = selectLiveFollowUpTime({
      proposedAt: decision.nextFollowUpAt,
      now: new Date(),
      quietHours: confirmedCheckIn.context.quietHours,
    });
    const next = await auth.repository.createScheduled({
      id: nextCheckInId,
      sessionId: auth.session.id,
      ownerId: auth.session.ownerId,
      message: `How did “${decision.adaptedCommitment}” go?`,
      context: {
        ...confirmedCheckIn.context,
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
