import { createHash } from "node:crypto";

import { z } from "zod";

import { EntityIdSchema, IsoDateTimeSchema, MemorySourceTypeSchema } from "../domain/shared";
import {
  LiveCheckInAssessmentSchema,
  LiveMemoryDispositionSchema,
  type LiveCheckInContext,
  type LiveCheckInDocument,
  type LiveMemoryDisposition,
} from "./schemas";

export const LiveMemoryScopeSchema = z.enum(["USER", "GOAL"]);
export const LiveMemoryKindSchema = z.enum([
  "STRATEGY",
  "PROGRESS",
  "SUPPORT_AGREEMENT",
  "GOAL_REVISION",
  "RESUME",
]);
export const LiveMemoryConfirmationStateSchema = z.enum([
  "TENTATIVE",
  "CONFIRMED",
  "OPERATIONAL",
]);

export const LiveMemoryEffectivenessSchema = z
  .object({
    attempts: z.number().int().nonnegative(),
    successes: z.number().int().nonnegative(),
    partials: z.number().int().nonnegative(),
    blocked: z.number().int().nonnegative(),
    goalChanged: z.number().int().nonnegative(),
  })
  .strict();

export const LiveMemoryRecordSchema = z
  .object({
    version: z.literal(2),
    id: EntityIdSchema,
    sessionId: EntityIdSchema,
    sourceCheckInId: EntityIdSchema,
    scope: LiveMemoryScopeSchema,
    goalKey: z.string().regex(/^[a-f0-9]{32}$/u).nullable(),
    kind: LiveMemoryKindSchema,
    state: z.enum(["ACTIVE", "OUTDATED", "SUPERSEDED"]),
    sourceType: MemorySourceTypeSchema,
    confirmationState: LiveMemoryConfirmationStateSchema,
    summary: z.string().trim().min(1).max(2_000),
    confidence: z.number().min(0).max(1),
    effectiveness: LiveMemoryEffectivenessSchema,
    evidenceCheckInIds: z.array(EntityIdSchema).min(1).max(20),
    validFrom: IsoDateTimeSchema,
    validUntil: IsoDateTimeSchema.nullable(),
    recheckAt: IsoDateTimeSchema.nullable(),
    confirmedAt: IsoDateTimeSchema.nullable(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .strict()
  .superRefine((memory, context) => {
    if (memory.scope === "GOAL" && !memory.goalKey) {
      context.addIssue({
        code: "custom",
        path: ["goalKey"],
        message: "Goal-scoped memory requires a goal key.",
      });
    }
    if (
      memory.confirmationState === "TENTATIVE" &&
      memory.confidence > 0.65
    ) {
      context.addIssue({
        code: "custom",
        path: ["confidence"],
        message: "Tentative memory confidence must remain limited.",
      });
    }
  });

export const LiveEpisodeSchema = z
  .object({
    version: z.literal(1),
    id: EntityIdSchema,
    sessionId: EntityIdSchema,
    checkInId: EntityIdSchema,
    goalKey: z.string().regex(/^[a-f0-9]{32}$/u),
    goalSnapshot: z.string().trim().min(1).max(240),
    actionBefore: z.string().trim().min(1).max(500),
    assessment: LiveCheckInAssessmentSchema,
    commitmentAfter: z.string().trim().min(1).max(500),
    selectedStrategy: z.string().trim().min(1).max(120).nullable(),
    evidenceKinds: z.array(z.enum(["TEXT", "PHOTO"])).max(2),
    outcomeSummary: z.string().trim().min(1).max(3_000),
    memoryDisposition: LiveMemoryDispositionSchema,
    occurredAt: IsoDateTimeSchema,
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export type LiveMemoryRecord = z.infer<typeof LiveMemoryRecordSchema>;
export type LiveEpisode = z.infer<typeof LiveEpisodeSchema>;

export function deriveLiveGoalKey(context: LiveCheckInContext): string {
  const normalized = context.goal.trim().toLocaleLowerCase("en-US");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

export function memoryDocumentId(prefix: string, checkInId: string): string {
  const digest = createHash("sha256").update(checkInId).digest("hex").slice(0, 16);
  return `${prefix}-${digest}`;
}

export function buildLiveEpisode(options: {
  checkIn: LiveCheckInDocument;
  disposition: LiveMemoryDisposition;
  timestamp: string;
}): LiveEpisode {
  const { checkIn, disposition, timestamp } = options;
  if (!checkIn.decision) throw new Error("A live episode requires a decision.");
  return LiveEpisodeSchema.parse({
    version: 1,
    id: memoryDocumentId("episode", checkIn.id),
    sessionId: checkIn.sessionId,
    checkInId: checkIn.id,
    goalKey: deriveLiveGoalKey(checkIn.context),
    goalSnapshot: checkIn.context.goal,
    actionBefore: checkIn.context.currentAction,
    assessment: checkIn.decision.assessment,
    commitmentAfter: checkIn.decision.adaptedCommitment,
    selectedStrategy: checkIn.decision.selectedStrategy,
    evidenceKinds: checkIn.evidenceKinds,
    outcomeSummary: checkIn.decision.userMessage,
    memoryDisposition: disposition,
    occurredAt: timestamp,
    createdAt: timestamp,
  });
}

const emptyEffectiveness = {
  attempts: 0,
  successes: 0,
  partials: 0,
  blocked: 0,
  goalChanged: 0,
};

export function buildStrategyMemory(options: {
  checkIn: LiveCheckInDocument;
  disposition: LiveMemoryDisposition;
  timestamp: string;
}): LiveMemoryRecord | null {
  const { checkIn, disposition, timestamp } = options;
  const proposal = checkIn.decision?.memoryProposal;
  if (!proposal || disposition === "NOT_QUITE" || disposition === "FORGET") {
    return null;
  }
  const confirmed = disposition === "CONFIRM";
  return LiveMemoryRecordSchema.parse({
    version: 2,
    id: memoryDocumentId("strategy", checkIn.id),
    sessionId: checkIn.sessionId,
    sourceCheckInId: checkIn.id,
    scope: "GOAL",
    goalKey: deriveLiveGoalKey(checkIn.context),
    kind: "STRATEGY",
    state: "ACTIVE",
    sourceType: confirmed ? "CONFIRMED_BY_USER" : "OBSERVED_PATTERN",
    confirmationState: confirmed ? "CONFIRMED" : "TENTATIVE",
    summary: proposal.summary,
    confidence: confirmed
      ? proposal.confidence
      : Math.min(proposal.confidence, 0.45),
    effectiveness: emptyEffectiveness,
    evidenceCheckInIds: [checkIn.id],
    validFrom: timestamp,
    validUntil: null,
    recheckAt: null,
    confirmedAt: confirmed ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function buildResumeMemory(options: {
  checkIn: LiveCheckInDocument;
  timestamp: string;
}): LiveMemoryRecord {
  const { checkIn, timestamp } = options;
  if (!checkIn.decision) throw new Error("A resume point requires a decision.");
  return LiveMemoryRecordSchema.parse({
    version: 2,
    id: memoryDocumentId("resume", checkIn.id),
    sessionId: checkIn.sessionId,
    sourceCheckInId: checkIn.id,
    scope: "GOAL",
    goalKey: deriveLiveGoalKey(checkIn.context),
    kind: "RESUME",
    state: "ACTIVE",
    sourceType: "CONFIRMED_BY_USER",
    confirmationState: "OPERATIONAL",
    summary: checkIn.decision.adaptedCommitment,
    confidence: 1,
    effectiveness: emptyEffectiveness,
    evidenceCheckInIds: [checkIn.id],
    validFrom: timestamp,
    validUntil: checkIn.decision.nextFollowUpAt,
    recheckAt: checkIn.decision.nextFollowUpAt,
    confirmedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function applyMemoryOutcome(options: {
  memory: LiveMemoryRecord;
  assessment: z.infer<typeof LiveCheckInAssessmentSchema>;
  checkInId: string;
  timestamp: string;
}): LiveMemoryRecord {
  const { memory, assessment, checkInId, timestamp } = options;
  if (memory.kind !== "STRATEGY") return memory;
  const effectiveness = { ...memory.effectiveness };
  effectiveness.attempts += 1;
  if (assessment === "COMPLETED" || assessment === "ON_TRACK") {
    effectiveness.successes += 1;
  } else if (assessment === "PARTIAL") {
    effectiveness.partials += 1;
  } else if (assessment === "BLOCKED") {
    effectiveness.blocked += 1;
  } else {
    effectiveness.goalChanged += 1;
  }

  const delta =
    assessment === "COMPLETED" || assessment === "ON_TRACK"
      ? 0.12
      : assessment === "PARTIAL"
        ? 0.03
        : assessment === "BLOCKED"
          ? -0.08
          : -0.03;
  const ceiling = memory.confirmationState === "TENTATIVE" ? 0.65 : 0.95;
  return LiveMemoryRecordSchema.parse({
    ...memory,
    confidence: Math.max(0.05, Math.min(ceiling, memory.confidence + delta)),
    effectiveness,
    evidenceCheckInIds: [...new Set([...memory.evidenceCheckInIds, checkInId])].slice(-20),
    updatedAt: timestamp,
  });
}

export function memoryContextForModel(memories: readonly LiveMemoryRecord[]) {
  return memories.map((memory) => ({
    id: memory.id,
    scope: memory.scope,
    kind: memory.kind,
    summary: memory.summary,
    sourceType: memory.sourceType,
    confirmationState: memory.confirmationState,
    confidence: memory.confidence,
    evidenceCount: memory.evidenceCheckInIds.length,
    effectiveness: memory.effectiveness,
    validUntil: memory.validUntil,
    instruction:
      memory.confirmationState === "TENTATIVE"
        ? "LIMITED_EVIDENCE: use as a hypothesis, say it may help, and do not generalize it into a permanent truth."
        : "Use only within its stated scope and validity window.",
  }));
}

export function selectRelevantLiveMemories(options: {
  memories: readonly LiveMemoryRecord[];
  context: LiveCheckInContext;
  now: Date;
  limit?: number;
}): LiveMemoryRecord[] {
  const goalKey = deriveLiveGoalKey(options.context);
  const nowMs = options.now.getTime();
  return options.memories
    .filter((memory) => memory.state === "ACTIVE")
    .filter((memory) => memory.scope === "USER" || memory.goalKey === goalKey)
    .filter(
      (memory) =>
        memory.validUntil === null || new Date(memory.validUntil).getTime() >= nowMs,
    )
    .sort((left, right) => {
      const scopeDelta = Number(right.scope === "GOAL") - Number(left.scope === "GOAL");
      if (scopeDelta !== 0) return scopeDelta;
      const confirmationDelta =
        Number(right.confirmationState === "CONFIRMED") -
        Number(left.confirmationState === "CONFIRMED");
      if (confirmationDelta !== 0) return confirmationDelta;
      return right.updatedAt.localeCompare(left.updatedAt);
    })
    .slice(0, options.limit ?? 8);
}
