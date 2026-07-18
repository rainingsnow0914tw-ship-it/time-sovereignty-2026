import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";

import type { ImplementedAgentRole } from "../../domain/agents/schemas";
import type { AiProvider, AgentRunResult, StructuredAgentRequest } from "./types";

type ResponseParseBody = Parameters<OpenAI["responses"]["parse"]>[0];

export interface ParsedOpenAiResponse {
  outputParsed: unknown;
  model: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  } | null;
}

export type OpenAiResponseParser = (
  body: ResponseParseBody,
) => Promise<ParsedOpenAiResponse>;

export interface OpenAiResponsesProviderOptions {
  apiKey?: string;
  model?: string;
  maxOutputTokens?: number;
  maxRetries?: number;
  now?: () => Date;
  parseResponse?: OpenAiResponseParser;
}

export const DEFAULT_OPENAI_MAX_RETRIES = 0;

export class MissingOpenAiStructuredOutputError extends Error {
  constructor(agent: ImplementedAgentRole) {
    super(`OpenAI returned no parsed structured output for ${agent}.`);
    this.name = "MissingOpenAiStructuredOutputError";
  }
}

export class OpenAiResponsesProvider implements AiProvider {
  private readonly model: string;
  private readonly maxOutputTokens: number;
  private readonly now: () => Date;
  private readonly parseResponse: OpenAiResponseParser;

  constructor(options: OpenAiResponsesProviderOptions = {}) {
    this.model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6";
    this.maxOutputTokens = options.maxOutputTokens ?? 2_000;
    this.now = options.now ?? (() => new Date());

    if (options.parseResponse) {
      this.parseResponse = options.parseResponse;
      return;
    }

    const client = new OpenAI({
      apiKey: options.apiKey,
      maxRetries: options.maxRetries ?? DEFAULT_OPENAI_MAX_RETRIES,
    });
    this.parseResponse = async (body) => {
      const response = await client.responses.parse(body);
      return {
        outputParsed: response.output_parsed,
        model: response.model,
        usage: response.usage
          ? {
              inputTokens: response.usage.input_tokens,
              outputTokens: response.usage.output_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : null,
      };
    };
  }

  async generateStructured<TInput, TOutput>(
    request: StructuredAgentRequest<TInput>,
    outputSchema: z.ZodType<TOutput>,
  ): Promise<AgentRunResult<TOutput>> {
    const startedAt = this.now().toISOString();
    const baseInstructions = instructionsFor(
      request.agent,
      request.outputSchemaName,
    );
    const serializedInput = JSON.stringify({
      inputSummary: request.inputSummary,
      payload: request.input,
    });
    const input = request.imageInputs?.length
      ? [
          {
            role: "user" as const,
            content: [
              { type: "input_text" as const, text: serializedInput },
              ...request.imageInputs.map((image) => ({
                type: "input_image" as const,
                detail: image.detail ?? ("low" as const),
                image_url: image.dataUrl,
              })),
            ],
          },
        ]
      : serializedInput;
    const response = await this.parseResponse({
      model: this.model,
      instructions: request.additionalInstructions
        ? `${baseInstructions} ${request.additionalInstructions}`
        : baseInstructions,
      input,
      text: {
        format: zodTextFormat(
          outputSchema,
          normalizeFormatName(request.outputSchemaName),
        ),
      },
      reasoning: { effort: "none" },
      max_output_tokens: this.maxOutputTokens,
      store: false,
      safety_identifier: request.safetyIdentifier,
    });

    if (response.outputParsed === null) {
      throw new MissingOpenAiStructuredOutputError(request.agent);
    }

    const output = outputSchema.parse(response.outputParsed);
    const completedAt = this.now().toISOString();

    return {
      output,
      trace: {
        runId: request.runId,
        agent: request.agent,
        provider: "openai",
        model: response.model ?? this.model,
        outputSchemaName: request.outputSchemaName,
        inputSummary: request.inputSummary,
        tokenUsage: response.usage,
        status: "COMPLETED",
        startedAt,
        completedAt,
      },
    };
  }
}

export function instructionsFor(
  agent: ImplementedAgentRole,
  outputSchemaName = "",
): string {
  const common =
    "You are part of Time Sovereignty, an AI Chief of Staff for long-term goal execution. Return only the requested structured output. Respect the support agreement, avoid invented facts, and never expose private chain-of-thought.";

  if (agent === "CHIEF_OF_STAFF") {
    const liveCheckIn = outputSchemaName === "LiveChiefOfStaffDecision"
      ? " For a live check-in, first classify the user's real progress. Dispatch Commitment Recovery only when the report is blocked or the goal direction changed. Produce one concrete commitment the user can confirm, set a future follow-up unless the goal is completed, and include at most one tentative memory proposal."
      : "";
    return `${common} Synthesize one unified user-facing decision. Decide from the supplied specialist outputs and context. When a dispatchedAgents array is supplied, copy it exactly; never claim an agent was called when it was not. Propose memory changes as proposals, never as silently confirmed facts.${liveCheckIn}`;
  }

  if (agent === "GOAL_ARCHITECT") {
    return `${common} Evaluate goal clarity and feasibility, create a concise milestone, propose both a best next action and a minimum viable action, suggest an initial check-in, and expose assumptions that need confirmation.`;
  }

  if (agent === "COMMITMENT_RECOVERY") {
    return `${common} Analyze delay or resistance without moral judgment. Distinguish hypotheses from facts, ask for clarification when uncertain, and propose recovery strategies plus a follow-up time.`;
  }

  return `${common} Curate only durable, useful memory proposals. Distinguish confirmed facts, observations, and AI hypotheses. Require user confirmation when appropriate and never silently change the user's North Star.`;
}

function normalizeFormatName(name: string): string {
  const normalized = name.replaceAll(/[^a-zA-Z0-9_-]/gu, "_").slice(0, 64);
  return normalized || "structured_output";
}
