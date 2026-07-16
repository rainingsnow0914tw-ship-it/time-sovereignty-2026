import { z } from "zod";

import { EntityIdSchema, IsoDateTimeSchema } from "../shared";

export const InterventionStateSchema = z.enum([
  "SCHEDULED",
  "DUE",
  "DELIVERED",
  "USER_RESPONDED",
  "ADAPTING",
  "RESCHEDULED",
  "CONFIRMED",
  "CLOSED",
  "FAILED",
  "CANCELLED",
]);

export const InterventionTriggerSchema = z.enum([
  "NEXT_CHECK_AT",
  "ACTION_OVERDUE",
  "USER_RESISTED",
  "ACTION_INTERRUPTED",
  "RECOVERY_CONDITION",
  "REPEATED_DELAY",
  "SIMULATED_TIME",
  "GOAL_CALIBRATION",
]);

export const InterventionChannelSchema = z.enum(["TEXT", "TTS", "VOICE"]);

export const DelayRecordSchema = z.object({
  originalScheduledFor: IsoDateTimeSchema,
  revisedScheduledFor: IsoDateTimeSchema,
  statedReason: z.string().trim().min(1).max(1_000).nullable(),
  createdAt: IsoDateTimeSchema,
});

export const InterventionSchema = z.object({
  id: EntityIdSchema,
  actionId: EntityIdSchema,
  state: InterventionStateSchema,
  trigger: InterventionTriggerSchema,
  channel: InterventionChannelSchema,
  scheduledFor: IsoDateTimeSchema,
  deliveryKey: z.string().trim().min(1).max(256),
  delayCount: z.number().int().nonnegative(),
  delayHistory: z.array(DelayRecordSchema),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const InterventionEffectivenessSchema = z.object({
  interventionId: EntityIdSchema,
  originalAction: z.string().trim().min(1).max(1_000),
  userResponse: z.string().trim().min(1).max(4_000),
  interpretedReason: z.string().trim().min(1).max(1_000).nullable(),
  strategyUsed: z.string().trim().min(1).max(240).nullable(),
  newAction: z.string().trim().min(1).max(1_000).nullable(),
  accepted: z.boolean().nullable(),
  completed: z.boolean().nullable(),
  userSentiment: z.enum(["HELPED", "NEUTRAL", "PRESSURED", "ANNOYED"]),
  userRating: z.number().int().min(1).max(5).nullable(),
  nextAdjustment: z.string().trim().min(1).max(1_000).nullable(),
  recordedAt: IsoDateTimeSchema,
});

export type InterventionState = z.infer<typeof InterventionStateSchema>;
export type Intervention = z.infer<typeof InterventionSchema>;
export type DelayRecord = z.infer<typeof DelayRecordSchema>;
export type InterventionEffectiveness = z.infer<
  typeof InterventionEffectivenessSchema
>;
