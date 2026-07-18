import { z } from "zod";

export const OnboardingAnswersSchema = z
  .object({
    goal: z.string().trim().min(2).max(240),
    targetWindow: z.string().trim().min(2).max(240),
    motivation: z.string().trim().min(2).max(2_000),
  })
  .strict();

export type OnboardingAnswers = z.infer<typeof OnboardingAnswersSchema>;
