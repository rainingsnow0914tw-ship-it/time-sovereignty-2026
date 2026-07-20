import { describe, expect, it, vi } from "vitest";

import type { AiProvider } from "../providers/ai/types";
import type { StructuredAgentRequest } from "../providers/ai/types";
import {
  LiveGoalPlanReceiptSchema,
  decideLiveGoalPlanClaim,
  type LiveGoalPlanReceipt,
  type LiveGoalPlanRepository,
} from "./goal-plan-repository";
import { createLiveGoalArchitectPlan } from "./goal-architect";
import type { LiveCheckInConfig } from "./config";

const plan = {
  goalSummary: "每天畫一張小插畫",
  motivation: "讓創作回到生活裡",
  targetWindow: "未來三十天",
  cadence: {
    kind: "HABIT",
    targetEndAt: "2026-08-17T23:59:00.000Z",
    checkInFrequency: "DAILY",
    preferredCheckInTime: "19:30",
    reviewFrequencyDays: 7,
    rationale: "保護可持續的每日創作練習。",
    completionSignal: "與使用者一起回顧三十天的練習。",
  },
  feasibilityNotes: ["先守住五分鐘的創作入口"],
  firstMilestone: "完成第一週的七個小畫面",
  bestNextAction: "現在打開畫布，畫下今天最想記住的形狀",
  minimumViableAction: "只畫一條線並替它命名",
  initialCheckInProposal: {
    scheduledFor: "2026-07-19T11:30:00.000Z",
    rationale: "在第一個真實創作時段後確認阻礙",
  },
  assumptionsNeedingConfirmation: ["每天可以保留至少五分鐘"],
};
const trace = {
  runId: "goal-architect-run",
  agent: "GOAL_ARCHITECT" as const,
  provider: "openai" as const,
  model: "gpt-5.6-sol",
  outputSchemaName: "GoalArchitectOutput",
  inputSummary:
    "Validated play-profile onboarding answers; raw answers omitted from safe trace.",
  tokenUsage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
  status: "COMPLETED" as const,
  startedAt: "2026-07-18T01:00:00.000Z",
  completedAt: "2026-07-18T01:00:01.000Z",
};

