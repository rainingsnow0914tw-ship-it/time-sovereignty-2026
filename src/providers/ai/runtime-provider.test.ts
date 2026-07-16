import { describe, expect, it } from "vitest";

import { InMemoryAgentTraceRepository } from "../../orchestration/agent-trace-repository";
import { ChiefOfStaffOrchestrator } from "../../orchestration/chief-of-staff";
import {
  createRuntimeAiProvider,
  readAiProviderMode,
} from "./runtime-provider";

const request = {
  requestId: "runtime-mock-1",
  inputSummary: "Validated runtime proof context; raw text omitted from trace",
  context: {
    goal: "Ship Time Sovereignty",
    motivation: "Protect chosen work",
    targetWindow: "Build Week deadline",
    currentAction: "Complete the Phase 4 proof",
    memoryCandidate: "Small deterministic slices help after cloud debugging",
  },
  signals: {
    goalPlanRequired: true,
    repeatedDelayDetected: true,
    memoryCandidateCount: 1,
  },
};

describe("runtime AI provider", () => {
  it("defaults to mock mode when no deployment mode is configured", () => {
    expect(readAiProviderMode({})).toBe("mock");
    expect(readAiProviderMode({ AI_PROVIDER_MODE: "live" })).toBe("live");
  });

  it("runs all four roles through the same orchestration contract in mock mode", async () => {
    const now = new Date("2026-07-16T15:40:00.000Z");
    const traces = new InMemoryAgentTraceRepository();
    const orchestrator = new ChiefOfStaffOrchestrator(
      createRuntimeAiProvider(request, { mode: "mock", now: () => now }),
      traces,
    );

    const result = await orchestrator.run(request);

    expect(result.decision.dispatchedAgents).toEqual([
      "GOAL_ARCHITECT",
      "COMMITMENT_RECOVERY",
      "MEMORY_CURATOR",
    ]);
    expect(result.traces.map((trace) => trace.agent)).toEqual([
      "GOAL_ARCHITECT",
      "COMMITMENT_RECOVERY",
      "MEMORY_CURATOR",
      "CHIEF_OF_STAFF",
    ]);
    expect(result.traces.every((trace) => trace.provider === "mock")).toBe(true);
  });
});
