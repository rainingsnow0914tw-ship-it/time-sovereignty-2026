import { z } from "zod";

import {
  GoalArchitectOutputSchema,
  type AgentRunTrace,
} from "../../domain/agents/schemas";
import {
  ProgressFormatSchema,
  SupportChannelSchema,
  type GoalCadence,
  type GoalPlan,
} from "../../domain/goals/schemas";
import { MockAiProvider } from "../../providers/ai/mock-provider";
import {
  OnboardingAnswersSchema,
  type OnboardingAnswers,
} from "./schemas";

export { OnboardingAnswersSchema, type OnboardingAnswers } from "./schemas";

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

const DAY_MS = 24 * 60 * 60 * 1_000;

function nextDayAtNineteenThirty(now: Date): Date {
  const proposed = new Date(now);
  proposed.setDate(proposed.getDate() + 1);
  proposed.setHours(19, 30, 0, 0);
  return proposed;
}

function endOfLocalDay(now: Date, dayOffset = 0): Date {
  const end = new Date(now);
  end.setDate(end.getDate() + dayOffset);
  end.setHours(23, 30, 0, 0);
  return end;
}

function parseTargetEndAt(targetWindow: string, now: Date): Date | null {
  const normalized = targetWindow.toLowerCase();
  if (
    /(?:沒有硬性期限|無硬性期限|沒有期限|no hard deadline|open[- ]ended)/u.test(
      normalized,
    )
  ) {
    return null;
  }
  if (/(?:今天|今晚|today|tonight)/u.test(normalized)) {
    return endOfLocalDay(now);
  }
  if (/(?:明天|tomorrow)/u.test(normalized)) {
    return endOfLocalDay(now, 1);
  }

  const isoDate = normalized.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/u);
  if (isoDate) {
    const end = new Date(
      Number(isoDate[1]),
      Number(isoDate[2]) - 1,
      Number(isoDate[3]),
      23,
      30,
      0,
      0,
    );
    return end.getTime() > now.getTime() ? end : null;
  }

  const duration = normalized.match(
    /(\d+)\s*(天|日|週|周|個月|个月|年|days?|weeks?|months?|years?)/u,
  );
  if (duration) {
    const count = Number(duration[1]);
    const unit = duration[2];
    const days = /(?:週|周|weeks?)/u.test(unit)
      ? count * 7
      : /(?:個月|个月|months?)/u.test(unit)
        ? count * 30
        : /(?:年|years?)/u.test(unit)
          ? count * 365
          : count;
    return new Date(now.getTime() + days * DAY_MS);
  }
  if (/(?:一個月|一个月|one month)/u.test(normalized)) {
    return new Date(now.getTime() + 30 * DAY_MS);
  }
  if (/(?:一週|一周|one week|this week|本週|這週)/u.test(normalized)) {
    return new Date(now.getTime() + 7 * DAY_MS);
  }
  return null;
}

function createMockCadence(
  answers: OnboardingAnswers,
  now: Date,
): GoalCadence {
  const combined = `${answers.goal} ${answers.targetWindow}`.toLowerCase();
  const habit =
    /(?:每天|每日|持續|習慣|規律|日課|練習|daily|every day|habit|routine|consisten|practice)/u.test(
      combined,
    );
  const targetEnd = parseTargetEndAt(answers.targetWindow, now);
  const targetDays = targetEnd
    ? (targetEnd.getTime() - now.getTime()) / DAY_MS
    : null;
  const kind: GoalCadence["kind"] = habit
    ? "HABIT"
    : targetDays !== null && targetDays <= 14
      ? "SPRINT"
      : "PROJECT";

  return {
    kind,
    targetEndAt: targetEnd?.toISOString() ?? null,
    checkInFrequency:
      kind === "SPRINT" ? "CUSTOM" : kind === "HABIT" ? "DAILY" : "WEEKDAYS",
    preferredCheckInTime: kind === "SPRINT" ? "20:30" : "19:30",
    reviewFrequencyDays: kind === "SPRINT" ? 1 : 7,
    rationale:
      kind === "SPRINT"
        ? "Use milestone-led check-ins inside the short deadline instead of inventing a long journey."
        : kind === "HABIT"
          ? "Use light recurring support and review whether the practice remains sustainable."
          : "Use regular progress checkpoints across the finite deliverable without checking in every hour.",
    completionSignal:
      kind === "HABIT"
        ? "The agreed practice period is completed and the user chooses the next rhythm."
        : `The user confirms the first visible outcome for “${answers.goal}” is complete.`,
  };
}

function initialMockCheckIn(cadence: GoalCadence, now: Date): string {
  let proposed =
    cadence.kind === "SPRINT"
      ? new Date(now.getTime() + 60 * 60 * 1_000)
      : nextDayAtNineteenThirty(now);
  if (cadence.targetEndAt) {
    const targetEnd = new Date(cadence.targetEndAt);
    if (proposed.getTime() >= targetEnd.getTime()) {
      const remaining = targetEnd.getTime() - now.getTime();
      proposed = new Date(now.getTime() + Math.max(5 * 60 * 1_000, remaining / 2));
    }
  }
  return proposed.toISOString();
}

export function applyGoalCadenceRecommendation(
  current: SupportAgreementDraft,
  plan: GoalPlan,
): SupportAgreementDraft {
  return SupportAgreementDraftSchema.parse({
    ...current,
    checkInFrequency: plan.cadence.checkInFrequency,
    preferredCheckInTime: plan.cadence.preferredCheckInTime,
    reviewFrequencyDays: plan.cadence.reviewFrequencyDays,
  });
}

export async function createMockGoalArchitectResult(
  rawAnswers: OnboardingAnswers,
  now: () => Date = () => new Date(),
): Promise<MockGoalArchitectResult> {
  const answers = OnboardingAnswersSchema.parse(rawAnswers);
  const generatedAt = now();
  const cadence = createMockCadence(answers, generatedAt);
  const plan: GoalPlan = {
    goalSummary: answers.goal,
    motivation: answers.motivation,
    targetWindow: answers.targetWindow,
    cadence,
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
      scheduledFor: initialMockCheckIn(cadence, generatedAt),
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
