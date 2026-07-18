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

export type LiveGoalArchitectRequest = z.infer<
  typeof LiveGoalArchitectRequestSchema
>;
export type LiveGoalArchitectResponse = z.infer<
  typeof LiveGoalArchitectResponseSchema
>;
