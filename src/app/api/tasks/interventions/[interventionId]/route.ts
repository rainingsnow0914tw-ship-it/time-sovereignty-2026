import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  CloudTaskAuthenticationError,
  verifyCloudTaskOidc,
} from "@/infrastructure/auth/cloud-task-oidc";
import {
  createInterventionCallbackRepository,
  InterventionCallbackLeaseError,
  InterventionCallbackStateError,
  InterventionNotFoundError,
} from "@/infrastructure/firestore/intervention-callback-repository";
import { readCloudConfig } from "@/infrastructure/gcp/config";

export const runtime = "nodejs";

const CallbackBodySchema = z
  .object({ interventionId: z.string().trim().min(1).max(240) })
  .strict();

const verifier = new OAuth2Client();

function retryCountFrom(request: NextRequest): number {
  const raw = request.headers.get("x-cloudtasks-taskretrycount") ?? "0";
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function taskNameFrom(request: NextRequest): string | null {
  const value = request.headers.get("x-cloudtasks-taskname")?.trim();
  return value ? value.slice(0, 1_000) : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ interventionId: string }> },
) {
  try {
    const config = readCloudConfig();
    await verifyCloudTaskOidc({
      authorization: request.headers.get("authorization"),
      expectedAudience: config.tasksOidcAudience,
      expectedServiceAccountEmail: config.tasksServiceAccountEmail,
      verifier,
    });

    const { interventionId: pathInterventionId } = await context.params;
    const body = CallbackBodySchema.parse(await request.json());
    if (body.interventionId !== pathInterventionId) {
      return NextResponse.json(
        { ok: false, error: "intervention_id_mismatch" },
        { status: 400 },
      );
    }

    const repository = createInterventionCallbackRepository(config);
    const claim = await repository.claim({
      interventionId: pathInterventionId,
      taskName: taskNameFrom(request),
      retryCount: retryCountFrom(request),
    });

    if (claim.kind === "DUPLICATE") {
      console.info("[task-callback] duplicate", {
        interventionId: pathInterventionId,
        state: claim.intervention.state,
        attemptCount: claim.receipt.attemptCount,
      });
      return NextResponse.json({
        ok: true,
        result: "duplicate",
        interventionId: pathInterventionId,
        state: claim.intervention.state,
        attemptCount: claim.receipt.attemptCount,
      });
    }

    if (claim.kind === "BUSY") {
      return NextResponse.json(
        { ok: false, error: "callback_lease_busy" },
        {
          status: 503,
          headers: { "Retry-After": String(claim.retryAfterSeconds) },
        },
      );
    }

    const completed = await repository.complete({
      interventionId: pathInterventionId,
      leaseToken: claim.receipt.leaseToken,
    });
    console.info("[task-callback] completed", {
      interventionId: pathInterventionId,
      state: claim.intervention.state,
      attemptCount: completed.attemptCount,
    });

    return NextResponse.json({
      ok: true,
      result: "processed",
      interventionId: pathInterventionId,
      state: claim.intervention.state,
      attemptCount: completed.attemptCount,
    });
  } catch (error) {
    if (error instanceof CloudTaskAuthenticationError) {
      return NextResponse.json(
        { ok: false, error: "unauthorized_task" },
        { status: 401 },
      );
    }
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, error: "invalid_callback_request" },
        { status: 400 },
      );
    }
    if (error instanceof InterventionNotFoundError) {
      return NextResponse.json(
        { ok: false, error: "intervention_not_found" },
        { status: 404 },
      );
    }
    if (error instanceof InterventionCallbackStateError) {
      return NextResponse.json(
        { ok: false, error: "intervention_state_conflict" },
        { status: 409 },
      );
    }
    if (error instanceof InterventionCallbackLeaseError) {
      return NextResponse.json(
        { ok: false, error: "callback_lease_conflict" },
        { status: 503 },
      );
    }

    console.error("[task-callback] failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown failure",
    });
    return NextResponse.json(
      { ok: false, error: "callback_failed" },
      { status: 500 },
    );
  }
}
