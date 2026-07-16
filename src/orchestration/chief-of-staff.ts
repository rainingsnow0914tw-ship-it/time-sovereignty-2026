import { z } from "zod";

import {
  AgentRunTraceSchema,
  ChiefOfStaffOutputSchema,
  CommitmentRecoveryOutputSchema,
  GoalArchitectOutputSchema,
  MemoryCuratorOutputSchema,
  type AgentRunTrace,
  type ChiefOfStaffOutput,
  type CommitmentRecoveryOutput,
  type GoalArchitectOutput,
  type ImplementedAgentRole,
  type MemoryCuratorOutput,
  type SubAgentRole,
} from "../domain/agents/schemas";
import type { AiProvider } from "../providers/ai/types";
import type { AgentTraceRepository } from "./agent-trace-repository";

export const OrchestrationSignalsSchema = z
  .object({
    goalPlanRequired: z.boolean(),
    repeatedDelayDetected: z.boolean(),
    memoryCandidateCount: z.number().int().min(0).max(20),
  })
  .strict();

export const ChiefOfStaffOrchestrationRequestSchema = z
  .object({
    requestId: z.string().trim().min(1).max(64),
    inputSummary: z.string().trim().min(1).max(700),
    context: z.record(z.string(), z.unknown()),
    signals: OrchestrationSignalsSchema,
  })
  .strict();

export type ChiefOfStaffOrchestrationRequest = z.infer<
  typeof ChiefOfStaffOrchestrationRequestSchema
>;

export interface SpecialistOutputs {
  goalArchitect?: GoalArchitectOutput;
  commitmentRecovery?: CommitmentRecoveryOutput;
  memoryCurator?: MemoryCuratorOutput;
}

export interface ChiefOfStaffOrchestrationResult {
  decision: ChiefOfStaffOutput;
  specialistOutputs: SpecialistOutputs;
  traces: AgentRunTrace[];
}

export type AgentScenarioResolver = (
  agent: ImplementedAgentRole,
  request: ChiefOfStaffOrchestrationRequest,
) => string | undefined;

export class DispatchContractViolationError extends Error {
  constructor(expected: SubAgentRole[], actual: SubAgentRole[]) {
    super(
      `Chief of Staff dispatch mismatch: expected ${expected.join(",") || "none"}; received ${actual.join(",") || "none"}`,
    );
    this.name = "DispatchContractViolationError";
  }
}

export function selectAgentsByNeed(
  signals: z.infer<typeof OrchestrationSignalsSchema>,
): SubAgentRole[] {
  const selected: SubAgentRole[] = [];

  if (signals.goalPlanRequired) {
    selected.push("GOAL_ARCHITECT");
  }

  if (signals.repeatedDelayDetected) {
    selected.push("COMMITMENT_RECOVERY");
  }

  if (signals.memoryCandidateCount > 0) {
    selected.push("MEMORY_CURATOR");
  }

  return selected;
}

export class ChiefOfStaffOrchestrator {
  constructor(
    private readonly provider: AiProvider,
    private readonly traceRepository: AgentTraceRepository,
    private readonly resolveScenario: AgentScenarioResolver = () => undefined,
  ) {}

  async run(
    rawRequest: ChiefOfStaffOrchestrationRequest,
  ): Promise<ChiefOfStaffOrchestrationResult> {
    const request = ChiefOfStaffOrchestrationRequestSchema.parse(rawRequest);
    const dispatchedAgents = selectAgentsByNeed(request.signals);
    const specialistOutputs: SpecialistOutputs = {};
    const traces: AgentRunTrace[] = [];

    for (const agent of dispatchedAgents) {
      if (agent === "GOAL_ARCHITECT") {
        const result = await this.provider.generateStructured(
          this.buildAgentRequest(request, agent),
          GoalArchitectOutputSchema,
        );
        specialistOutputs.goalArchitect = result.output;
        traces.push(await this.saveSafeTrace(result.trace));
      }

      if (agent === "COMMITMENT_RECOVERY") {
        const result = await this.provider.generateStructured(
          this.buildAgentRequest(request, agent),
          CommitmentRecoveryOutputSchema,
        );
        specialistOutputs.commitmentRecovery = result.output;
        traces.push(await this.saveSafeTrace(result.trace));
      }

      if (agent === "MEMORY_CURATOR") {
        const result = await this.provider.generateStructured(
          this.buildAgentRequest(request, agent),
          MemoryCuratorOutputSchema,
        );
        specialistOutputs.memoryCurator = result.output;
        traces.push(await this.saveSafeTrace(result.trace));
      }
    }

    const chiefResult = await this.provider.generateStructured(
      {
        runId: this.runId(request.requestId, "CHIEF_OF_STAFF"),
        agent: "CHIEF_OF_STAFF",
        scenario: this.resolveScenario("CHIEF_OF_STAFF", request),
        outputSchemaName: "ChiefOfStaffOutput",
        inputSummary: `${request.inputSummary}; ${dispatchedAgents.length} specialist agent(s) selected by policy.`,
        input: {
          context: request.context,
          signals: request.signals,
          dispatchedAgents,
          specialistOutputs,
        },
      },
      ChiefOfStaffOutputSchema,
    );
    traces.push(await this.saveSafeTrace(chiefResult.trace));

    if (!sameAgents(dispatchedAgents, chiefResult.output.dispatchedAgents)) {
      throw new DispatchContractViolationError(
        dispatchedAgents,
        chiefResult.output.dispatchedAgents,
      );
    }

    return {
      decision: chiefResult.output,
      specialistOutputs,
      traces,
    };
  }

  private buildAgentRequest(
    request: ChiefOfStaffOrchestrationRequest,
    agent: SubAgentRole,
  ) {
    return {
      runId: this.runId(request.requestId, agent),
      agent,
      scenario: this.resolveScenario(agent, request),
      outputSchemaName: outputSchemaName(agent),
      inputSummary: `${request.inputSummary}; ${agent} selected by policy.`,
      input: {
        context: request.context,
        signals: request.signals,
      },
    };
  }

  private runId(requestId: string, agent: ImplementedAgentRole): string {
    return `${requestId}-${agent.toLowerCase().replaceAll("_", "-")}`;
  }

  private async saveSafeTrace(trace: AgentRunTrace): Promise<AgentRunTrace> {
    const safeTrace = AgentRunTraceSchema.parse(trace);
    await this.traceRepository.save(safeTrace);
    return safeTrace;
  }
}

function outputSchemaName(agent: SubAgentRole): string {
  if (agent === "GOAL_ARCHITECT") {
    return "GoalArchitectOutput";
  }

  if (agent === "COMMITMENT_RECOVERY") {
    return "CommitmentRecoveryOutput";
  }

  return "MemoryCuratorOutput";
}

function sameAgents(expected: SubAgentRole[], actual: SubAgentRole[]): boolean {
  return (
    expected.length === actual.length &&
    expected.every((agent, index) => agent === actual[index])
  );
}
