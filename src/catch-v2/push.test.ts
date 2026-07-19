import { describe, expect, it, vi } from "vitest";

import {
  FcmDeliveryError,
  sendFcmDataMessage,
  type FcmAccessTokenProvider,
} from "./fcm-v1";
import { buildCatchPushData } from "./push";

const DATA = buildCatchPushData({
  eventId: "event-one",
  level: 4,
  title: "Incoming check-in",
  message: "What is true right now?",
  responseUrl: "https://private.example/api/catch/events/event-one/respond",
  expiresAt: "2026-07-19T12:30:00.000Z",
});

const TOKEN_PROVIDER: FcmAccessTokenProvider = {
  getAccessToken: vi.fn(async () => "adc-token"),
};

describe("V2 FCM data-only delivery", () => {
  it("maps level 4 to one flat fake-call payload with stable idempotency", () => {
    expect(DATA).toEqual({
      kind: "fake_call",
      event_id: "event-one",
      level: "4",
      title: "Incoming check-in",
      message: "What is true right now?",
      response_url:
        "https://private.example/api/catch/events/event-one/respond",
      expires_at: "2026-07-19T12:30:00.000Z",
      idempotency_key: "event-one:level:4",
    });
    expect(Object.values(DATA).every((value) => typeof value === "string")).toBe(
      true,
    );
  });

  it("sends exactly one high-priority HTTP v1 request without SDK retries", async () => {
    let capturedRequest: RequestInit | undefined;
    const fetcher = vi.fn(
      async (
        input: Parameters<typeof fetch>[0],
        request?: Parameters<typeof fetch>[1],
      ) => {
        void input;
        capturedRequest = request;
        return new Response(JSON.stringify({ name: "projects/p/messages/m" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    );

    await expect(
      sendFcmDataMessage(
        { projectId: "private-project", deviceToken: "private-token", data: DATA },
        { tokenProvider: TOKEN_PROVIDER, fetcher },
      ),
    ).resolves.toEqual({
      kind: "DELIVERED",
      providerMessageName: "projects/p/messages/m",
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(capturedRequest?.body));
    expect(body.message).toEqual({
      token: "private-token",
      data: DATA,
      android: { priority: "high" },
    });
  });

  it("marks a 404 token invalid without exposing it in an error", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 404 }));
    await expect(
      sendFcmDataMessage(
        { projectId: "private-project", deviceToken: "private-token", data: DATA },
        { tokenProvider: TOKEN_PROVIDER, fetcher },
      ),
    ).resolves.toEqual({ kind: "INVALID_TOKEN" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("surfaces retryability but never performs an internal retry", async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 503 }));
    const error = await sendFcmDataMessage(
      { projectId: "private-project", deviceToken: "private-token", data: DATA },
      { tokenProvider: TOKEN_PROVIDER, fetcher },
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(FcmDeliveryError);
    expect(error).toMatchObject({ status: 503, retryable: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(error)).not.toContain("private-token");
  });
});
