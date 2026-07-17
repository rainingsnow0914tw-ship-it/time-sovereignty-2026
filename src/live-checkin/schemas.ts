import { z } from "zod";

import {
  AgentRunTraceSchema,
  CommitmentRecoveryOutputSchema,
} from "../domain/agents/schemas";
import { StrategyOutcomeSchema } from "../domain/goals/schemas";
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
    currentAction: z.string().trim().min(1).max(500),
    minimumAction: z.string().trim().min(1).max(500),
    preferredTone: z.string().trim().min(1).max(240),
  })
  .strict();

export const LiveMemoryProposalSchema = z
  .object({
    summary: z.string().trim().min(1).max(1_000),
    confidence: z.number().min(0).max(1),
    requiresUserConfirmation: z.boolean(),
  })
  .strict();

export const LiveChiefOfStaffDecisionSchema = z
  .object({
    userMessage: z.string().trim().min(1).max(3_000),
    adaptedCommitment: z.string().trim().min(1).max(500),
    dispatchedAgents: z
      .array(z.literal("COMMITMENT_RECOVERY"))
      .length(1),
    selectedStrategy: StrategyOutcomeSchema,
    nextFollowUpAt: IsoDateTimeSchema,
    memoryProposal: LiveMemoryProposalSchema.nullable(),
  })
  .strict();

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
    recovery: CommitmentRecoveryOutputSchema.nullable(),
    decision: LiveChiefOfStaffDecisionSchema.nullable(),
    traceRunIds: z.array(EntityIdSchema).max(2),
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
    context: LiveCheckInContextSchema,
    scheduledFor: IsoDateTimeSchema,
  })
  .strict();

export const LiveReplyRequestSchema = z
  .object({
    replyId: EntityIdSchema,
    reply: z.string().trim().min(1).max(4_000),
  })
  .strict();

export const LiveConfirmRequestSchema = z
  .object({
    confirmationId: EntityIdSchema,
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
  confirmedAt: true,
  nextCheckInId: true,
  createdAt: true,
  updatedAt: true,
}).strip().extend({
  traces: z.array(AgentRunTraceSchema).max(2),
});

export type LiveCheckInContext = z.infer<typeof LiveCheckInContextSchema>;
export type LiveCheckInDocument = z.infer<typeof LiveCheckInDocumentSchema>;
export type LiveChiefOfStaffDecision = z.infer<
  typeof LiveChiefOfStaffDecisionSchema
>;
export type LiveDeviceSession = z.infer<typeof LiveDeviceSessionSchema>;
export type ClientLiveCheckIn = z.infer<typeof ClientLiveCheckInSchema>;
