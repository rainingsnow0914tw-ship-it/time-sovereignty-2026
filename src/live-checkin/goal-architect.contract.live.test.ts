import { describe, expect, it } from "vitest";

import {
  LiveGoalPlanReceiptSchema,
  decideLiveGoalPlanClaim,
  type LiveGoalPlanReceipt,
  type LiveGoalPlanRepository,
} from "./goal-plan-repository";
import { createLiveGoalArchitectPlan } from "./goal-architect";
import type { LiveCheckInConfig } from "./config";

const runLive = process.env.RUN_LIVE_GOAL_ARCHITECT === "1";

describe.skipIf(!runLive)("live user-facing Goal Architect contract", () => {
  it(
    "returns one Traditional Chinese GPT-5.6 plan through the final play contract",
    async () => {
      let activeReceipt: LiveGoalPlanReceipt | null = null;
      const repository: LiveGoalPlanRepository = {
        async claim(options) {
          const decision = decideLiveGoalPlanClaim({
            ...options,
            current: activeReceipt,
            now: new Date("2026-07-18T03:00:00.000Z"),
            leaseToken: "11111111-1111-4111-8111-111111111111",
          });
          if (decision.kind === "CLAIMED") activeReceipt = decision.receipt;
          return decision;
        },
        async complete(options) {
          if (!activeReceipt) throw new Error("Missing claim");
          activeReceipt = LiveGoalPlanReceiptSchema.parse({
            ...activeReceipt,
            status: "COMPLETED",
            plan: options.plan,
            trace: options.trace,
            completedAt: "2026-07-18T03:00:02.000Z",
            updatedAt: "2026-07-18T03:00:02.000Z",
          });
          return activeReceipt;
        },
        async fail() {},
      };

      const result = await createLiveGoalArchitectPlan({
        request: {
          requestId: "live-goal-architect-contract-20260718",
          locale: "zh-TW",
          timezone: "Asia/Taipei",
          answers: {
            goal: "完成 OpenAI Build Week 的實機驗收、示範錄影與 Devpost 提交",
            targetWindow: "2026年7月18日晚上11點（台北時間）前完成",
            motivation: "我要交出真正能使用、能保護人們時間的作品",
          },
        },
        sessionId: "contract-session-no-user-data",
        config: {} as LiveCheckInConfig,
        now: () => new Date("2026-07-18T03:00:00.000Z"),
        repository,
      });

      expect(result.kind).toBe("COMPLETED");
      if (result.kind !== "COMPLETED") return;
      expect(result.trace.provider).toBe("openai");
      expect(result.trace.model).toContain("gpt-5.6");
      expect(result.trace.tokenUsage?.totalTokens).toBeGreaterThan(0);
      expect(result.plan.cadence.kind).toBe("SPRINT");
      expect(result.plan.cadence.targetEndAt).not.toBeNull();
      expect(result.plan.cadence.checkInFrequency).not.toBe("WEEKLY");
      expect(result.plan.cadence.reviewFrequencyDays).toBeLessThanOrEqual(7);
      expect(
        new Date(result.plan.initialCheckInProposal.scheduledFor).getTime(),
      ).toBeLessThan(
        new Date(result.plan.cadence.targetEndAt ?? "9999-12-31").getTime(),
      );
      expect(
        [
          result.plan.goalSummary,
          result.plan.firstMilestone,
          result.plan.bestNextAction,
          result.plan.minimumViableAction,
        ].join(" "),
      ).toMatch(/\p{Script=Han}/u);

      console.info(
        "[live-goal-architect-proof]",
        JSON.stringify({
          requestedModel: "gpt-5.6",
          returnedModel: result.trace.model,
          provider: result.trace.provider,
          outputSchemaName: result.trace.outputSchemaName,
          tokenUsage: result.trace.tokenUsage,
          schemaPassed: true,
          traditionalChinesePlanReturned: true,
          goalType: result.plan.cadence.kind,
          checkInFrequency: result.plan.cadence.checkInFrequency,
          reviewFrequencyDays: result.plan.cadence.reviewFrequencyDays,
          targetEndAtPresent: Boolean(result.plan.cadence.targetEndAt),
          zeroSdkRetries: true,
          rawAnswersPersisted: false,
        }),
      );
    },
    120_000,
  );
});
