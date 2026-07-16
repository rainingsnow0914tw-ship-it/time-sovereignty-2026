import { describe, expect, it } from "vitest";
import type { z } from "zod";

import {
  ChiefOfStaffOutputSchema,
  CommitmentRecoveryOutputSchema,
  GoalArchitectOutputSchema,
  MemoryCuratorOutputSchema,
  type ImplementedAgentRole,
} from "../../domain/agents/schemas";
import { OpenAiResponsesProvider } from "./openai-provider";

const runLive = process.env.RUN_PHASE4_CONTRACT_LIVE === "1";
const requestedModel = "gpt-5.6";

const provider = runLive
  ? new OpenAiResponsesProvider({
      model: requestedModel,
      maxOutputTokens: 2_000,
      maxRetries: 0,
    })
  : null;

async function validateLiveContract<TOutput>(options: {
  agent: ImplementedAgentRole;
  outputSchemaName: string;
  schema: z.ZodType<TOutput>;
  input: unknown;
}) {
  if (!provider) {
    throw new Error("Live contract provider is disabled.");
  }

  const result = await provider.generateStructured(
    {
      runId: `phase4-contract-${options.agent.toLowerCase().replaceAll("_", "-")}`,
      agent: options.agent,
      outputSchemaName: options.outputSchemaName,
      inputSummary: `Minimal ${options.agent} contract fixture; raw content omitted from trace`,
      input: options.input,
    },
    options.schema,
  );

  expect(options.schema.safeParse(result.output).success).toBe(true);
  expect(result.trace.provider).toBe("openai");
  expect(result.trace.model).toContain("gpt-5.6");
  expect(result.trace.tokenUsage).toEqual({
    inputTokens: expect.any(Number),
    outputTokens: expect.any(Number),
    totalTokens: expect.any(Number),
  });

  console.info(
    "[phase4-contract-proof]",
    JSON.stringify({
      agent: options.agent,
      requestedModel,
      returnedModel: result.trace.model,
      outputSchemaName: options.outputSchemaName,
      tokenUsage: result.trace.tokenUsage,
      status: result.trace.status,
      schemaPassed: true,
    }),
  );
}

describe.skipIf(!runLive).sequential(
  "Phase 4 finalized GPT-5.6 output contracts",
  () => {
    it(
      "validates Goal Architect once",
      () =>
        validateLiveContract({
          agent: "GOAL_ARCHITECT",
          outputSchemaName: "GoalArchitectOutput",
          schema: GoalArchitectOutputSchema,
          input: {
            goal: "Submit one working Build Week MVP",
            motivation: "Prove the finalized contract",
            targetWindow: "2026-07-20T12:00:00.000Z",
          },
        }),
      120_000,
    );

    it(
      "validates Commitment Recovery once",
      () =>
        validateLiveContract({
          agent: "COMMITMENT_RECOVERY",
          outputSchemaName: "CommitmentRecoveryOutput",
          schema: CommitmentRecoveryOutputSchema,
          input: {
            currentAction: "Run one finalized contract check",
            delayCount: 2,
            observedConstraint: "The previous cloud step took longer than planned",
          },
        }),
      120_000,
    );

    it(
      "validates Memory Curator once",
      () =>
        validateLiveContract({
          agent: "MEMORY_CURATOR",
          outputSchemaName: "MemoryCuratorOutput",
          schema: MemoryCuratorOutputSchema,
          input: {
            candidate: "Use one live call only when each agent contract is finalized",
            sourceType: "CONFIRMED_BY_USER",
          },
        }),
      120_000,
    );

    it(
      "validates Chief of Staff once",
      () =>
        validateLiveContract({
          agent: "CHIEF_OF_STAFF",
          outputSchemaName: "ChiefOfStaffOutput",
          schema: ChiefOfStaffOutputSchema,
          input: {
            context: { currentAction: "Continue Phase 4" },
            dispatchedAgents: [],
            specialistOutputs: {},
          },
        }),
      120_000,
    );
  },
);
