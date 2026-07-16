import type { z } from "zod";

import type { AiProvider, AgentRunResult, StructuredAgentRequest } from "./types";

export class MissingMockScenarioError extends Error {
  constructor(scenario: string) {
    super(`No deterministic mock scenario is registered for: ${scenario}`);
    this.name = "MissingMockScenarioError";
  }
}

export class InvalidMockScenarioError extends Error {
  constructor(scenario: string, details: string) {
    super(`Mock scenario ${scenario} failed output validation: ${details}`);
    this.name = "InvalidMockScenarioError";
  }
}

export class MockAiProvider implements AiProvider {
  constructor(
    private readonly scenarios: Readonly<Record<string, unknown>>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async generateStructured<TInput, TOutput>(
    request: StructuredAgentRequest<TInput>,
    outputSchema: z.ZodType<TOutput>,
  ): Promise<AgentRunResult<TOutput>> {
    const startedAt = this.now().toISOString();
    const scenario = request.scenario ?? request.agent;

    if (!Object.hasOwn(this.scenarios, scenario)) {
      throw new MissingMockScenarioError(scenario);
    }

    const parsed = outputSchema.safeParse(structuredClone(this.scenarios[scenario]));

    if (!parsed.success) {
      throw new InvalidMockScenarioError(
        scenario,
        parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
          .join("; "),
      );
    }

    const completedAt = this.now().toISOString();

    return {
      output: parsed.data,
      trace: {
        runId: request.runId,
        agent: request.agent,
        provider: "mock",
        model: `mock:${scenario}`,
        outputSchemaName: request.outputSchemaName,
        inputSummary: request.inputSummary,
        tokenUsage: null,
        status: "COMPLETED",
        startedAt,
        completedAt,
      },
    };
  }
}
