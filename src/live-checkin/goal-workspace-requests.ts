import { z } from "zod";

import {
  GoalWorkspaceStatusSchema,
  LocalClockTimeSchema,
} from "../domain/goals/workspace-schemas";
import { EntityIdSchema } from "../domain/shared";
import { LocalOnboardingRecordSchema } from "../repositories/local-onboarding-repository";

export const GoalWorkspaceCreateRequestSchema = z
  .object({
    requestId: EntityIdSchema,
    record: LocalOnboardingRecordSchema,
    scheduleTimes: z.array(LocalClockTimeSchema).min(1).max(8).optional(),
  })
  .strict();

export const GoalWorkspaceStatusRequestSchema = z
  .object({
    expectedRevision: z.number().int().positive(),
    status: GoalWorkspaceStatusSchema,
  })
  .strict();

export const GoalWorkspaceDeleteRequestSchema = z
  .object({
    expectedRevision: z.number().int().positive(),
  })
  .strict();

export type GoalWorkspaceCreateRequest = z.infer<
  typeof GoalWorkspaceCreateRequestSchema
>;
