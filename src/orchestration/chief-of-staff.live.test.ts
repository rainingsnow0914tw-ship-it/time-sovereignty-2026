import { loadEnvConfig } from "@next/env";
import { describe, expect, it } from "vitest";

import { OpenAiResponsesProvider } from "../providers/ai/openai-provider";
import { InMemoryAgentTraceRepository } from "./agent-trace-repository";
import { ChiefOfStaffOrchestrator } from "./chief-of-staff";

loadEnvConfig(process.cwd(), true);

const runLive = process.env.RUN_PHASE4_LIVE === "1";

describe.skipIf(!runLive)("Phase 4 live GPT-5.6 acceptance", () => {
  it(
    "runs the Chief of Staff and all three real specialists through Responses API",
    async () => {
      const repository = new InMemoryAgentTraceRepository();
      const orchestrator = new ChiefOfStaffOrchestrator(
        new OpenAiResponsesProvider(),
        repository,
      );

      const result = await orchestrator.run({
        requestId: "phase4-live-20260716",
        inputSummary:
          "Build Week goal, repeated delay, and one tentative memory candidate; raw wording omitted from trace",
        context: {
          goal: "Ship a trustworthy Time Sovereignty MVP for OpenAI Build Week",
          motivation:
            "Demonstrate a longitudinal Chief of Staff, not a one-turn chatbot",
          targetWindow: "OpenAI Build Week submission deadline",
          currentAction: "Complete Phase 4 four-agent orchestration",
          delayCount: 2,
          observedConstraint: "Cloud integration work took longer than planned",
          memoryCandidate:
            "A smaller deterministic slice helps restore momentum after infrastructure debugging",
        },
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
      expect(result.traces.map((trace) => trace.agent)).toEqual([
        "GOAL_ARCHITECT",
        "COMMITMENT_RECOVERY",
        "MEMORY_CURATOR",
        "CHIEF_OF_STAFF",
      ]);
      expect(result.traces.every((trace) => trace.provider === "openai")).toBe(
        true,
      );
      expect(result.traces.every((trace) => trace.model.includes("gpt-5.6"))).toBe(
        true,
      );
      expect(repository.list()).toEqual(result.traces);

      console.info(
        "[phase4-live-proof]",
        JSON.stringify({
          dispatchedAgents: result.decision.dispatchedAgents,
          traces: result.traces.map((trace) => ({
            runId: trace.runId,
            agent: trace.agent,
            model: trace.model,
            outputSchemaName: trace.outputSchemaName,
            status: trace.status,
          })),
        }),
      );
    },
    180_000,
  );
});
