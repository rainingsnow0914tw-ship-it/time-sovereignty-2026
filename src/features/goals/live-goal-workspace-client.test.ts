import { describe, expect, it, vi } from "vitest";

import type { LocalOnboardingRecord } from "../../repositories/local-onboarding-repository";
import {
  LiveGoalWorkspaceClientError,
  saveLiveGoal,
} from "./live-goal-workspace-client";

describe("live goal workspace client", () => {
  it("sends one stable save identity and every selected schedule time", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "pairing_required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const record = {
      version: 1,
      goal: { id: "goal-english" },
    } as unknown as LocalOnboardingRecord;

    await expect(
      saveLiveGoal(
        {
          requestId: "save-english-once",
          record,
          scheduleTimes: ["09:00", "14:00", "19:00"],
        },
        fetcher,
      ),
    ).rejects.toMatchObject({
      status: 401,
      code: "pairing_required",
    } satisfies Partial<LiveGoalWorkspaceClientError>);

    expect(fetcher).toHaveBeenCalledWith(
      "/api/live/goals",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }),
    );
    const request = vi.mocked(fetcher).mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toMatchObject({
      requestId: "save-english-once",
      scheduleTimes: ["09:00", "14:00", "19:00"],
      record: { goal: { id: "goal-english" } },
    });
  });
});
