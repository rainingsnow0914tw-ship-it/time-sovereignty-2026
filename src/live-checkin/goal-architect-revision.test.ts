import { describe, expect, it, vi } from "vitest";

import type { GoalPlan } from "../domain/goals/schemas";
import type {
  AiProvider,
  StructuredAgentRequest,
} from "../providers/ai/types";
import { reviseLiveGoalArchitectPlan } from "./goal-architect";
import { LiveGoalArchitectRevisionRequestSchema } from "./goal-architect-schemas";
import {
  LiveGoalPlanReceiptSchema,
  decideLiveGoalPlanClaim,
  type LiveGoalPlanReceipt,
  type LiveGoalPlanRepository,
} from "./goal-plan-repository";
import type { LiveCheckInConfig } from "./config";

const currentPlan: GoalPlan = {
  goalSummary: "每天做三次橋式",
  motivation: "改善久坐後的僵硬",
  targetWindow: "先持續一個月",
  cadence: {
    kind: "HABIT",
    targetEndAt: "2026-08-20T15:59:00.000Z",
    checkInFrequency: "DAILY",
    preferredCheckInTime: "21:00",
    reviewFrequencyDays: 7,
    rationale: "每日練習需要固定提醒。",
    completionSignal: "每天完成三次。",
  },
  feasibilityNotes: [],
  firstMilestone: "今天完成第一次",
  bestNextAction: "現在做一分鐘橋式",
  minimumViableAction: "做一次舒適抬臀",
  initialCheckInProposal: {
    scheduledFor: "2026-07-20T13:00:00.000Z",
    rationale: "今晚確認第一次。",
  },
  assumptionsNeedingConfirmation: ["每天只需要一次提醒"],
};

const revisedPlan: GoalPlan = {
  ...currentPlan,
  cadence: {
    ...currentPlan.cadence,
    preferredCheckInTime: "09:00",
    rationale: "三次練習需要早、中、晚三個可調整時段。",
  },
  feasibilityNotes: ["使用者確認需要三次提醒，不是一次。"],
  assumptionsNeedingConfirmation: [],
};

const trace = {
  runId: "goal-revision-run",
  agent: "GOAL_ARCHITECT" as const,
  provider: "openai" as const,
  model: "gpt-5.6-sol",
  outputSchemaName: "GoalArchitectRevisionOutput",
  inputSummary: "Validated current plan and explicit user corrections",
  tokenUsage: { inputTokens: 120, outputTokens: 180, totalTokens: 300 },
  status: "COMPLETED" as const,
  startedAt: "2026-07-20T12:00:00.000Z",
  completedAt: "2026-07-20T12:00:01.000Z",
};

function repository() {
  let active: LiveGoalPlanReceipt | null = null;
  const value: LiveGoalPlanRepository = {
    claim: vi.fn(async (options) => {
      const decision = decideLiveGoalPlanClaim({
        ...options,
        current: active,
        now: new Date("2026-07-20T12:00:00.000Z"),
        leaseToken: "11111111-1111-4111-8111-111111111111",
      });
      if (decision.kind === "CLAIMED") active = decision.receipt;
      return decision;
    }),
    complete: vi.fn(async (options) => {
      if (!active) throw new Error("Missing claim");
      active = LiveGoalPlanReceiptSchema.parse({
        ...active,
        status: "COMPLETED",
        plan: options.plan,
        trace: options.trace,
        completedAt: "2026-07-20T12:00:02.000Z",
        updatedAt: "2026-07-20T12:00:02.000Z",
      });
      return active;
    }),
    fail: vi.fn(async () => undefined),
  };
  return value;
}

describe("live Goal Architect revision", () => {
  it("rejects an edited assumption without the user's replacement", () => {
    expect(() =>
      LiveGoalArchitectRevisionRequestSchema.parse({
        requestId: "revision-1",
        locale: "zh-TW",
        timezone: "Asia/Macau",
        reason: "ASSUMPTIONS",
        answers: {
          goal: "每天做三次橋式",
          targetWindow: "一個月",
          motivation: "改善僵硬",
        },
        currentPlan,
        userFeedback: null,
        assumptionResponses: [
          {
            statement: "每天只需要一次提醒",
            disposition: "EDITED",
            userNote: null,
          },
        ],
      }),
    ).toThrow();
  });

  it("makes one structured GPT call and returns a genuinely revised plan", async () => {
    let captured: StructuredAgentRequest<unknown> | null = null;
    const provider: AiProvider = {
      async generateStructured(request, outputSchema) {
        captured = request as StructuredAgentRequest<unknown>;
        return { output: outputSchema.parse(revisedPlan), trace };
      },
    };
    const result = await reviseLiveGoalArchitectPlan({
      request: {
        requestId: "revision-1",
        locale: "zh-TW",
        timezone: "Asia/Macau",
        reason: "ASSUMPTIONS",
        answers: {
          goal: "每天做三次橋式",
          targetWindow: "一個月",
          motivation: "改善僵硬",
        },
        currentPlan,
        userFeedback: null,
        assumptionResponses: [
          {
            statement: "每天只需要一次提醒",
            disposition: "REJECTED",
            userNote: null,
          },
        ],
      },
      sessionId: "paired-session",
      config: {} as LiveCheckInConfig,
      now: () => new Date("2026-07-20T12:00:00.000Z"),
      provider,
      repository: repository(),
    });

    expect(result).toMatchObject({
      kind: "COMPLETED",
      duplicate: false,
      plan: revisedPlan,
      trace: { provider: "openai", model: "gpt-5.6-sol" },
    });
    expect(captured).toMatchObject({
      agent: "GOAL_ARCHITECT",
      outputSchemaName: "GoalArchitectRevisionOutput",
      input: {
        revisionReason: "ASSUMPTIONS",
        assumptionResponses: [
          expect.objectContaining({ disposition: "REJECTED" }),
        ],
      },
      additionalInstructions: expect.stringContaining(
        "This is a real plan revision",
      ),
    });
  });
});
