import { OAuth2Client } from "google-auth-library";
import { NextRequest } from "next/server";
import { z } from "zod";

import { readCatchV2Config } from "@/catch-v2/config";
import { CatchDeliveryBusyError, deliverCatchLevel } from "@/catch-v2/delivery";
import { CatchLevelSchema } from "@/catch-v2/schemas";
import { CloudTaskAuthenticationError, verifyCloudTaskOidc } from "@/infrastructure/auth/cloud-task-oidc";
import { readLiveCheckInConfig } from "@/live-checkin/config";
import { createLiveCheckInRepository } from "@/live-checkin/firestore-repository";
import { liveErrorResponse, liveJson } from "@/live-checkin/route-helpers";

export const runtime = "nodejs";

const verifier = new OAuth2Client();
const BodySchema = z
  .object({
    eventId: z.string().trim().min(1).max(128),
    level: CatchLevelSchema,
  })
  .strict();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string; level: string }> },
) {
  try {
    const live = readLiveCheckInConfig();
    const v2 = readCatchV2Config();
    await verifyCloudTaskOidc({
      authorization: request.headers.get("authorization"),
      expectedAudience: live.cloud.tasksOidcAudience,
      expectedServiceAccountEmail: live.cloud.tasksServiceAccountEmail,
      verifier,
    });
    const params = await context.params;
    const body = BodySchema.parse(await request.json());
    const level = CatchLevelSchema.parse(Number(params.level));
    if (body.eventId !== params.eventId || body.level !== level) {
      return liveJson({ ok: false, error: "catch_task_mismatch" }, { status: 400 });
    }
    const checkIn = await createLiveCheckInRepository(live.cloud).findById(
      params.eventId,
    );
    if (!checkIn) {
      return liveJson({ ok: false, error: "catch_event_not_found" }, { status: 404 });
    }
    const delivered = await deliverCatchLevel({
      checkIn,
      level,
      cloud: live.cloud,
      v2,
    });
    console.info("[catch-v2] escalation task processed", {
      eventId: params.eventId,
      level,
      result: delivered.result,
      nextLevel: delivered.nextLevel,
      stopReason: delivered.stopReason ?? null,
    });
    return liveJson({ ok: true, ...delivered });
  } catch (error) {
    if (error instanceof CloudTaskAuthenticationError) {
      return liveJson({ ok: false, error: "unauthorized_task" }, { status: 401 });
    }
    if (error instanceof CatchDeliveryBusyError) {
      return liveJson(
        { ok: false, error: "catch_delivery_busy" },
        {
          status: 503,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    }
    return liveErrorResponse(error, "catch-escalation-task");
  }
}
