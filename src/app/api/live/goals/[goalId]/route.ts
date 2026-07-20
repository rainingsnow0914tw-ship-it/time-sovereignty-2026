import { NextRequest } from "next/server";

import { createLiveGoalWorkspaceRepository } from "@/live-checkin/goal-workspace-repository";
import {
  GoalWorkspaceDeleteRequestSchema,
  GoalWorkspaceStatusRequestSchema,
} from "@/live-checkin/goal-workspace-requests";
import {
  authenticateLiveRequest,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";
import { createLiveCheckInScheduler } from "@/live-checkin/scheduler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ goalId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateLiveRequest(request);
    const { goalId } = await context.params;
    const repository = createLiveGoalWorkspaceRepository(auth.config.cloud);
    const goal = await repository.find(auth.session.ownerId, goalId);
    if (!goal) {
      return liveJson({ ok: false, error: "goal_not_found" }, { status: 404 });
    }
    const [planRevision, attendance] = await Promise.all([
      repository.findPlanRevision(
        auth.session.ownerId,
        goalId,
        goal.currentPlanRevisionId,
      ),
      repository.listAttendance(auth.session.ownerId, goalId),
    ]);
    if (!planRevision) {
      return liveJson(
        { ok: false, error: "goal_plan_not_found" },
        { status: 409 },
      );
    }
    return liveJson({ ok: true, goal, planRevision, attendance });
  } catch (error) {
    return liveErrorResponse(error, "get-goal");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateLiveRequest(request);
    assertAllowedOrigin(request, auth.config);
    const { goalId } = await context.params;
    const body = GoalWorkspaceStatusRequestSchema.parse(await request.json());
    const result = await createLiveGoalWorkspaceRepository(
      auth.config.cloud,
    ).transition({
      ownerId: auth.session.ownerId,
      goalId,
      expectedRevision: body.expectedRevision,
      status: body.status,
    });
    if (result.invalidatedTaskName) {
      await createLiveCheckInScheduler(auth.config.cloud).cancel(
        result.invalidatedTaskName,
      );
    }
    return liveJson({ ok: true, ...result });
  } catch (error) {
    return liveErrorResponse(error, "update-goal-status");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await authenticateLiveRequest(request);
    assertAllowedOrigin(request, auth.config);
    const { goalId } = await context.params;
    const body = GoalWorkspaceDeleteRequestSchema.parse(await request.json());
    const result = await createLiveGoalWorkspaceRepository(
      auth.config.cloud,
    ).delete({
      ownerId: auth.session.ownerId,
      goalId,
      expectedRevision: body.expectedRevision,
    });
    if (result.tombstone.invalidatedTaskName) {
      await createLiveCheckInScheduler(auth.config.cloud).cancel(
        result.tombstone.invalidatedTaskName,
      );
    }
    return liveJson({ ok: true, ...result });
  } catch (error) {
    return liveErrorResponse(error, "delete-goal");
  }
}
