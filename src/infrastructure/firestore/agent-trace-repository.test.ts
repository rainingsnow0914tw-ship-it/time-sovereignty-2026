import type { Firestore } from "@google-cloud/firestore";
import { describe, expect, it, vi } from "vitest";

import type { AgentRunTrace } from "../../domain/agents/schemas";
import {
  FirestoreAgentTraceRepository,
  InvalidAgentRunDocumentIdError,
} from "./agent-trace-repository";

const trace: AgentRunTrace = {
  runId: "request-phase4-chief-of-staff",
  agent: "CHIEF_OF_STAFF",
  provider: "openai",
  model: "gpt-5.6-sol",
  outputSchemaName: "ChiefOfStaffOutput",
  inputSummary: "Safe summary only",
  status: "COMPLETED",
  startedAt: "2026-07-16T15:20:00.000Z",
  completedAt: "2026-07-16T15:20:00.100Z",
};

describe("FirestoreAgentTraceRepository", () => {
  it("persists a versioned safe trace in agent_runs", async () => {
    const set = vi.fn(async () => undefined);
    const doc = vi.fn(() => ({ set }));
    const collection = vi.fn(() => ({ doc }));
    const firestore = { collection } as unknown as Firestore;
    const repository = new FirestoreAgentTraceRepository(firestore);

    await repository.save(trace);

    expect(collection).toHaveBeenCalledWith("agent_runs");
    expect(doc).toHaveBeenCalledWith("request-phase4-chief-of-staff");
    expect(set).toHaveBeenCalledWith({ version: 1, ...trace });
  });

  it("rejects run IDs that would change the Firestore document path", async () => {
    const firestore = { collection: vi.fn() } as unknown as Firestore;
    const repository = new FirestoreAgentTraceRepository(firestore);

    await expect(
      repository.save({ ...trace, runId: "request/unsafe" }),
    ).rejects.toBeInstanceOf(InvalidAgentRunDocumentIdError);
  });
});
