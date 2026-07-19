import { z } from "zod";

import { EntityIdSchema, IsoDateTimeSchema } from "../domain/shared";

export const CatchLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(4),
]);

export const CatchPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH"]);

export const CatchUserConditionSchema = z.enum([
  "NORMAL",
  "LOW_ENERGY",
  "SICK_OR_EMERGENCY",
]);

export const CatchResponseTypeSchema = z.enum([
  "complete",
  "reschedule",
  "downgrade",
  "mercy",
  "timeout",
]);

export const CatchEscalationContextSchema = z.object({
  eventId: EntityIdSchema,
  level: CatchLevelSchema,
  priority: CatchPrioritySchema,
  responded: z.boolean(),
  cancelled: z.boolean(),
  supportPaused: z.boolean(),
  categoryEnabled: z.boolean(),
  consentValid: z.boolean(),
  fullScreenConsent: z.boolean(),
  withinQuietHours: z.boolean(),
  userCondition: CatchUserConditionSchema,
});

export const CatchResponseSchema = z
  .object({
    eventId: EntityIdSchema,
    responseId: EntityIdSchema,
    type: CatchResponseTypeSchema,
    responseText: z.string().trim().min(1).max(4_000).nullable(),
    energy: z.enum(["HIGH", "MEDIUM", "LOW"]).nullable(),
    delayMinutes: z.number().int().min(1).max(7 * 24 * 60).nullable(),
    respondedAt: IsoDateTimeSchema,
  })
  .superRefine((response, context) => {
    if (response.type === "reschedule" && response.delayMinutes === null) {
      context.addIssue({
        code: "custom",
        path: ["delayMinutes"],
        message: "A reschedule response must create a bounded delay.",
      });
    }

    if (response.type !== "reschedule" && response.delayMinutes !== null) {
      context.addIssue({
        code: "custom",
        path: ["delayMinutes"],
        message: "Only a reschedule response may include delayMinutes.",
      });
    }
  });

export type CatchLevel = z.infer<typeof CatchLevelSchema>;
export type CatchPriority = z.infer<typeof CatchPrioritySchema>;
export type CatchUserCondition = z.infer<typeof CatchUserConditionSchema>;
export type CatchResponseType = z.infer<typeof CatchResponseTypeSchema>;
export type CatchEscalationContext = z.infer<
  typeof CatchEscalationContextSchema
>;
export type CatchResponse = z.infer<typeof CatchResponseSchema>;
