import { OAuth2Client } from "google-auth-library";
import { NextRequest } from "next/server";
import { z } from "zod";

import {
  CloudTaskAuthenticationError,
  verifyCloudTaskOidc,
} from "@/infrastructure/auth/cloud-task-oidc";
import { readLiveCheckInConfig } from "@/live-checkin/config";
import { createLiveCheckInRepository } from "@/live-checkin/firestore-repository";
import { createLiveGoalWorkspaceRepository } from "@/live-checkin/goal-workspace-repository";
import { liveErrorResponse, liveJson } from "@/live-checkin/route-helpers";

export const runtime = "nodejs";

const verifier = new OAuth2Client();
const BodySchema = z.object({ checkInId: z.string().trim().min(1).max(128) }).strict();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ checkInId: string }> },
) {
  try {
    const config = readLiveCheckInConfig();
    await verifyCloudTaskOidc({
      authorization: request.headers.get("authorization"),
      expectedAudience: config.cloud.tasksOidcAudience,
      expectedServiceAccountEmail: config.cloud.tasksServiceAccountEmail,
      verifier,
    });
    const { checkInId } = await context.params;
    const body = BodySchema.parse(await request.json());
    if (body.checkInId !== checkInId) {
      return liveJson({ ok: false, error: "check_in_id_mismatch" }, { status: 400 });
    }
    const repository = createLiveCheckInRepository(config.cloud);
    const scheduledCheckIn = await repository.findById(checkInId);
    if (!scheduledCheckIn) {
      return liveJson({ ok: false, error: "check_in_not_found" }, { status: 404 });
    }
    if (
      scheduledCheckIn.context.goalId &&
      !(await createLiveGoalWorkspaceRepository(config.cloud).isDeliverable(
        scheduledCheckIn.context.goalId,
      ))
    ) {
      console.info("[live-check-in] task ignored for inactive goal", {
        checkInId,
        goalId: scheduledCheckIn.context.goalId,
      });
      return liveJson({
        ok: true,
        result: "inactive_goal",
        checkInId,
      });
    }
    const result = await repository.markPending({
      checkInId,
      taskName: request.headers.get("x-cloudtasks-taskname")?.trim() || null,
    });
    console.info("[live-check-in] task delivered", {
      checkInId,
      duplicate: result.duplicate,
      status: result.checkIn.status,
    });
    return liveJson({
      ok: true,
      result: result.duplicate ? "duplicate" : "pending",
      checkInId,
    });
  } catch (error) {
    if (error instanceof CloudTaskAuthenticationError) {
      return liveJson({ ok: false, error: "unauthorized_task" }, { status: 401 });
    }
    return liveErrorResponse(error, "task-delivery");
  }
}
