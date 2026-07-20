import { NextRequest } from "next/server";

import { reviseLiveGoalArchitectPlan } from "@/live-checkin/goal-architect";
import { LiveGoalArchitectRevisionRequestSchema } from "@/live-checkin/goal-architect-schemas";
import { LiveGoalPlanStateError } from "@/live-checkin/goal-plan-repository";
import {
  authenticateLiveRequest,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { config, session } = await authenticateLiveRequest(request);
    assertAllowedOrigin(request, config);
    const input = LiveGoalArchitectRevisionRequestSchema.parse(
      await request.json(),
    );
    const result = await reviseLiveGoalArchitectPlan({
      request: input,
      sessionId: session.id,
      config,
    });
    if (result.kind === "BUSY") {
      return liveJson(
        { ok: false, error: "live_goal_revision_in_flight" },
        {
          status: 409,
          headers: { "Retry-After": String(result.retryAfterSeconds) },
        },
      );
    }
    return liveJson({
      ok: true,
      duplicate: result.duplicate,
      plan: result.plan,
      trace: result.trace,
    });
  } catch (error) {
    if (error instanceof LiveGoalPlanStateError) {
      return liveJson(
        { ok: false, error: "live_goal_revision_conflict" },
        { status: 409 },
      );
    }
    return liveErrorResponse(error, "goal-architect-revision");
  }
}
