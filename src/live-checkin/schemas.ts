import { z } from "zod";

import {
  AgentRunTraceSchema,
  CommitmentRecoveryOutputSchema,
} from "../domain/agents/schemas";
import {
  GoalCadenceSchema,
  QuietHoursSchema,
  StrategyOutcomeSchema,
} from "../domain/goals/schemas";
import { EntityIdSchema, IsoDateTimeSchema } from "../domain/shared";

export const LiveCheckInStatusSchema = z.enum([
  "SCHEDULED",
  "PENDING",
  "PROCESSING",
  "DECISION_READY",
  "CONFIRMED",
  "FAILED",
]);

export const LiveCheckInContextSchema = z
  .object({
    goal: z.string().trim().min(1).max(240),
    motivation: z.string().trim().min(1).max(2_000),
    targetWindow: z.string().trim().min(1).max(240),
    cadence: GoalCadenceSchema.optional(),
    currentAction: z.string().trim().min(1).max(500),
    minimumAction: z.string().trim().min(1).max(500),
    preferredTone: z.string().trim().min(1).max(240),
    locale: z.enum(["zh-TW", "en"]).optional(),
    quietHours: QuietHoursSchema.optional(),
  })
  .strict();

export const LiveScheduleContextSchema = LiveCheckInContextSchema.extend({
  locale: z.enum(["zh-TW", "en"]),
  quietHours: QuietHoursSchema,
});

export const LiveMemoryProposalSchema = z
  .object({
    summary: z.string().trim().min(1).max(1_000),
    confidence: z.number().min(0).max(1),
    requiresUserConfirmation: z.boolean(),
  })
  .strict();

export const LiveCheckInAssessmentSchema = z.enum([
  "ON_TRACK",
  "PARTIAL",
  "BLOCKED",
  "GOAL_CHANGED",
  "COMPLETED",
]);

export const LiveReplyIntentSchema = z.enum([
  "REPORT_PROGRESS",
  "DELAY",
  "SOMETHING_CHANGED",
]);

export const LiveMemoryDispositionSchema = z.enum([
  "DEFER",
  "CONFIRM",
  "NOT_QUITE",
  "FORGET",
]);

export const LiveMemoryCurationStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const LiveChiefOfStaffDecisionOutputSchema = z
  .object({
    assessment: LiveCheckInAssessmentSchema,
    userMessage: z.string().trim().min(1).max(3_000),
    adaptedCommitment: z.string().trim().min(1).max(500),
    dispatchedAgents: z
      .array(z.literal("COMMITMENT_RECOVERY"))
      .max(1),
    selectedStrategy: StrategyOutcomeSchema.nullable(),
    nextFollowUpAt: IsoDateTimeSchema.nullable(),
    memoryProposal: LiveMemoryProposalSchema.nullable(),
  })
  .strict()
  .superRefine((decision, context) => {
    const needsRecovery = ["BLOCKED", "GOAL_CHANGED"].includes(
      decision.assessment,
    );
    if (needsRecovery !== (decision.dispatchedAgents.length === 1)) {
      context.addIssue({
        code: "custom",
        path: ["dispatchedAgents"],
        message:
          "Commitment Recovery must be dispatched exactly for blocked or changed goals.",
      });
    }
    if (decision.assessment !== "COMPLETED" && !decision.nextFollowUpAt) {
      context.addIssue({
        code: "custom",
        path: ["nextFollowUpAt"],
        message: "An active goal decision requires a future follow-up.",
      });
    }
  });

export const LiveChiefOfStaffDecisionSchema = z.preprocess((value) => {
  if (
    value &&
    typeof value === "object" &&
    !("assessment" in value)
  ) {
    return { ...value, assessment: "BLOCKED" };
  }
  return value;
}, LiveChiefOfStaffDecisionOutputSchema);

