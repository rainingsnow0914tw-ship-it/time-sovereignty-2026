import { z } from "zod";

import {
  EntityIdSchema,
  IsoDateTimeSchema,
  MemorySourceTypeSchema,
} from "../shared";

export const MemoryKindSchema = z.enum([
  "NORTH_STAR",
  "GOAL",
  "EPISODE",
  "STRATEGY",
  "PROGRESS",
  "SUPPORT_AGREEMENT",
  "GOAL_REVISION",
  "RESUME",
]);

export const MemoryStateSchema = z.enum(["ACTIVE", "OUTDATED", "SUPERSEDED"]);

export const MemoryValueAttributeSchema = z
  .object({
    key: z.string().trim().min(1).max(120),
    value: z.string().trim().min(1).max(1_000),
  })
  .strict();

export const MemoryProposedValueSchema = z
  .object({
    summary: z.string().trim().min(1).max(2_000),
    attributes: z.array(MemoryValueAttributeSchema).max(20),
  })
  .strict();

export const MemoryRecordSchema = z
  .object({
    id: EntityIdSchema,
    userId: EntityIdSchema,
    goalId: EntityIdSchema.nullable(),
    kind: MemoryKindSchema,
    state: MemoryStateSchema,
    sourceType: MemorySourceTypeSchema,
    value: z.record(z.string(), z.unknown()),
    confidence: z.number().min(0).max(1),
    sensitivity: z.enum(["LOW", "MODERATE", "HIGH"]),
    userEditable: z.boolean(),
    evidenceRefs: z.array(z.string().trim().min(1).max(500)),
    validFrom: IsoDateTimeSchema,
    validUntil: IsoDateTimeSchema.nullable(),
    confirmedAt: IsoDateTimeSchema.nullable(),
    supersededById: EntityIdSchema.nullable(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .superRefine((memory, context) => {
    if (memory.sourceType === "AI_HYPOTHESIS" && memory.confirmedAt !== null) {
      context.addIssue({
        code: "custom",
        path: ["confirmedAt"],
        message:
          "An AI hypothesis must become CONFIRMED_BY_USER before it can be marked confirmed.",
      });
    }
  });

export const MemoryProposalSchema = z.object({
  operation: z.enum(["CREATE", "UPDATE", "INVALIDATE", "DELETE"]),
  memoryId: EntityIdSchema.nullable(),
  kind: MemoryKindSchema,
  sourceType: MemorySourceTypeSchema,
  proposedValue: MemoryProposedValueSchema.nullable(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().trim().min(1).max(1_000),
  requiresUserConfirmation: z.boolean(),
}).strict();

export type MemoryKind = z.infer<typeof MemoryKindSchema>;
export type MemoryRecord = z.infer<typeof MemoryRecordSchema>;
export type MemoryProposedValue = z.infer<typeof MemoryProposedValueSchema>;
export type MemoryProposal = z.infer<typeof MemoryProposalSchema>;
