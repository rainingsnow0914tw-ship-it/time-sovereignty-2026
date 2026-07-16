import { z } from "zod";

import { AgentRunTraceSchema } from "../domain/agents/schemas";
import {
  ActionSchema,
  GoalPlanSchema,
  GoalSchema,
  SupportAgreementSchema,
  type GoalPlan,
} from "../domain/goals/schemas";
import {
  OnboardingAnswersSchema,
  SupportAgreementDraftSchema,
  type OnboardingAnswers,
  type SupportAgreementDraft,
} from "../features/onboarding/model";
import type { AgentRunTrace } from "../domain/agents/schemas";

export const LOCAL_ONBOARDING_STORAGE_KEY =
  "time-sovereignty.phase-two.onboarding.v1";

export const LocalOnboardingRecordSchema = z
  .object({
    version: z.literal(1),
    answers: OnboardingAnswersSchema,
    plan: GoalPlanSchema,
    goal: GoalSchema,
    action: ActionSchema,
    supportAgreement: SupportAgreementSchema,
    agentTrace: AgentRunTraceSchema,
    savedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type LocalOnboardingRecord = z.infer<
  typeof LocalOnboardingRecordSchema
>;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface ConfirmedRecordInput {
  answers: OnboardingAnswers;
  plan: GoalPlan;
  support: SupportAgreementDraft;
  agentTrace: AgentRunTrace;
  now?: () => Date;
  idFactory?: (prefix: "goal" | "action" | "support") => string;
}

export function createConfirmedOnboardingRecord({
  answers: rawAnswers,
  plan: rawPlan,
  support: rawSupport,
  agentTrace,
  now = () => new Date(),
  idFactory = (prefix) => `${prefix}-${crypto.randomUUID()}`,
}: ConfirmedRecordInput): LocalOnboardingRecord {
  const answers = OnboardingAnswersSchema.parse(rawAnswers);
  const plan = GoalPlanSchema.parse(rawPlan);
  const support = SupportAgreementDraftSchema.parse(rawSupport);
  const createdAt = now().toISOString();
  const goalId = idFactory("goal");
  const actionId = idFactory("action");
  const supportId = idFactory("support");

  return LocalOnboardingRecordSchema.parse({
    version: 1,
    answers,
    plan,
    goal: {
      id: goalId,
      userId: "local-user",
      title: plan.goalSummary,
      motivation: plan.motivation,
      targetWindow: plan.targetWindow,
      status: "ACTIVE",
      supportAgreementId: supportId,
      currentActionId: actionId,
      createdAt,
      updatedAt: createdAt,
    },
    action: {
      id: actionId,
      goalId,
      title: plan.bestNextAction,
      minimumVersion: plan.minimumViableAction,
      status: "READY",
      nextCheckAt: plan.initialCheckInProposal.scheduledFor,
      createdAt,
      updatedAt: createdAt,
    },
    supportAgreement: {
      id: supportId,
      userId: "local-user",
      goalId,
      checkInFrequency: support.checkInFrequency,
      preferredCheckInTime: support.preferredCheckInTime,
      quietHours: {
        start: support.quietStart,
        end: support.quietEnd,
        timezone: support.timezone,
      },
      interventionIntensity: support.interventionIntensity,
      preferredTone: support.preferredTone,
      allowedChannels: support.allowedChannels,
      progressSharingFormats: support.progressSharingFormats,
      desiredFeedbackStyle: support.desiredFeedbackStyle,
      pauseConditions: [support.pauseConditions],
      strongerFollowUpConditions: [support.strongerFollowUpConditions],
      reviewFrequencyDays: support.reviewFrequencyDays,
      createdAt,
      updatedAt: createdAt,
    },
    agentTrace,
    savedAt: createdAt,
  });
}

export function createLocalOnboardingRepository(storage: StorageLike) {
  return {
    load(): LocalOnboardingRecord | null {
      const serialized = storage.getItem(LOCAL_ONBOARDING_STORAGE_KEY);
      if (!serialized) return null;

      try {
        const parsedJson: unknown = JSON.parse(serialized);
        const parsed = LocalOnboardingRecordSchema.safeParse(parsedJson);
        return parsed.success ? parsed.data : null;
      } catch {
        return null;
      }
    },

    save(record: LocalOnboardingRecord): void {
      const validated = LocalOnboardingRecordSchema.parse(record);
      storage.setItem(
        LOCAL_ONBOARDING_STORAGE_KEY,
        JSON.stringify(validated),
      );
    },

    clear(): void {
      storage.removeItem(LOCAL_ONBOARDING_STORAGE_KEY);
    },
  };
}
