import { describe, expect, it } from "vitest";

import { GoalArchitectOutputSchema } from "../../domain/agents/schemas";
import {
  InvalidMockScenarioError,
  MissingMockScenarioError,
  MockAiProvider,
} from "./mock-provider";

const goalPlan = {
  goalSummary: "Ship the recovery-loop MVP",
  motivation: "Protect the Build Week demo without abandoning the thesis",
  targetWindow: "By the final submission deadline",
  feasibilityNotes: ["Complete the vertical slice before optional formats"],
  firstMilestone: "Finish the deterministic foundation",
  bestNextAction: "Implement and test both state machines",
  minimumViableAction: "Write the transition maps",
  initialCheckInProposal: {
    scheduledFor: "2026-07-16T12:00:00.000Z",
    rationale: "Check immediately after the foundation milestone",
  },
  assumptionsNeedingConfirmation: ["Cloud project access is available"],
};

describe("MockAiProvider", () => {
  it("returns deterministic schema-validated output and a safe trace", async () => {
    const times = [
      new Date("2026-07-16T10:00:00.000Z"),
      new Date("2026-07-16T10:00:00.005Z"),
    ];
    const provider = new MockAiProvider(
      { goal_happy_path: goalPlan },
      () => times.shift() ?? new Date("2026-07-16T10:00:00.005Z"),
    );

    const result = await provider.generateStructured(
      {
        runId: "run-1",
        agent: "GOAL_ARCHITECT",
        scenario: "goal_happy_path",
        outputSchemaName: "GoalArchitectOutput",
        inputSummary: "Three onboarding answers; content omitted from trace",
        input: { answers: ["answer-1", "answer-2", "answer-3"] },
      },
      GoalArchitectOutputSchema,
    );

    expect(result.output).toEqual(goalPlan);
    expect(result.trace).toEqual({
      runId: "run-1",
      agent: "GOAL_ARCHITECT",
      provider: "mock",
      model: "mock:goal_happy_path",
      outputSchemaName: "GoalArchitectOutput",
      inputSummary: "Three onboarding answers; content omitted from trace",
      tokenUsage: null,
      status: "COMPLETED",
      startedAt: "2026-07-16T10:00:00.000Z",
      completedAt: "2026-07-16T10:00:00.005Z",
    });
  });

  it("rejects mock fixtures that violate the live output contract", async () => {
    const provider = new MockAiProvider({ broken: { goalSummary: "Only one field" } });

    await expect(
      provider.generateStructured(
        {
          runId: "run-2",
          agent: "GOAL_ARCHITECT",
          scenario: "broken",
          outputSchemaName: "GoalArchitectOutput",
          inputSummary: "Invalid fixture test",
          input: {},
        },
        GoalArchitectOutputSchema,
      ),
    ).rejects.toBeInstanceOf(InvalidMockScenarioError);
  });

  it("fails loudly when a named scenario does not exist", async () => {
    const provider = new MockAiProvider({});

    await expect(
      provider.generateStructured(
        {
          runId: "run-3",
          agent: "GOAL_ARCHITECT",
          scenario: "missing",
          outputSchemaName: "GoalArchitectOutput",
          inputSummary: "Missing fixture test",
          input: {},
        },
        GoalArchitectOutputSchema,
      ),
    ).rejects.toBeInstanceOf(MissingMockScenarioError);
  });
});
