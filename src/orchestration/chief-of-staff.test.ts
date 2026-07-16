import { describe, expect, it } from "vitest";

import type { AgentRunTrace } from "../domain/agents/schemas";
import { MockAiProvider } from "../providers/ai/mock-provider";
import {
  InMemoryAgentTraceRepository,
} from "./agent-trace-repository";
import {
  ChiefOfStaffOrchestrator,
  DispatchContractViolationError,
  selectAgentsByNeed,
} from "./chief-of-staff";

const goalPlan = {
  goalSummary: "Ship the Build Week MVP",
  motivation: "Protect time for the work Chloe chose",
  targetWindow: "By submission day",
  feasibilityNotes: ["Keep normal development mock-first"],
  firstMilestone: "Finish four-agent orchestration",
  bestNextAction: "Implement the dispatcher contract",
  minimumViableAction: "Write the need-selection test",
  initialCheckInProposal: {
    scheduledFor: "2026-07-17T02:00:00.000Z",
    rationale: "Review after the dispatcher milestone",
  },
  assumptionsNeedingConfirmation: [],
};

const recovery = {
  possibleReason: "The current action is too large for the available window",
  confidence: 0.78,
  needsClarification: true,
  suggestedQuestion: "Is the task too large, the timing wrong, or the method blocked?",
  strategyCandidates: ["REDUCE", "RESCHEDULE"],
  recommendedFollowUpAt: "2026-07-17T03:00:00.000Z",
};

const memory = {
  proposals: [
    {
      operation: "CREATE",
      memoryId: null,
      kind: "STRATEGY",
      sourceType: "AI_HYPOTHESIS",
      proposedValue: {
        summary: "Smaller actions may restore momentum",
        attributes: [
          { key: "evidence", value: "Observed after infrastructure debugging" },
        ],
      },
      confidence: 0.65,
      rationale: "Keep as a hypothesis until Chloe confirms it",
      requiresUserConfirmation: true,
    },
  ],
  summary: "One tentative strategy memory needs user confirmation.",
};

const baseRequest = {
  requestId: "request-phase4-1",
  inputSummary: "Validated goal and delay signals; raw user text omitted from trace",
  context: { goalId: "goal-1", delayCount: 2 },
  signals: {
    goalPlanRequired: false,
    repeatedDelayDetected: true,
    memoryCandidateCount: 0,
  },
};

function times(count: number): () => Date {
  const values = Array.from(
    { length: count },
    (_, index) => new Date(1_752_720_000_000 + index),
  );
  return () => values.shift() ?? new Date(1_752_720_000_000 + count);
}

