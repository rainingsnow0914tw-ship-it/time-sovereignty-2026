import type { z } from "zod";

import type {
  AgentRunTrace,
  ImplementedAgentRole,
} from "../../domain/agents/schemas";

export interface StructuredAgentImageInput {
  dataUrl: string;
  detail?: "low" | "high" | "auto" | "original";
}

export interface WebSearchRequest {
  // How much the search may return. The API accepts only these two words — an
  // integer is rejected with 400 invalid_type, verified against the live API on
  // 2026-07-21. Leave unset for the default; "unlimited" opts into longer
  // research runs and costs more.
  returnTokenBudget?: "default" | "unlimited";
}

export interface StructuredAgentRequest<TInput> {
  runId: string;
  agent: ImplementedAgentRole;
  scenario?: string;
  outputSchemaName: string;
  inputSummary: string;
  input: TInput;
  additionalInstructions?: string;
  safetyIdentifier?: string;
  imageInputs?: readonly StructuredAgentImageInput[];
  // Opt-in only; every existing agent call stays tool-free. A private check-in
  // must not quietly reach the public web, so this is set when the user asks
  // something the assistant genuinely cannot answer from her own goal, history
  // and memory — never to decorate an ordinary decision.
  webSearch?: WebSearchRequest;
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
