import { NextRequest } from "next/server";

import { createLiveGoalWorkspaceRepository } from "@/live-checkin/goal-workspace-repository";
import { GoalWorkspaceCreateRequestSchema } from "@/live-checkin/goal-workspace-requests";
import { createInitialGoalWorkspace } from "@/live-checkin/goal-workspace";
import { scheduleNextGoalOccurrence } from "@/live-checkin/goal-loop";
import {
  authenticateLiveRequest,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateLiveRequest(request);
    const goals = await createLiveGoalWorkspaceRepository(
      auth.config.cloud,
    ).list(auth.session.ownerId);
    return liveJson({ ok: true, goals });
  } catch (error) {
    return liveErrorResponse(error, "list-goals");
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateLiveRequest(request);
    assertAllowedOrigin(request, auth.config);
    const body = GoalWorkspaceCreateRequestSchema.parse(await request.json());
    const { workspace, planRevision } = createInitialGoalWorkspace({
      ownerId: auth.session.ownerId,
      requestId: body.requestId,
      record: body.record,
      scheduleTimes: body.scheduleTimes,
    });
    const workspaceRepository = createLiveGoalWorkspaceRepository(
      auth.config.cloud,
    );
    const result = await workspaceRepository.create({ workspace, planRevision });
    const scheduled = result.workspace.nextCheckInId
      ? { workspace: result.workspace, checkIn: null }
      : await scheduleNextGoalOccurrence({
          workspace: result.workspace,
          plan: planRevision.plan,
          sessionId: auth.session.id,
          ownerId: auth.session.ownerId,
          sourceKey: `initial-${body.requestId}`,
          config: auth.config,
          checkInRepository: auth.repository,
          workspaceRepository,
          preferredAt: planRevision.plan.initialCheckInProposal.scheduledFor,
        });
    return liveJson({
      ok: true,
      workspace: scheduled.workspace,
      duplicate: result.duplicate,
      nextCheckInId: scheduled.workspace.nextCheckInId,
    });
  } catch (error) {
    return liveErrorResponse(error, "save-goal");
  }
}
