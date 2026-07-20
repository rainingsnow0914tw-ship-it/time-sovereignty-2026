import { z } from "zod";

import { AgentRunTraceSchema } from "../domain/agents/schemas";
import { GoalPlanSchema } from "../domain/goals/schemas";
import { EntityIdSchema } from "../domain/shared";
import { OnboardingAnswersSchema } from "../features/onboarding/schemas";

export const LiveGoalArchitectRequestSchema = z
  .object({
    requestId: EntityIdSchema,
    locale: z.enum(["zh-TW", "en"]),
    timezone: z.string().trim().min(1).max(128),
    answers: OnboardingAnswersSchema,
  })
  .strict();

export const LiveGoalArchitectResponseSchema = z
  .object({
    ok: z.literal(true),
    duplicate: z.boolean(),
    plan: GoalPlanSchema,
    trace: AgentRunTraceSchema,
  })
  .strict();

export const LiveGoalPlanAssumptionResponseSchema = z
  .object({
    statement: z.string().trim().min(1).max(700),
    disposition: z.enum(["CONFIRMED", "REJECTED", "EDITED"]),
    userNote: z.string().trim().min(1).max(1_000).nullable(),
  })
  .strict()
  .superRefine((response, context) => {
    if (response.disposition === "EDITED" && !response.userNote) {
      context.addIssue({
        code: "custom",
        path: ["userNote"],
        message: "An edited assumption requires the user's correction.",
      });
    }
  });

export const LiveGoalArchitectRevisionRequestSchema = z
  .object({
    requestId: EntityIdSchema,
    locale: z.enum(["zh-TW", "en"]),
    timezone: z.string().trim().min(1).max(128),
    reason: z.enum(["FEEDBACK", "ASSUMPTIONS", "MANUAL_EDIT"]),
    answers: OnboardingAnswersSchema,
    currentPlan: GoalPlanSchema,
    userFeedback: z.string().trim().min(2).max(2_000).nullable(),
    assumptionResponses: z
      .array(LiveGoalPlanAssumptionResponseSchema)
      .max(12),
  })
  .strict()
  .superRefine((request, context) => {
    if (request.reason === "FEEDBACK" && !request.userFeedback) {
      context.addIssue({
        code: "custom",
        path: ["userFeedback"],
        message: "A feedback revision requires the user's feedback.",
      });
    }
    if (
      request.reason === "ASSUMPTIONS" &&
      request.assumptionResponses.length === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["assumptionResponses"],
        message: "An assumption revision requires at least one response.",
      });
    }
  });

export const LiveGoalArchitectRevisionResponseSchema =
  LiveGoalArchitectResponseSchema;

export type LiveGoalArchitectRequest = z.infer<
  typeof LiveGoalArchitectRequestSchema
>;
export type LiveGoalArchitectResponse = z.infer<
  typeof LiveGoalArchitectResponseSchema
>;
export type LiveGoalPlanAssumptionResponse = z.infer<
  typeof LiveGoalPlanAssumptionResponseSchema
>;
export type LiveGoalArchitectRevisionRequest = z.infer<
  typeof LiveGoalArchitectRevisionRequestSchema
>;
export type LiveGoalArchitectRevisionResponse = z.infer<
  typeof LiveGoalArchitectRevisionResponseSchema
>;