export const LiveCheckInDocumentSchema = z
  .object({
    version: z.literal(1),
    id: EntityIdSchema,
    sessionId: EntityIdSchema,
    status: LiveCheckInStatusSchema,
    message: z.string().trim().min(1).max(1_000),
    context: LiveCheckInContextSchema,
    scheduledFor: IsoDateTimeSchema,
    taskName: z.string().trim().min(1).max(1_000).nullable(),
    pendingAt: IsoDateTimeSchema.nullable(),
    replyId: EntityIdSchema.nullable(),
    replyFingerprint: z.string().regex(/^[a-f0-9]{64}$/u).nullable(),
    attemptCount: z.number().int().nonnegative(),
    leaseToken: z.string().uuid().nullable(),
    leaseExpiresAt: IsoDateTimeSchema.nullable(),
    triage: LiveChiefOfStaffDecisionSchema.nullable().optional(),
    recovery: CommitmentRecoveryOutputSchema.nullable(),
    decision: LiveChiefOfStaffDecisionSchema.nullable(),
    traceRunIds: z.array(EntityIdSchema).max(4),
    evidenceKinds: z
      .array(z.enum(["TEXT", "PHOTO"]))
      .max(2)
      .default([]),
    retrievedMemoryIds: z.array(EntityIdSchema).max(8).default([]),
    memoryDisposition: LiveMemoryDispositionSchema.nullable().default(null),
    memoryCurationStatus: LiveMemoryCurationStatusSchema.nullable().default(null),
    memoryCurationLeaseToken: z.string().uuid().nullable().default(null),
    memoryCurationLeaseExpiresAt: IsoDateTimeSchema.nullable().default(null),
    memoryCurationSummary: z.string().trim().min(1).max(2_000).nullable().default(null),
    confirmedAt: IsoDateTimeSchema.nullable(),
    confirmationId: EntityIdSchema.nullable(),
    nextCheckInId: EntityIdSchema.nullable(),
    nextTaskName: z.string().trim().min(1).max(1_000).nullable(),
    errorName: z.string().trim().min(1).max(240).nullable(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .strict();

export const LiveDeviceSessionSchema = z
  .object({
    version: z.literal(1),
    id: EntityIdSchema,
    deviceLabel: z.string().trim().min(1).max(120),
    expiresAt: IsoDateTimeSchema,
    activeCheckInId: EntityIdSchema.nullable(),
    lastConfirmedCheckInId: EntityIdSchema.nullable(),
    createdAt: IsoDateTimeSchema,
    revokedAt: IsoDateTimeSchema.nullable(),
    updatedAt: IsoDateTimeSchema,
  })
  .strict();

export const LivePairRequestSchema = z
  .object({
    pairingCode: z.string().min(12).max(500),
    deviceLabel: z.string().trim().min(1).max(120),
  })
  .strict();

export const LiveScheduleRequestSchema = z
  .object({
    scheduleId: EntityIdSchema,
    message: z.string().trim().min(1).max(1_000),
    context: LiveScheduleContextSchema,
    scheduledFor: IsoDateTimeSchema,
  })
  .strict();

export const LiveReplyRequestSchema = z
  .object({
    replyId: EntityIdSchema,
    intent: LiveReplyIntentSchema.default("REPORT_PROGRESS"),
    reply: z.string().trim().max(4_000),
    image: z
      .object({
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        dataUrl: z
          .string()
          .max(2_500_000)
          .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/u),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.intent === "REPORT_PROGRESS" &&
      !value.reply &&
      !value.image
    ) {
      context.addIssue({
        code: "custom",
        path: ["reply"],
        message: "A progress report requires text, voice transcript, or a photo.",
      });
    }
  });

export const LiveConfirmRequestSchema = z
  .object({
    confirmationId: EntityIdSchema,
    memoryDisposition: LiveMemoryDispositionSchema.default("DEFER"),
  })
  .strict();

export const ClientLiveCheckInSchema = LiveCheckInDocumentSchema.pick({
  id: true,
  status: true,
  message: true,
  context: true,
  scheduledFor: true,
  pendingAt: true,
  replyId: true,
  attemptCount: true,
  decision: true,
  traceRunIds: true,
  retrievedMemoryIds: true,
  memoryDisposition: true,
  memoryCurationStatus: true,
  memoryCurationSummary: true,
  confirmedAt: true,
  nextCheckInId: true,
  createdAt: true,
  updatedAt: true,
}).strip().extend({
  // A blocked or changed goal has a three-step safe trace:
  // Chief triage -> Commitment Recovery -> final Chief decision.
  traces: z.array(AgentRunTraceSchema).max(3),
});

export type LiveCheckInContext = z.infer<typeof LiveCheckInContextSchema>;
export type LiveCheckInDocument = z.infer<typeof LiveCheckInDocumentSchema>;
export type LiveChiefOfStaffDecision = z.infer<
  typeof LiveChiefOfStaffDecisionSchema
>;
export type LiveReplyRequest = z.infer<typeof LiveReplyRequestSchema>;
export type LiveMemoryDisposition = z.infer<typeof LiveMemoryDispositionSchema>;
export type LiveDeviceSession = z.infer<typeof LiveDeviceSessionSchema>;
export type ClientLiveCheckIn = z.infer<typeof ClientLiveCheckInSchema>;
