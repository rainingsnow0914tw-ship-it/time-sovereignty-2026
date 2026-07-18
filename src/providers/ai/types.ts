import type { z } from "zod";

import type {
  AgentRunTrace,
  ImplementedAgentRole,
} from "../../domain/agents/schemas";

export interface StructuredAgentRequest<TInput> {
  runId: string;
  agent: ImplementedAgentRole;
  scenario?: string;
  outputSchemaName: string;
  inputSummary: string;
  input: TInput;
  additionalInstructions?: string;
  safetyIdentifier?: string;
}

export interface AgentRunResult<TOutput> {
  output: TOutput;
  trace: AgentRunTrace;
}

export interface AiProvider {
  generateStructured<TInput, TOutput>(
    request: StructuredAgentRequest<TInput>,
    outputSchema: z.ZodType<TOutput>,
  ): Promise<AgentRunResult<TOutput>>;
}
