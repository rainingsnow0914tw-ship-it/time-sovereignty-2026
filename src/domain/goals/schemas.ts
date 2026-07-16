import { z } from "zod";

import { EntityIdSchema, IsoDateTimeSchema } from "../shared";

export const GoalStatusSchema = z.enum([
  "ACTIVE",
  "RESIZED",
  "REROUTED",
  "PAUSED",
  "RETIRED",
  "COMPLETED",
]);

export const ActionStatusSchema = z.enum([
  "PLANNED",
  "READY",
  "IN_PROGRESS",
  "AWAITING_UPDATE",
  "COMPLETED",
  "PAUSED",
  "RETIRED",
  "CANCELLED",
]);

export const StrategyOutcomeSchema = z.enum([
  "CONTINUE",
  "REDUCE",
  "REPLACE",
  "RESUME",
  "RESCHEDULE",
  "RECALIBRATE",
  "PAUSE",
  "RETIRE",
]);

export const ProgressFormatSchema = z.enum([
  "TEXT",
  "PHOTO",
  "VOICE",
  "VIDEO",
  "FILE",
  "LINK",
  "CODE",
]);

export const SupportChannelSchema = z.enum(["TEXT", "TTS", "VOICE"]);

export const QuietHoursSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u),
  timezone: z.string().trim().min(1),
});

export const SupportAgreementSchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  goalId: EntityIdSchema,
  checkInFrequency: z.enum(["DAILY", "WEEKDAYS", "WEEKLY", "CUSTOM"]),
  preferredCheckInTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/u),
  quietHours: QuietHoursSchema,
  interventionIntensity: z.enum(["GENTLE", "BALANCED", "FIRM"]),
  preferredTone: z.string().trim().min(1).max(240),
  allowedChannels: z.array(SupportChannelSchema).min(1),
  progressSharingFormats: z.array(ProgressFormatSchema).min(1),
  desiredFeedbackStyle: z.string().trim().min(1).max(500),
  pauseConditions: z.array(z.string().trim().min(1)),
  strongerFollowUpConditions: z.array(z.string().trim().min(1)),
  reviewFrequencyDays: z.number().int().positive(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const GoalSchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  title: z.string().trim().min(1).max(240),
  motivation: z.string().trim().min(1).max(2_000),
  targetWindow: z.string().trim().min(1).max(240),
  status: GoalStatusSchema,
  supportAgreementId: EntityIdSchema.nullable(),
  currentActionId: EntityIdSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const ActionSchema = z.object({
  id: EntityIdSchema,
  goalId: EntityIdSchema,
  title: z.string().trim().min(1).max(500),
  minimumVersion: z.string().trim().min(1).max(500),
  status: ActionStatusSchema,
  nextCheckAt: IsoDateTimeSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const GoalPlanSchema = z.object({
  goalSummary: z.string().trim().min(1).max(1_000),
  motivation: z.string().trim().min(1).max(2_000),
  targetWindow: z.string().trim().min(1).max(240),
  feasibilityNotes: z.array(z.string().trim().min(1)).max(12),
  firstMilestone: z.string().trim().min(1).max(500),
  bestNextAction: z.string().trim().min(1).max(500),
  minimumViableAction: z.string().trim().min(1).max(500),
  initialCheckInProposal: z.object({
    scheduledFor: IsoDateTimeSchema,
    rationale: z.string().trim().min(1).max(500),
  }).strict(),
  assumptionsNeedingConfirmation: z
    .array(z.string().trim().min(1))
    .max(12),
}).strict();

export type GoalStatus = z.infer<typeof GoalStatusSchema>;
export type ActionStatus = z.infer<typeof ActionStatusSchema>;
export type StrategyOutcome = z.infer<typeof StrategyOutcomeSchema>;
export type SupportAgreement = z.infer<typeof SupportAgreementSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type GoalPlan = z.infer<typeof GoalPlanSchema>;
