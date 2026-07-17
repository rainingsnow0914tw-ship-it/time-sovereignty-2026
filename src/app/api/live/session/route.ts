import { NextRequest } from "next/server";

import {
  authenticateLiveRequest,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";
import { assertAllowedOrigin, LIVE_SESSION_COOKIE } from "@/live-checkin/session-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { session } = await authenticateLiveRequest(request);
    return liveJson({
      ok: true,
      enabled: true,
      paired: true,
      deviceLabel: session.deviceLabel,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    return liveErrorResponse(error, "session-read");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { config, repository, session } = await authenticateLiveRequest(request);
    assertAllowedOrigin(request, config);
    await repository.revoke(session.id);
    const response = liveJson({ ok: true, revoked: true });
    response.cookies.set({
      name: LIVE_SESSION_COOKIE,
      value: "",
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return liveErrorResponse(error, "session-revoke");
  }
}
