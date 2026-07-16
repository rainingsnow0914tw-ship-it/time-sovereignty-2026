import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  CloudTaskAuthenticationError,
  verifyCloudTaskOidc,
} from "@/infrastructure/auth/cloud-task-oidc";
import { createFirestoreAgentTraceRepository } from "@/infrastructure/firestore/agent-trace-repository";
import {
  createFirestoreOrchestrationRunRepository,
  OrchestrationRunLeaseError,
  type OrchestrationRunRepository,
} from "@/infrastructure/firestore/orchestration-run-repository";
import { readCloudConfig } from "@/infrastructure/gcp/config";
import {
  ChiefOfStaffOrchestrationRequestSchema,
  ChiefOfStaffOrchestrator,
  selectAgentsByNeed,
} from "@/orchestration/chief-of-staff";
import { OpenAiResponsesProvider } from "@/providers/ai/openai-provider";

export const runtime = "nodejs";

const verifier = new OAuth2Client();

function taskNameFrom(request: NextRequest): string | null {
  const value = request.headers.get("x-cloudtasks-taskname")?.trim();
  return value ? value.slice(0, 1_000) : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
  let runRepository: OrchestrationRunRepository | null = null;
  let activeLease: { requestId: string; leaseToken: string } | null = null;
  let requestIdForLog = "unknown";

  try {
    const config = readCloudConfig();
    await verifyCloudTaskOidc({
      authorization: request.headers.get("authorization"),
      expectedAudience: config.tasksOidcAudience,
      expectedServiceAccountEmail: config.tasksServiceAccountEmail,
      verifier,
    });

    const { requestId } = await context.params;
    requestIdForLog = requestId;
    const body = ChiefOfStaffOrchestrationRequestSchema.parse(await request.json());
    if (body.requestId !== requestId) {
      return NextResponse.json(
        { ok: false, error: "request_id_mismatch" },
        { status: 400 },
      );
    }

    const dispatchedAgents = selectAgentsByNeed(body.signals);
    runRepository = createFirestoreOrchestrationRunRepository(config);
    const claim = await runRepository.claim({
      requestId,
      dispatchedAgents,
      taskName: taskNameFrom(request),
    });

    if (claim.kind === "DUPLICATE") {
      console.info("[agent-orchestration] duplicate", {
        requestId,
        attemptCount: claim.receipt.attemptCount,
        dispatchedAgents: claim.receipt.dispatchedAgents,
      });
      return NextResponse.json({
        ok: true,
        result: "duplicate",
        requestId,
        attemptCount: claim.receipt.attemptCount,
        dispatchedAgents: claim.receipt.dispatchedAgents,
      });
    }

    if (claim.kind === "BUSY") {
      return NextResponse.json(
        { ok: false, error: "orchestration_lease_busy" },
        {
          status: 503,
          headers: { "Retry-After": String(claim.retryAfterSeconds) },
        },
      );
    }

    activeLease = {
      requestId,
      leaseToken: claim.receipt.leaseToken,
    };
    const orchestrator = new ChiefOfStaffOrchestrator(
      new OpenAiResponsesProvider(),
      createFirestoreAgentTraceRepository(config),
    );
    const result = await orchestrator.run(body);
    const completed = await runRepository.complete({
      requestId,
      leaseToken: activeLease.leaseToken,
      decision: result.decision,
    });
    activeLease = null;

    console.info("[agent-orchestration] completed", {
      requestId,
      attemptCount: completed.attemptCount,
      dispatchedAgents: result.decision.dispatchedAgents,
      traceCount: result.traces.length,
      models: [...new Set(result.traces.map((trace) => trace.model))],
    });

    return NextResponse.json({
      ok: true,
      result: "processed",
      requestId,
      attemptCount: completed.attemptCount,
      dispatchedAgents: result.decision.dispatchedAgents,
      traceCount: result.traces.length,
    });
  } catch (error) {
    if (runRepository && activeLease) {
      try {
        await runRepository.fail({
          requestId: activeLease.requestId,
          leaseToken: activeLease.leaseToken,
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      } catch {
        console.error("[agent-orchestration] lease release failed", {
          requestId: activeLease.requestId,
        });
      }
    }

    if (error instanceof CloudTaskAuthenticationError) {
      return NextResponse.json(
        { ok: false, error: "unauthorized_task" },
        { status: 401 },
      );
    }
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, error: "invalid_orchestration_request" },
        { status: 400 },
      );
    }
    if (error instanceof OrchestrationRunLeaseError) {
      return NextResponse.json(
        { ok: false, error: "orchestration_lease_conflict" },
        { status: 503 },
      );
    }

    console.error("[agent-orchestration] failed", {
      requestId: requestIdForLog,
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { ok: false, error: "orchestration_failed" },
      { status: 500 },
    );
  }
}
