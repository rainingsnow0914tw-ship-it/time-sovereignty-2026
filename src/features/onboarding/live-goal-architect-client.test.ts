import { describe, expect, it, vi } from "vitest";

import {
  LivePairingClientError,
  pairLiveGoalArchitectDevice,
} from "./live-goal-architect-client";

describe("live onboarding pairing recovery", () => {
  it("pairs the browser without exposing the credential in the response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          paired: true,
          expiresAt: "2026-07-19T05:00:00.000Z",
          deviceLabel: "Android PWA",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await pairLiveGoalArchitectDevice(
      { pairingCode: "fresh-one-time-code", deviceLabel: "Android PWA" },
      fetcher,
    );

    expect(result).toMatchObject({ paired: true, deviceLabel: "Android PWA" });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/live/pair",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("preserves the status and safe error code when pairing is denied", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "pairing_denied" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      pairLiveGoalArchitectDevice(
        { pairingCode: "expired-code", deviceLabel: "Android PWA" },
        fetcher,
      ),
    ).rejects.toMatchObject({
      status: 401,
      code: "pairing_denied",
    } satisfies Partial<LivePairingClientError>);
  });
});
