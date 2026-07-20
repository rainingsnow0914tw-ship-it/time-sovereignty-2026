import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createFirestoreAgentTraceRepository } from "../infrastructure/firestore/agent-trace-repository";
import {
  LiveCheckInDisabledError,
  readLiveCheckInConfig,
  type LiveCheckInConfig,
} from "./config";
import {
  createLiveCheckInRepository,
  LiveCheckInStateError,
  LiveDeviceAlreadyPairedError,
  LivePairingAlreadyUsedError,
  LiveSessionStateError,
  type LiveCheckInRepository,
} from "./firestore-repository";
import { LiveGoalWorkspaceStateError } from "./goal-workspace-repository";
import {
  ClientLiveCheckInSchema,
  type ClientLiveCheckIn,
  type LiveCheckInDocument,
  type LiveDeviceSession,
} from "./schemas";
import {
  LIVE_SESSION_COOKIE,
  LiveOriginError,
  LiveSessionAuthenticationError,
  readSessionCookie,
} from "./session-auth";

export async function authenticateLiveRequest(request: NextRequest): Promise<{
  config: LiveCheckInConfig;
  repository: LiveCheckInRepository;
  session: LiveDeviceSession;
}> {
  const config = readLiveCheckInConfig();
  const payload = readSessionCookie(
    request.cookies.get(LIVE_SESSION_COOKIE)?.value,
    config.sessionSecret,
  );
  const repository = createLiveCheckInRepository(config.cloud);
  const session = await repository.authenticate(payload.sessionId);
  if (session.expiresAt !== payload.expiresAt) {
    throw new LiveSessionAuthenticationError("Session expiry does not match.");
  }
  return { config, repository, session };
}

export async function clientCheckIn(
  checkIn: LiveCheckInDocument,
  config: LiveCheckInConfig,
): Promise<ClientLiveCheckIn> {
  const traceRepository = createFirestoreAgentTraceRepository(config.cloud);
  const traces = await traceRepository.findMany(checkIn.traceRunIds);
  return ClientLiveCheckInSchema.parse({ ...checkIn, traces });
}

export function liveJson(
  body: unknown,
  init: { status?: number; headers?: HeadersInit } = {},
): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });
}

export function liveErrorResponse(
  error: unknown,
  operation: string,
): NextResponse {
  if (error instanceof LiveCheckInDisabledError) {
    return liveJson({ ok: false, enabled: false }, { status: 404 });
  }
  if (
    error instanceof LiveSessionAuthenticationError ||
    error instanceof LiveSessionStateError
  ) {
    return liveJson({ ok: false, error: "live_session_unauthorized" }, { status: 401 });
  }
  if (error instanceof LiveOriginError) {
    return liveJson({ ok: false, error: "origin_not_allowed" }, { status: 403 });
  }
  if (
    error instanceof LivePairingAlreadyUsedError ||
    error instanceof LiveDeviceAlreadyPairedError
  ) {
    return liveJson({ ok: false, error: "pairing_unavailable" }, { status: 409 });
  }
  if (error instanceof LiveCheckInStateError) {
    return liveJson({ ok: false, error: "live_check_in_conflict" }, { status: 409 });
  }
  if (error instanceof LiveGoalWorkspaceStateError) {
    return liveJson({ ok: false, error: "goal_workspace_conflict" }, { status: 409 });
  }
  if (error instanceof z.ZodError || error instanceof SyntaxError) {
    return liveJson({ ok: false, error: "invalid_live_request" }, { status: 400 });
  }
  console.error(`[live-check-in] ${operation} failed`, {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  return liveJson({ ok: false, error: "live_check_in_failed" }, { status: 500 });
}
