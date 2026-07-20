import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { reviseLiveGoalArchitectPlan } from "@/live-checkin/goal-architect";
import { authenticateLiveRequest } from "@/live-checkin/route-helpers";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";

vi.mock("@/live-checkin/goal-architect", () => ({
  reviseLiveGoalArchitectPlan: vi.fn(),
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

const plan = {
  goalSummary: "每天做三次橋式",
  motivation: "改善久坐後的僵硬",
  targetWindow: "一個月",
  cadence: {
    kind: "HABIT" as const,
    targetEndAt: "2026-08-20T15:59:00.000Z",
    checkInFrequency: "DAILY" as const,
    preferredCheckInTime: "09:00",
    reviewFrequencyDays: 7,
    rationale: "三次練習需要多個可調整時段。",
    completionSignal: "每天完成三次並留下紀錄。",
  },
  feasibilityNotes: [],
  firstMilestone: "今天完成第一次",
  bestNextAction: "現在做一分鐘橋式",
  minimumViableAction: "做一次舒適抬臀",
  initialCheckInProposal: {
    scheduledFor: "2026-07-20T13:00:00.000Z",
    rationale: "確認第一次。",
  },
  assumptionsNeedingConfirmation: [],
};

function request() {
  return new NextRequest(
    "https://preview.example/api/live/goals/plan/revise",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://preview.example",
      },
      body: JSON.stringify({
        requestId: "revision-1",
        locale: "zh-TW",
        timezone: "Asia/Macau",
        reason: "FEEDBACK",
        answers: {
          goal: "每天做三次橋式",
          targetWindow: "一個月",
          motivation: "改善久坐後的僵硬",
        },
        currentPlan: plan,
        userFeedback: "每天三次不能只安排一個報到時段。",
        assumptionResponses: [],
      }),
    },
  );
}

describe("POST /api/live/goals/plan/revise", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateLiveRequest).mockResolvedValue({
      config: { allowedOrigins: ["https://preview.example"] },
      session: { id: "paired-session" },
    } as Awaited<ReturnType<typeof authenticateLiveRequest>>);
  });

  it("authenticates and returns the structured revision", async () => {
    vi.mocked(reviseLiveGoalArchitectPlan).mockResolvedValue({
      kind: "COMPLETED",
      duplicate: false,
      plan,
      trace: {
        runId: "revision-run",
        agent: "GOAL_ARCHITECT",
        provider: "openai",
        model: "gpt-5.6-sol",
        outputSchemaName: "GoalArchitectRevisionOutput",
        inputSummary: "Validated explicit correction",
        tokenUsage: { inputTokens: 100, outputTokens: 100, totalTokens: 200 },
        status: "COMPLETED",
        startedAt: "2026-07-20T12:00:00.000Z",
        completedAt: "2026-07-20T12:00:01.000Z",
      },
    });

    const response = await POST(request());

    expect(authenticateLiveRequest).toHaveBeenCalledOnce();
    expect(assertAllowedOrigin).toHaveBeenCalledOnce();
    expect(reviseLiveGoalArchitectPlan).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "paired-session" }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      plan: { cadence: { preferredCheckInTime: "09:00" } },
    });
  });

  it("keeps an in-flight revision single-call", async () => {
    vi.mocked(reviseLiveGoalArchitectPlan).mockResolvedValue({
      kind: "BUSY",
      retryAfterSeconds: 18,
    });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(response.headers.get("retry-after")).toBe("18");
  });
});
