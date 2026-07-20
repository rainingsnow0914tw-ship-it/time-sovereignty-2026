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

export const CheckInFrequencySchema = z.enum([
  "DAILY",
  "WEEKDAYS",
  "WEEKLY",
  "CUSTOM",
]);

export const GoalCadenceKindSchema = z.enum([
  "SPRINT",
  "PROJECT",
  "HABIT",
]);

export const GoalCadenceSchema = z
  .object({
    kind: GoalCadenceKindSchema,
    targetEndAt: IsoDateTimeSchema.nullable(),
    checkInFrequency: CheckInFrequencySchema,
    preferredCheckInTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/u),
    // A goal that genuinely happens several times a day (three bridge sets, a
    // medication schedule) needs to say so structurally. Without this the UI
    // could only infer extra sessions by scanning the plan's prose for clock
    // strings, which also picked up times mentioned in passing.
    // Nullable rather than optional: the Responses structured-output API
    // requires every field to be present, so the model must return null for a
    // single daily check-in. The default keeps plans stored before this field
    // existed readable.
    additionalCheckInTimes: z
      .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u))
      .max(7)
      .nullable()
      .optional(),
    reviewFrequencyDays: z.number().int().min(1).max(90),
    rationale: z.string().trim().min(1).max(700),
    completionSignal: z.string().trim().min(1).max(500),
  })
  .strict()
  .superRefine((cadence, context) => {
    if (cadence.additionalCheckInTimes?.includes(cadence.preferredCheckInTime)) {
      context.addIssue({
        code: "custom",
        path: ["additionalCheckInTimes"],
        message:
          "Additional check-in times must not repeat the preferred time.",
      });
    }
    if (
      cadence.additionalCheckInTimes &&
      new Set(cadence.additionalCheckInTimes).size !==
        cadence.additionalCheckInTimes.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["additionalCheckInTimes"],
        message: "Additional check-in times must be distinct.",
      });
    }
    if (
      cadence.kind === "SPRINT" &&
      cadence.checkInFrequency === "WEEKLY"
    ) {
      context.addIssue({
        code: "custom",
        path: ["checkInFrequency"],
        message: "A sprint cannot begin with a weekly check-in rhythm.",
      });
    }
    if (cadence.kind === "SPRINT" && cadence.reviewFrequencyDays > 7) {
      context.addIssue({
        code: "custom",
        path: ["reviewFrequencyDays"],
        message: "A sprint must be reviewed within seven days.",
      });
    }
  });

export const QuietHoursSchema = z.object({
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u),
  timezone: z.string().trim().min(1),
});

export const SupportAgreementSchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  goalId: EntityIdSchema,
  checkInFrequency: CheckInFrequencySchema,
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

export const GoalPlanOutputSchema = z.object({
  goalSummary: z.string().trim().min(1).max(1_000),
  motivation: z.string().trim().min(1).max(2_000),
  targetWindow: z.string().trim().min(1).max(240),
  cadence: GoalCadenceSchema,
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
}).strict().superRefine((plan, context) => {
  if (
    plan.cadence.targetEndAt &&
    new Date(plan.initialCheckInProposal.scheduledFor).getTime() >=
      new Date(plan.cadence.targetEndAt).getTime()
  ) {
    context.addIssue({
      code: "custom",
      path: ["initialCheckInProposal", "scheduledFor"],
      message: "The initial check-in must happen before the target end time.",
    });
  }
});

function legacyGoalCadence(value: unknown): unknown {
  if (!value || typeof value !== "object" || "cadence" in value) return value;
  const record = value as Record<string, unknown>;
  const goal = String(record.goalSummary ?? "");
  const targetWindow = String(record.targetWindow ?? "");
  const combined = `${goal} ${targetWindow}`.toLowerCase();
  const habit =
    /(?:每天|每日|持續|習慣|規律|日課|daily|every day|habit|routine|consisten)/u.test(
      combined,
    );
  const sprint =
    /(?:今天|今晚|明天|本週|這週|today|tonight|tomorrow|this week|\b\d+\s*days?\b)/u.test(
      combined,
    );
  const kind = habit ? "HABIT" : sprint ? "SPRINT" : "PROJECT";
  return {
    ...record,
    cadence: {
      kind,
      targetEndAt: null,
      checkInFrequency:
        kind === "SPRINT" ? "CUSTOM" : kind === "HABIT" ? "DAILY" : "WEEKDAYS",
      preferredCheckInTime: "19:30",
      reviewFrequencyDays: kind === "SPRINT" ? 1 : 7,
      rationale:
        record.initialCheckInProposal &&
        typeof record.initialCheckInProposal === "object" &&
        typeof (record.initialCheckInProposal as Record<string, unknown>)
          .rationale === "string"
          ? (record.initialCheckInProposal as Record<string, string>).rationale
          : "This existing plan was upgraded to an editable goal-led cadence.",
      completionSignal:
        typeof record.firstMilestone === "string"
          ? record.firstMilestone
          : "The user confirms the intended outcome is complete.",
    },
  };
}

export const GoalPlanSchema = z.preprocess(
  legacyGoalCadence,
  GoalPlanOutputSchema,
);

export type GoalStatus = z.infer<typeof GoalStatusSchema>;
export type ActionStatus = z.infer<typeof ActionStatusSchema>;
export type StrategyOutcome = z.infer<typeof StrategyOutcomeSchema>;
export type CheckInFrequency = z.infer<typeof CheckInFrequencySchema>;
export type GoalCadenceKind = z.infer<typeof GoalCadenceKindSchema>;
export type GoalCadence = z.infer<typeof GoalCadenceSchema>;
export type SupportAgreement = z.infer<typeof SupportAgreementSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type GoalPlan = z.infer<typeof GoalPlanOutputSchema>;
