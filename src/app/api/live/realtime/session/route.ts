import { NextRequest } from "next/server";

import {
  MAX_REALTIME_SDP_BYTES,
  createRealtimeCall,
  RealtimeLocaleSchema,
  RealtimeUpstreamError,
} from "@/live-checkin/realtime-session";
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

    const contentType = request.headers.get("content-type")?.split(";", 1)[0];
    if (contentType !== "application/sdp") {
      return liveJson(
        { ok: false, error: "invalid_realtime_content_type" },
        { status: 415 },
      );
    }
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_REALTIME_SDP_BYTES) {
      return liveJson(
        { ok: false, error: "realtime_offer_too_large" },
        { status: 413 },
      );
    }

    const locale = RealtimeLocaleSchema.parse(
      request.nextUrl.searchParams.get("locale"),
    );
    const answer = await createRealtimeCall({
      apiKey: process.env.OPENAI_API_KEY,
      locale,
      sessionId: session.id,
      sdp: await request.text(),
    });
    return new Response(answer, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/sdp",
      },
    });
  } catch (error) {
    if (error instanceof RealtimeUpstreamError) {
      console.error("[live-check-in] realtime negotiation failed", {
        name: error.name,
        upstreamStatus: error.status,
      });
      return liveJson(
        { ok: false, error: "realtime_session_unavailable" },
        { status: 502 },
      );
    }
    return liveErrorResponse(error, "realtime-session");
  }
}
