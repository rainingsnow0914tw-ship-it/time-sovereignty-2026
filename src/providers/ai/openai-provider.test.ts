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
  cadence: {
    kind: "PROJECT",
    targetEndAt: "2026-07-21T23:59:00.000Z",
    checkInFrequency: "WEEKDAYS",
    preferredCheckInTime: "19:30",
    reviewFrequencyDays: 7,
    rationale: "Use milestone-scale support until submission is complete.",
    completionSignal: "The submission is complete and verifiable.",
  },
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
  additionalInstructions: "Write human-readable fields in Traditional Chinese.",
  safetyIdentifier: "ts_safe_user_hash",
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
      instructions: expect.stringContaining(
        "Write human-readable fields in Traditional Chinese.",
      ),
      safety_identifier: "ts_safe_user_hash",
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

  it("sends photo evidence as a real Responses image input without storing it", async () => {
    const bodies: unknown[] = [];
    const provider = new OpenAiResponsesProvider({
      parseResponse: async (body) => {
        bodies.push(body);
        return { outputParsed: goalPlan, model: "gpt-5.6-sol", usage: null };
      },
    });

    await provider.generateStructured(
      {
        ...request,
        imageInputs: [
          { dataUrl: "data:image/jpeg;base64,YWJj", detail: "low" },
        ],
      },
      GoalArchitectOutputSchema,
    );

    expect(bodies[0]).toMatchObject({
      input: [
        {
          role: "user",
          content: [
            { type: "input_text" },
            {
              type: "input_image",
              detail: "low",
              image_url: "data:image/jpeg;base64,YWJj",
            },
          ],
        },
      ],
      store: false,
    });
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
      "When a dispatchedAgents array is supplied, copy it exactly",
    );
    expect(instructionsFor("MEMORY_CURATOR")).toContain(
      "never silently change the user's North Star",
    );
  });
});

// A private check-in must not quietly reach the public web, so search is
// opt-in per request. These assertions exist to make an accidental
// always-on search visible: without webSearch the call must stay exactly as
// it has always been - no tools, no reasoning.
describe("OpenAiResponsesProvider web search", () => {
  const baseRequest = {
    runId: "run-search",
    agent: "GOAL_ARCHITECT" as const,
    outputSchemaName: "GoalArchitectOutput",
    inputSummary: "Safe summary",
    input: { question: "低強度的替代運動有哪些" },
  };

  it("sends no tools and no reasoning when search was not requested", async () => {
    let captured: Record<string, unknown> | null = null;
    const provider = new OpenAiResponsesProvider({
      parseResponse: async (body) => {
        captured = body as unknown as Record<string, unknown>;
        return {
          outputParsed: goalPlan,
          model: "gpt-5.6-sol",
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        };
      },
    });

    await provider.generateStructured(baseRequest, GoalArchitectOutputSchema);

    expect(captured).not.toBeNull();
    expect(captured!.tools).toBeUndefined();
    expect(captured!.reasoning).toEqual({ effort: "none" });
  });

  it("enables the web_search tool only when the request asks for it", async () => {
    let captured: Record<string, unknown> | null = null;
    const provider = new OpenAiResponsesProvider({
      parseResponse: async (body) => {
        captured = body as unknown as Record<string, unknown>;
        return {
          outputParsed: goalPlan,
          model: "gpt-5.6-sol",
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        };
      },
    });

    await provider.generateStructured(
      { ...baseRequest, webSearch: {} },
      GoalArchitectOutputSchema,
    );

    expect(captured!.tools).toEqual([{ type: "web_search" }]);
    expect(captured!.reasoning).toEqual({ effort: "low" });
  });

  // The API rejects an integer here with 400 invalid_type; it accepts only
  // "default" or "unlimited". Verified against the live API on 2026-07-21.
  it("passes the return token budget using the words the API accepts", async () => {
    let captured: Record<string, unknown> | null = null;
    const provider = new OpenAiResponsesProvider({
      parseResponse: async (body) => {
        captured = body as unknown as Record<string, unknown>;
        return {
          outputParsed: goalPlan,
          model: "gpt-5.6-sol",
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        };
      },
    });

    await provider.generateStructured(
      { ...baseRequest, webSearch: { returnTokenBudget: "unlimited" } },
      GoalArchitectOutputSchema,
    );

    expect(captured!.tools).toEqual([
      { type: "web_search", return_token_budget: "unlimited" },
    ]);
  });

  it("keeps store false and the safety identifier while searching", async () => {
    let captured: Record<string, unknown> | null = null;
    const provider = new OpenAiResponsesProvider({
      parseResponse: async (body) => {
        captured = body as unknown as Record<string, unknown>;
        return {
          outputParsed: goalPlan,
          model: "gpt-5.6-sol",
          usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
        };
      },
    });

    await provider.generateStructured(
      { ...baseRequest, webSearch: {}, safetyIdentifier: "ts_abc" },
      GoalArchitectOutputSchema,
    );

    expect(captured!.store).toBe(false);
    expect(captured!.safety_identifier).toBe("ts_abc");
  });
});
