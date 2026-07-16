import { Firestore } from "@google-cloud/firestore";
import { z } from "zod";

import {
  AgentRunTraceSchema,
  type AgentRunTrace,
} from "../../domain/agents/schemas";
import type { AgentTraceRepository } from "../../orchestration/agent-trace-repository";
import type { CloudConfig } from "../gcp/config";

export const PersistedAgentRunSchema = AgentRunTraceSchema.extend({
  version: z.literal(1),
}).strict();

export type PersistedAgentRun = z.infer<typeof PersistedAgentRunSchema>;

export class InvalidAgentRunDocumentIdError extends Error {
  constructor(runId: string) {
    super(`Agent run ID cannot be used as a Firestore document ID: ${runId}`);
    this.name = "InvalidAgentRunDocumentIdError";
  }
}

export class FirestoreAgentTraceRepository implements AgentTraceRepository {
  constructor(private readonly firestore: Firestore) {}

  async save(rawTrace: AgentRunTrace): Promise<void> {
    const trace = AgentRunTraceSchema.parse(rawTrace);
    if (trace.runId.includes("/")) {
      throw new InvalidAgentRunDocumentIdError(trace.runId);
    }

    const document = PersistedAgentRunSchema.parse({
      version: 1,
      ...trace,
    });
    await this.firestore.collection("agent_runs").doc(trace.runId).set(document);
  }
}

let sharedFirestore: Firestore | null = null;

export function createFirestoreAgentTraceRepository(
  config: CloudConfig,
): FirestoreAgentTraceRepository {
  if (!sharedFirestore) {
    sharedFirestore = new Firestore({
      projectId: config.projectId,
      databaseId: config.firestoreDatabaseId,
    });
  }

  return new FirestoreAgentTraceRepository(sharedFirestore);
}