describe("ChiefOfStaffOrchestrator", () => {
  it("dispatches only the specialist required by the current signals", async () => {
    const repository = new InMemoryAgentTraceRepository();
    const provider = new MockAiProvider(
      {
        commitment: recovery,
        chief: {
          userMessage: "Let's make the next action smaller before changing the goal.",
          dispatchedAgents: ["COMMITMENT_RECOVERY"],
          selectedStrategy: "REDUCE",
          nextFollowUpAt: "2026-07-17T03:00:00.000Z",
          memoryProposals: [],
        },
      },
      times(4),
    );
    const orchestrator = new ChiefOfStaffOrchestrator(
      provider,
      repository,
      (agent) =>
        agent === "COMMITMENT_RECOVERY" ? "commitment" : "chief",
    );

    const result = await orchestrator.run(baseRequest);

    expect(result.decision.dispatchedAgents).toEqual(["COMMITMENT_RECOVERY"]);
    expect(result.specialistOutputs).toEqual({ commitmentRecovery: recovery });
    expect(result.traces.map((trace) => trace.agent)).toEqual([
      "COMMITMENT_RECOVERY",
      "CHIEF_OF_STAFF",
    ]);
    expect(repository.list()).toEqual(result.traces);
    expect(repository.list()).not.toHaveProperty("0.rawPrompt");
  });

  it("calls all three specialists only when all three needs are present", async () => {
    const repository = new InMemoryAgentTraceRepository();
    const provider = new MockAiProvider(
      {
        goal: goalPlan,
        commitment: recovery,
        memory,
        chief: {
          userMessage: "I prepared a smaller plan and a memory proposal for review.",
          dispatchedAgents: [
            "GOAL_ARCHITECT",
            "COMMITMENT_RECOVERY",
            "MEMORY_CURATOR",
          ],
          selectedStrategy: "REDUCE",
          nextFollowUpAt: "2026-07-17T03:00:00.000Z",
          memoryProposals: memory.proposals,
        },
      },
      times(8),
    );
    const scenarios = {
      GOAL_ARCHITECT: "goal",
      COMMITMENT_RECOVERY: "commitment",
      MEMORY_CURATOR: "memory",
      CHIEF_OF_STAFF: "chief",
    } as const;
    const orchestrator = new ChiefOfStaffOrchestrator(
      provider,
      repository,
      (agent) => scenarios[agent],
    );

    const result = await orchestrator.run({
      ...baseRequest,
      requestId: "request-phase4-all",
      signals: {
        goalPlanRequired: true,
        repeatedDelayDetected: true,
        memoryCandidateCount: 1,
      },
    });

    expect(result.decision.dispatchedAgents).toEqual([
      "GOAL_ARCHITECT",
      "COMMITMENT_RECOVERY",
      "MEMORY_CURATOR",
    ]);
    expect(Object.keys(result.specialistOutputs)).toEqual([
      "goalArchitect",
      "commitmentRecovery",
      "memoryCurator",
    ]);
    expect(repository.list()).toHaveLength(4);
  });

  it("uses no specialist for a general check-in", async () => {
    const repository = new InMemoryAgentTraceRepository();
    const provider = new MockAiProvider(
      {
        chief: {
          userMessage: "You are still on track. What is your next visible step?",
          dispatchedAgents: [],
          selectedStrategy: "CONTINUE",
          nextFollowUpAt: null,
          memoryProposals: [],
        },
      },
      times(2),
    );
    const orchestrator = new ChiefOfStaffOrchestrator(
      provider,
      repository,
      () => "chief",
    );

    const result = await orchestrator.run({
      ...baseRequest,
      requestId: "request-phase4-general",
      signals: {
        goalPlanRequired: false,
        repeatedDelayDetected: false,
        memoryCandidateCount: 0,
      },
    });

    expect(result.decision.dispatchedAgents).toEqual([]);
    expect(result.specialistOutputs).toEqual({});
    expect(result.traces.map((trace) => trace.agent)).toEqual([
      "CHIEF_OF_STAFF",
    ]);
  });

  it("rejects a final decision that misreports the actual dispatch", async () => {
    const repository = new InMemoryAgentTraceRepository();
    const provider = new MockAiProvider(
      {
        commitment: recovery,
        chief: {
          userMessage: "A malformed fixture hides the specialist call.",
          dispatchedAgents: [],
          selectedStrategy: "REDUCE",
          nextFollowUpAt: null,
          memoryProposals: [],
        },
      },
      times(4),
    );
    const orchestrator = new ChiefOfStaffOrchestrator(
      provider,
      repository,
      (agent) =>
        agent === "COMMITMENT_RECOVERY" ? "commitment" : "chief",
    );

    await expect(orchestrator.run(baseRequest)).rejects.toBeInstanceOf(
      DispatchContractViolationError,
    );
  });
});

describe("selectAgentsByNeed", () => {
  it("keeps a stable dispatch order", () => {
    expect(
      selectAgentsByNeed({
        goalPlanRequired: true,
        repeatedDelayDetected: true,
        memoryCandidateCount: 2,
      }),
    ).toEqual([
      "GOAL_ARCHITECT",
      "COMMITMENT_RECOVERY",
      "MEMORY_CURATOR",
    ]);
  });

  it("keeps persisted traces free of extra provider fields", async () => {
    const repository = new InMemoryAgentTraceRepository();
    const trace = {
      runId: "safe-trace-1",
      agent: "CHIEF_OF_STAFF",
      provider: "mock",
      model: "mock:chief",
      outputSchemaName: "ChiefOfStaffOutput",
      inputSummary: "Safe summary",
      status: "COMPLETED",
      startedAt: "2026-07-16T15:00:00.000Z",
      completedAt: "2026-07-16T15:00:00.001Z",
      rawPrompt: "must not persist",
    } as AgentRunTrace & { rawPrompt: string };

    await repository.save(trace);

    expect(repository.list()).toEqual([
      {
        runId: "safe-trace-1",
        agent: "CHIEF_OF_STAFF",
        provider: "mock",
        model: "mock:chief",
        outputSchemaName: "ChiefOfStaffOutput",
        inputSummary: "Safe summary",
        status: "COMPLETED",
        startedAt: "2026-07-16T15:00:00.000Z",
        completedAt: "2026-07-16T15:00:00.001Z",
      },
    ]);
  });
});
