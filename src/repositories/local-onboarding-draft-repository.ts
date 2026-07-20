import { z } from "zod";

import { AgentRunTraceSchema } from "../domain/agents/schemas";
import { GoalPlanSchema } from "../domain/goals/schemas";
import {
  SupportAgreementDraftSchema,
} from "../features/onboarding/model";
import type { OnboardingStorageProfile, StorageLike } from "./local-onboarding-repository";

export const LocalOnboardingDraftSchema = z
  .object({
    version: z.literal(1),
    stage: z.enum(["goal", "window", "why", "plan", "support"]),
    answers: z
      .object({
        goal: z.string().max(240),
        targetWindow: z.string().max(240),
        motivation: z.string().max(2_000),
      })
      .strict(),
    plan: GoalPlanSchema.nullable(),
    trace: AgentRunTraceSchema.nullable(),
    support: SupportAgreementDraftSchema,
    scheduleTimes: z
      .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u))
      .min(1)
      .max(8),
    savedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type LocalOnboardingDraft = z.infer<typeof LocalOnboardingDraftSchema>;

function key(profile: OnboardingStorageProfile) {
  return `time-sovereignty.goal-draft.v1.${profile}`;
}

export function createLocalOnboardingDraftRepository(
  storage: StorageLike,
  profile: OnboardingStorageProfile,
) {
  const storageKey = key(profile);
  return {
    load(): LocalOnboardingDraft | null {
      const serialized = storage.getItem(storageKey);
      if (!serialized) return null;
      try {
        const result = LocalOnboardingDraftSchema.safeParse(
          JSON.parse(serialized) as unknown,
        );
        return result.success ? result.data : null;
      } catch {
        return null;
      }
    },
    save(draft: LocalOnboardingDraft): void {
      storage.setItem(
        storageKey,
        JSON.stringify(LocalOnboardingDraftSchema.parse(draft)),
      );
    },
    clear(): void {
      storage.removeItem(storageKey);
    },
  };
}
