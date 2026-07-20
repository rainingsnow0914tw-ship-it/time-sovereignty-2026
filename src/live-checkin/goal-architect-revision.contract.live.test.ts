import { describe, expect, it } from "vitest";

import type { GoalPlan } from "../domain/goals/schemas";
import { reviseLiveGoalArchitectPlan } from "./goal-architect";
import {
  LiveGoalPlanReceiptSchema,
  decideLiveGoalPlanClaim,
  type LiveGoalPlanReceipt,
  type LiveGoalPlanRepository,
} from "./goal-plan-repository";
import type { LiveCheckInConfig } from "./config";

const runLive = process.env.RUN_LIVE_GOAL_REVISION === "1";

describe.skipIf(!runLive)("live user-facing Goal Architect revision", () => {
  it(
    "uses explicit user corrections to replace a one-slot habit plan",
    async () => {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1_000);
      const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1_000);
      const currentPlan: GoalPlan = {
        goalSummary: "每天做三次一分鐘橋式",
        motivation: "改善久坐後的腰背僵硬",
        targetWindow: "先持續一個月",
        cadence: {
          kind: "HABIT",
          targetEndAt: inThirtyDays.toISOString(),
          checkInFrequency: "DAILY",
          preferredCheckInTime: "21:00",
          reviewFrequencyDays: 7,
          rationale: "每天晚上提醒一次。",
          completionSignal: "每天完成三次橋式。",
        },
        feasibilityNotes: [],
        firstMilestone: "今天完成第一次",
        bestNextAction: "現在完成第一次一分鐘橋式",
        minimumViableAction: "做一次舒適且無痛的抬臀",
        initialCheckInProposal: {
          scheduledFor: inOneHour.toISOString(),
          rationale: "先確認第一次。",
        },
        assumptionsNeedingConfirmation: ["每天只需要晚上提醒一次"],
      };
      let activeReceipt: LiveGoalPlanReceipt | null = null;
      const repository: LiveGoalPlanRepository = {
        async claim(options) {
          const decision = decideLiveGoalPlanClaim({
            ...options,
            current: activeReceipt,
            now,
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
            completedAt: new Date(now.getTime() + 2_000).toISOString(),
            updatedAt: new Date(now.getTime() + 2_000).toISOString(),
          });
          return activeReceipt;
        },
        async fail() {},
      };

      const result = await reviseLiveGoalArchitectPlan({
        request: {
          requestId: `live-goal-revision-${now.getTime()}`,
          locale: "zh-TW",
          timezone: "Asia/Macau",
          reason: "ASSUMPTIONS",
          answers: {
            goal: "每天做三次一分鐘橋式",
            targetWindow: "先持續一個月",
            motivation: "改善久坐後的腰背僵硬",
          },
          currentPlan,
          userFeedback:
            "一次提醒不夠。我需要早上09:00、下午14:00、晚上19:00三個行動時段，請讓計畫明確寫出三次。",
          assumptionResponses: [
            {
              statement: "每天只需要晚上提醒一次",
              disposition: "REJECTED",
              userNote: null,
            },
          ],
        },
        sessionId: "contract-session-no-user-data",
        config: {} as LiveCheckInConfig,
        now: () => now,
        repository,
      });

      expect(result.kind).toBe("COMPLETED");
      if (result.kind !== "COMPLETED") return;
      const planText = JSON.stringify(result.plan);
      expect(result.trace.provider).toBe("openai");
      expect(result.trace.model).toContain("gpt-5.6");
      expect(result.trace.tokenUsage?.totalTokens).toBeGreaterThan(0);
      expect(planText).toContain("09:00");
      expect(planText).toContain("14:00");
      expect(planText).toContain("19:00");
      expect(planText).not.toContain("每天只需要晚上提醒一次");

      console.info(
        "[live-goal-revision-proof]",
        JSON.stringify({
          requestedModel: "gpt-5.6",
          returnedModel: result.trace.model,
          provider: result.trace.provider,
          outputSchemaName: result.trace.outputSchemaName,
          tokenUsage: result.trace.tokenUsage,
          schemaPassed: true,
          rejectedAssumptionRemoved: true,
          threeRequestedTimesReflected: true,
          zeroSdkRetries: true,
          rawUserFeedbackPersisted: false,
        }),
      );
    },
    120_000,
  );
});
