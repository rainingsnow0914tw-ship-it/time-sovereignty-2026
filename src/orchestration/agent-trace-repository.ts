import {
  AgentRunTraceSchema,
  type AgentRunTrace,
} from "../domain/agents/schemas";

export interface AgentTraceRepository {
  save(trace: AgentRunTrace): Promise<void>;
}

export class InMemoryAgentTraceRepository implements AgentTraceRepository {
  private readonly traces: AgentRunTrace[] = [];

  async save(trace: AgentRunTrace): Promise<void> {
    this.traces.push(AgentRunTraceSchema.parse(structuredClone(trace)));
  }

  list(): AgentRunTrace[] {
    return structuredClone(this.traces);
  }
}
