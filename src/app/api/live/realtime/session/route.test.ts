import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRealtimeCall } from "@/live-checkin/realtime-session";
import { authenticateLiveRequest } from "@/live-checkin/route-helpers";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";

vi.mock("@/live-checkin/realtime-session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/live-checkin/realtime-session")>()),
  createRealtimeCall: vi.fn(),
}));
vi.mock("@/live-checkin/route-helpers", () => ({
  authenticateLiveRequest: vi.fn(),
  liveJson: (body: unknown, init: ResponseInit = {}) =>
    Response.json(body, {
      ...init,
      headers: { "Cache-Control": "no-store", ...init.headers },
    }),
  liveErrorResponse: () =>
    Response.json({ ok: false, error: "test_failure" }, { status: 500 }),
}));
vi.mock("@/live-checkin/session-auth", () => ({
  assertAllowedOrigin: vi.fn(),
}));

import { POST } from "./route";

const offer = "v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\n";
const answer = "v=0\r\no=- 2 3 IN IP4 127.0.0.1\r\n";

describe("POST /api/live/realtime/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateLiveRequest).mockResolvedValue({
      config: { allowedOrigins: ["https://preview.example"] },
      session: { id: "paired-session" },
    } as Awaited<ReturnType<typeof authenticateLiveRequest>>);
  });

  it("requires SDP content before contacting OpenAI", async () => {
    const request = new NextRequest(
      "https://preview.example/api/live/realtime/session?locale=zh-TW",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://preview.example",
        },
        body: "{}",
      },
    );

    const response = await POST(request);
    expect(response.status).toBe(415);
    expect(createRealtimeCall).not.toHaveBeenCalled();
  });

  it("authenticates the paired device and returns only the SDP answer", async () => {
    vi.mocked(createRealtimeCall).mockResolvedValue(answer);
    const request = new NextRequest(
      "https://preview.example/api/live/realtime/session?locale=en",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
          Origin: "https://preview.example",
        },
        body: offer,
      },
    );

    const response = await POST(request);
    expect(authenticateLiveRequest).toHaveBeenCalledWith(request);
    expect(assertAllowedOrigin).toHaveBeenCalledOnce();
    expect(createRealtimeCall).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "en",
        sessionId: "paired-session",
        sdp: offer,
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/sdp");
    await expect(response.text()).resolves.toBe(answer);
  });
});
