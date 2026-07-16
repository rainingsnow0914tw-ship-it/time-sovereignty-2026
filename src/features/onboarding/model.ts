import { z } from "zod";

import {
  GoalArchitectOutputSchema,
  type AgentRunTrace,
} from "../../domain/agents/schemas";
import {
  ProgressFormatSchema,
  SupportChannelSchema,
  type GoalPlan,
} from "../../domain/goals/schemas";
import { MockAiProvider } from "../../providers/ai/mock-provider";

export const OnboardingAnswersSchema = z
  .object({
    goal: z.string().trim().min(2).max(240),
    targetWindow: z.string().trim().min(2).max(240),
    motivation: z.string().trim().min(2).max(2_000),
  })
  .strict();

export const SupportAgreementDraftSchema = z
  .object({
    checkInFrequency: z.enum(["DAILY", "WEEKDAYS", "WEEKLY", "CUSTOM"]),
    preferredCheckInTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/u),
    quietStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u),
    quietEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u),
    timezone: z.string().trim().min(1),
    interventionIntensity: z.enum(["GENTLE", "BALANCED", "FIRM"]),
    preferredTone: z.string().trim().min(1).max(240),
    allowedChannels: z.array(SupportChannelSchema).min(1),
    progressSharingFormats: z.array(ProgressFormatSchema).min(1),
    desiredFeedbackStyle: z.string().trim().min(1).max(500),
    pauseConditions: z.string().trim().min(1).max(500),
    strongerFollowUpConditions: z.string().trim().min(1).max(500),
    reviewFrequencyDays: z.number().int().min(1).max(90),
  })
  .strict();

export type OnboardingAnswers = z.infer<typeof OnboardingAnswersSchema>;
export type SupportAgreementDraft = z.infer<
  typeof SupportAgreementDraftSchema
>;
export type SupportChannel = z.infer<typeof SupportChannelSchema>;
export type ProgressFormat = z.infer<typeof ProgressFormatSchema>;

export interface MockGoalArchitectResult {
  output: GoalPlan;
  trace: AgentRunTrace;
}

export const defaultSupportAgreementDraft: SupportAgreementDraft = {
  checkInFrequency: "DAILY",
  preferredCheckInTime: "19:30",
  quietStart: "22:30",
  quietEnd: "08:00",
  timezone: "Asia/Shanghai",
  interventionIntensity: "BALANCED",
  preferredTone: "Warm, direct, and practical",
  allowedChannels: ["TEXT", "TTS", "VOICE"],
  progressSharingFormats: ["TEXT", "PHOTO", "VOICE"],
  desiredFeedbackStyle:
    "Be specific about what worked, then give me one clear next move.",
  pauseConditions:
    "Pause when I am ill, handling an emergency, or explicitly ask for space.",
  strongerFollowUpConditions:
    "Follow up more firmly after the same action is delayed twice without a replacement commitment.",
  reviewFrequencyDays: 7,
};

function nextDayAtNineteenThirty(now: Date): string {
  const proposed = new Date(now);
  proposed.setDate(proposed.getDate() + 1);
  proposed.setHours(19, 30, 0, 0);
  return proposed.toISOString();
}

export async function createMockGoalArchitectResult(
  rawAnswers: OnboardingAnswers,
  now: () => Date = () => new Date(),
): Promise<MockGoalArchitectResult> {
  const answers = OnboardingAnswersSchema.parse(rawAnswers);
  const generatedAt = now();
  const plan: GoalPlan = {
    goalSummary: answers.goal,
    motivation: answers.motivation,
    targetWindow: answers.targetWindow,
    feasibilityNotes: [
      "Start with one visible milestone instead of a long task inventory.",
      "Protect energy and quiet hours while keeping the goal moving.",
    ],
    firstMilestone: `Create the first visible proof of progress for: ${answers.goal}`,
    bestNextAction:
      "Spend one focused 25-minute block creating the first visible result.",
    minimumViableAction:
      "Open the work and write the smallest useful next step in one sentence.",
    initialCheckInProposal: {
      scheduledFor: nextDayAtNineteenThirty(generatedAt),
      rationale:
        "Check in after one protected work window, while the first decision is still fresh.",
    },
    assumptionsNeedingConfirmation: [
      "The target window can be adjusted if real-life constraints change.",
      "A brief daily check-in is useful during the first week.",
    ],
  };

  const provider = new MockAiProvider(
    { "goal-onboarding": plan },
    () => generatedAt,
  );

  return provider.generateStructured(
    {
      runId: `run-${generatedAt.getTime()}`,
      agent: "GOAL_ARCHITECT",
      scenario: "goal-onboarding",
      outputSchemaName: "GoalArchitectOutput",
      inputSummary:
        "Three onboarding answers validated; raw answers omitted from trace.",
      input: answers,
    },
    GoalArchitectOutputSchema,
  );
}

export function applyPlanFeedback(
  currentPlan: GoalPlan,
  rawFeedback: string,
): GoalPlan {
  const feedback = z.string().trim().min(2).max(500).parse(rawFeedback);

  return GoalArchitectOutputSchema.parse({
    ...currentPlan,
    feasibilityNotes: [
      ...currentPlan.feasibilityNotes.slice(0, 10),
      `User feedback to resolve: ${feedback}`,
    ],
  });
}