describe("live Goal Architect orchestration", () => {
  it("uses one real structured call with language, safety, and persistence fences", async () => {
    let activeReceipt: LiveGoalPlanReceipt | null = null;
    const repository: LiveGoalPlanRepository = {
      claim: vi.fn(async (options) => {
        const decision = decideLiveGoalPlanClaim({
          ...options,
          current: activeReceipt,
          now: new Date("2026-07-18T01:00:00.000Z"),
          leaseToken: "11111111-1111-4111-8111-111111111111",
        });
        if (decision.kind === "CLAIMED") activeReceipt = decision.receipt;
        return decision;
      }),
      complete: vi.fn(async (options) => {
        if (!activeReceipt) throw new Error("Missing claim");
        activeReceipt = LiveGoalPlanReceiptSchema.parse({
          ...activeReceipt,
          status: "COMPLETED",
          plan: options.plan,
          trace: options.trace,
          completedAt: "2026-07-18T01:00:02.000Z",
          updatedAt: "2026-07-18T01:00:02.000Z",
        });
        return activeReceipt;
      }),
      fail: vi.fn(async () => undefined),
    };
    let capturedRequest: StructuredAgentRequest<unknown> | null = null;
    let modelCalls = 0;
    const provider: AiProvider = {
      async generateStructured(request, outputSchema) {
        modelCalls += 1;
        capturedRequest = request as StructuredAgentRequest<unknown>;
        return { output: outputSchema.parse(plan), trace };
      },
    };

    const result = await createLiveGoalArchitectPlan({
      request: {
        requestId: "request-1",
        locale: "zh-TW",
        timezone: "Asia/Taipei",
        answers: {
          goal: "每天畫一張小插畫",
          targetWindow: "未來三十天",
          motivation: "我想讓創作回到生活裡",
        },
      },
      sessionId: "paired-session",
      config: {} as LiveCheckInConfig,
      now: () => new Date("2026-07-18T01:00:00.000Z"),
      provider,
      repository,
    });

    expect(result).toMatchObject({
      kind: "COMPLETED",
      duplicate: false,
      plan,
      trace: { provider: "openai", model: "gpt-5.6-sol" },
    });
    expect(modelCalls).toBe(1);
    expect(capturedRequest).toMatchObject({
      agent: "GOAL_ARCHITECT",
      outputSchemaName: "GoalArchitectOutput",
      safetyIdentifier: expect.stringMatching(/^ts_[a-f0-9]{32}$/u),
      additionalInstructions: expect.stringContaining(
        "Traditional Chinese as used in Taiwan",
      ),
    });
    expect(repository.complete).toHaveBeenCalledOnce();
    expect(repository.fail).not.toHaveBeenCalled();
  });

  it("retries once with the violation fed back when the model returns a self-contradictory schedule", async () => {
    // Observed on a real phone 2026-07-20: two consecutive plan requests failed
    // with GoalCadenceTimingError and the user simply pressed the button a
    // third time with no explanation. Note the schema itself already rejects a
    // check-in at or after targetEndAt, so only violations the schema cannot
    // see — a non-future instant, or one beyond the cadence's maximum delay —
    // can reach this fence.
    const contradictoryPlan = {
      ...plan,
      initialCheckInProposal: {
        scheduledFor: "2026-07-18T00:30:00.000Z",
        rationale: "已經過去的時間，schema 看不到，只有時間圍欄能攔",
      },
    };

    let activeReceipt: LiveGoalPlanReceipt | null = null;
    const repository: LiveGoalPlanRepository = {
      claim: vi.fn(async (options) => {
        const decision = decideLiveGoalPlanClaim({
          ...options,
          current: activeReceipt,
          now: new Date("2026-07-18T01:00:00.000Z"),
          leaseToken: "11111111-1111-4111-8111-111111111111",
        });
        if (decision.kind === "CLAIMED") activeReceipt = decision.receipt;
        return decision;
      }),
      complete: vi.fn(async (options) => {
        if (!activeReceipt) throw new Error("Missing claim");
        activeReceipt = LiveGoalPlanReceiptSchema.parse({
          ...activeReceipt,
          status: "COMPLETED",
          plan: options.plan,
          trace: options.trace,
          completedAt: "2026-07-18T01:00:02.000Z",
          updatedAt: "2026-07-18T01:00:02.000Z",
        });
        return activeReceipt;
      }),
      fail: vi.fn(async () => undefined),
    };

    const instructions: string[] = [];
    const runIds: string[] = [];
    const provider: AiProvider = {
      async generateStructured(request, outputSchema) {
        const typed = request as StructuredAgentRequest<unknown>;
        instructions.push(typed.additionalInstructions ?? "");
        runIds.push(typed.runId);
        return {
          output: outputSchema.parse(
            instructions.length === 1 ? contradictoryPlan : plan,
          ),
          trace,
        };
      },
    };

    const result = await createLiveGoalArchitectPlan({
      request: {
        requestId: "request-retry",
        locale: "zh-TW",
        timezone: "Asia/Taipei",
        answers: {
          goal: "每天畫一張小插畫",
          targetWindow: "未來三十天",
          motivation: "我想讓創作回到生活裡",
        },
      },
      sessionId: "paired-session",
      config: {} as LiveCheckInConfig,
      now: () => new Date("2026-07-18T01:00:00.000Z"),
      provider,
      repository,
    });

    expect(result).toMatchObject({ kind: "COMPLETED", plan });
    expect(instructions).toHaveLength(2);
    expect(instructions[0]).not.toContain("previous attempt was rejected");
    expect(instructions[1]).toContain("previous attempt was rejected");
    expect(instructions[1]).toContain("non-future check-in time");
    expect(runIds[0]).not.toBe(runIds[1]);
    expect(repository.complete).toHaveBeenCalledOnce();
    expect(repository.fail).not.toHaveBeenCalled();
  });

  it("does not retry a second time when the model stays contradictory", async () => {
    const contradictoryPlan = {
      ...plan,
      initialCheckInProposal: {
        scheduledFor: "2026-07-18T00:30:00.000Z",
        rationale: "持續回傳過去時間",
      },
    };

    let activeReceipt: LiveGoalPlanReceipt | null = null;
    const repository: LiveGoalPlanRepository = {
      claim: vi.fn(async (options) => {
        const decision = decideLiveGoalPlanClaim({
          ...options,
          current: activeReceipt,
          now: new Date("2026-07-18T01:00:00.000Z"),
          leaseToken: "11111111-1111-4111-8111-111111111111",
        });
        if (decision.kind === "CLAIMED") activeReceipt = decision.receipt;
        return decision;
      }),
      complete: vi.fn(async () => {
        throw new Error("complete must not run for a rejected plan");
      }),
      fail: vi.fn(async () => undefined),
    };

    let modelCalls = 0;
    const provider: AiProvider = {
      async generateStructured(_request, outputSchema) {
        modelCalls += 1;
        return { output: outputSchema.parse(contradictoryPlan), trace };
      },
    };

    await expect(
      createLiveGoalArchitectPlan({
        request: {
          requestId: "request-retry-exhausted",
          locale: "zh-TW",
          timezone: "Asia/Taipei",
          answers: {
            goal: "每天畫一張小插畫",
            targetWindow: "未來三十天",
            motivation: "我想讓創作回到生活裡",
          },
        },
        sessionId: "paired-session",
        config: {} as LiveCheckInConfig,
        now: () => new Date("2026-07-18T01:00:00.000Z"),
        provider,
        repository,
      }),
    ).rejects.toThrow(/non-future check-in time/u);

    expect(modelCalls).toBe(2);
    expect(repository.fail).toHaveBeenCalledOnce();
  });
});
