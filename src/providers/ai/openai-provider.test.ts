import { describe, expect, it, vi } from "vitest";

import { GoalArchitectOutputSchema } from "../../domain/agents/schemas";
import {
  DEFAULT_OPENAI_MAX_RETRIES,
  MissingOpenAiStructuredOutputError,
  OpenAiResponsesProvider,
  instructionsFor,
  type OpenAiResponseParser,
} from "./openai-provider";

const goalPlan = {
  goalSummary: "Ship the Build Week MVP",
  motivation: "Protect time for chosen work",
  targetWindow: "By submission day",
  feasibilityNotes: ["Keep optional formats behind the core loop"],
  firstMilestone: "Finish live provider parity",
  bestNextAction: "Implement the Responses API adapter",
  minimumViableAction: "Validate one structured response",
  initialCheckInProposal: {
    scheduledFor: "2026-07-17T02:00:00.000Z",
    rationale: "Review after provider verification",
  },
  assumptionsNeedingConfirmation: [],
};

const request = {
  runId: "openai-run-1",
  agent: "GOAL_ARCHITECT" as const,
  outputSchemaName: "GoalArchitectOutput",
  inputSummary: "Validated onboarding context; raw answers omitted from trace",
  input: { goal: "Build Week", targetWindow: "submission day" },
};

describe("OpenAiResponsesProvider", () => {
  it("disables SDK automatic retries by default for cost-bounded live execution", () => {
    expect(DEFAULT_OPENAI_MAX_RETRIES).toBe(0);
  });

  it("uses Responses structured output and returns the shared provider contract", async () => {
    const bodies: unknown[] = [];
    const parseResponse: OpenAiResponseParser = vi.fn(async (body) => {
      bodies.push(body);
      return {
        outputParsed: goalPlan,
        model: "gpt-5.6-sol",
        usage: { inputTokens: 101, outputTokens: 202, totalTokens: 303 },
      };
    });
    const times = [
      new Date("2026-07-16T15:10:00.000Z"),
      new Date("2026-07-16T15:10:00.010Z"),
    ];
    const provider = new OpenAiResponsesProvider({
      model: "gpt-5.6",
      parseResponse,
      now: () => times.shift() ?? new Date("2026-07-16T15:10:00.010Z"),
    });

    const result = await provider.generateStructured(
      request,
      GoalArchitectOutputSchema,
    );

    expect(result.output).toEqual(goalPlan);
    expect(result.trace).toEqual({
      runId: "openai-run-1",
      agent: "GOAL_ARCHITECT",
      provider: "openai",
      model: "gpt-5.6-sol",
      outputSchemaName: "GoalArchitectOutput",
      inputSummary: "Validated onboarding context; raw answers omitted from trace",
      tokenUsage: { inputTokens: 101, outputTokens: 202, totalTokens: 303 },
      status: "COMPLETED",
      startedAt: "2026-07-16T15:10:00.000Z",
      completedAt: "2026-07-16T15:10:00.010Z",
    });
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({
      model: "gpt-5.6",
      reasoning: { effort: "none" },
      max_output_tokens: 2_000,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "GoalArchitectOutput",
          strict: true,
        },
      },
    });
  });

  it("validates parsed output again at the shared Zod boundary", async () => {
    const provider = new OpenAiResponsesProvider({
      parseResponse: async () => ({
        outputParsed: { goalSummary: "missing required fields" },
        model: "gpt-5.6-sol",
        usage: null,
      }),
    });

    await expect(
      provider.generateStructured(request, GoalArchitectOutputSchema),
    ).rejects.toThrow();
  });

  it("fails safely when the API produces no parsed output", async () => {
    const provider = new OpenAiResponsesProvider({
      parseResponse: async () => ({
        outputParsed: null,
        model: "gpt-5.6-sol",
        usage: null,
      }),
    });

    await expect(
      provider.generateStructured(request, GoalArchitectOutputSchema),
    ).rejects.toBeInstanceOf(MissingOpenAiStructuredOutputError);
  });

  it("gives the Chief of Staff an explicit dispatch-truth constraint", () => {
    expect(instructionsFor("CHIEF_OF_STAFF")).toContain(
      "Copy the supplied dispatchedAgents array exactly",
    );
    expect(instructionsFor("MEMORY_CURATOR")).toContain(
      "never silently change the user's North Star",
    );
  });
});
