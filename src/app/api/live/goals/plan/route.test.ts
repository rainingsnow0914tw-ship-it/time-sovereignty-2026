import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLiveGoalArchitectPlan } from "@/live-checkin/goal-architect";
import { authenticateLiveRequest } from "@/live-checkin/route-helpers";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";

vi.mock("@/live-checkin/goal-architect", () => ({
  createLiveGoalArchitectPlan: vi.fn(),
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
  goalSummary: "每天畫一張小插畫",
  motivation: "讓創作回到生活裡",
  targetWindow: "未來三十天",
  feasibilityNotes: ["先保護連續性，不要求每天完成作品"],
  firstMilestone: "完成第一週的七個小畫面",
  bestNextAction: "現在打開畫布，畫一個最想記住的形狀",
  minimumViableAction: "只畫一條線並替它命名",
  initialCheckInProposal: {
    scheduledFor: "2026-07-19T11:30:00.000Z",
    rationale: "在第一個真實創作時段後確認阻礙",
  },
  assumptionsNeedingConfirmation: ["每天可留出至少五分鐘"],
};
const trace = {
  runId: "goal-architect-run",
  agent: "GOAL_ARCHITECT" as const,
  provider: "openai" as const,
  model: "gpt-5.6-sol",
  outputSchemaName: "GoalArchitectOutput",
  inputSummary: "Validated play-profile onboarding answers",
  tokenUsage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
  status: "COMPLETED" as const,
  startedAt: "2026-07-18T01:00:00.000Z",
  completedAt: "2026-07-18T01:00:01.000Z",
};

function request() {
  return new NextRequest("https://preview.example/api/live/goals/plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://preview.example",
    },
    body: JSON.stringify({
      requestId: "request-1",
      locale: "zh-TW",
      timezone: "Asia/Taipei",
      answers: {
        goal: "每天畫一張小插畫",
        targetWindow: "未來三十天",
        motivation: "我想讓創作回到生活裡",
      },
    }),
  });
}

describe("POST /api/live/goals/plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateLiveRequest).mockResolvedValue({
      config: { allowedOrigins: ["https://preview.example"] },
      session: { id: "paired-session" },
    } as Awaited<ReturnType<typeof authenticateLiveRequest>>);
  });

  it("returns one real structured plan to the paired play profile", async () => {
    vi.mocked(createLiveGoalArchitectPlan).mockResolvedValue({
      kind: "COMPLETED",
      duplicate: false,
      plan,
      trace,
    });
    const response = await POST(request());
    expect(authenticateLiveRequest).toHaveBeenCalledOnce();
    expect(assertAllowedOrigin).toHaveBeenCalledOnce();
    expect(createLiveGoalArchitectPlan).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "paired-session" }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      duplicate: false,
      plan,
      trace: { provider: "openai", model: "gpt-5.6-sol" },
    });
  });

  it("does not start a second call while the idempotency lease is active", async () => {
    vi.mocked(createLiveGoalArchitectPlan).mockResolvedValue({
      kind: "BUSY",
      retryAfterSeconds: 42,
    });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(response.headers.get("retry-after")).toBe("42");
  });
});
