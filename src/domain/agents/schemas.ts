import { z } from "zod";

import { GoalPlanSchema, StrategyOutcomeSchema } from "../goals/schemas";
import { MemoryProposalSchema } from "../memories/schemas";
import { EntityIdSchema, IsoDateTimeSchema } from "../shared";

export const ImplementedAgentRoleSchema = z.enum([
  "CHIEF_OF_STAFF",
  "GOAL_ARCHITECT",
  "COMMITMENT_RECOVERY",
  "MEMORY_CURATOR",
]);

export const SubAgentRoleSchema = z.enum([
  "GOAL_ARCHITECT",
  "COMMITMENT_RECOVERY",
  "MEMORY_CURATOR",
]);

export const GoalArchitectOutputSchema = GoalPlanSchema;

export const CommitmentRecoveryOutputSchema = z.object({
  possibleReason: z.string().trim().min(1).max(240),
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
  suggestedQuestion: z.string().trim().min(1).max(1_000).nullable(),
  strategyCandidates: z.array(StrategyOutcomeSchema).min(1).max(8),
  recommendedFollowUpAt: IsoDateTimeSchema.nullable(),
}).strict();

export const MemoryCuratorOutputSchema = z.object({
  proposals: z.array(MemoryProposalSchema).max(20),
  summary: z.string().trim().min(1).max(2_000),
}).strict();

export const ChiefOfStaffOutputSchema = z.object({
  userMessage: z.string().trim().min(1).max(6_000),
  dispatchedAgents: z.array(SubAgentRoleSchema).max(3),
  selectedStrategy: StrategyOutcomeSchema.nullable(),
  nextFollowUpAt: IsoDateTimeSchema.nullable(),
  memoryProposals: z.array(MemoryProposalSchema).max(20),
}).strict();

export const AgentRunTraceSchema = z.object({
  runId: EntityIdSchema,
  agent: ImplementedAgentRoleSchema,
  provider: z.enum(["mock", "openai"]),
  model: z.string().trim().min(1).max(240),
  outputSchemaName: z.string().trim().min(1).max(240),
  inputSummary: z.string().trim().min(1).max(1_000),
  status: z.enum(["COMPLETED", "FAILED"]),
  startedAt: IsoDateTimeSchema,
  completedAt: IsoDateTimeSchema,
});

export type ImplementedAgentRole = z.infer<
  typeof ImplementedAgentRoleSchema
>;
export type SubAgentRole = z.infer<typeof SubAgentRoleSchema>;
export type GoalArchitectOutput = z.infer<typeof GoalArchitectOutputSchema>;
export type CommitmentRecoveryOutput = z.infer<
  typeof CommitmentRecoveryOutputSchema
>;
export type MemoryCuratorOutput = z.infer<typeof MemoryCuratorOutputSchema>;
export type ChiefOfStaffOutput = z.infer<typeof ChiefOfStaffOutputSchema>;
export type AgentRunTrace = z.infer<typeof AgentRunTraceSchema>;
