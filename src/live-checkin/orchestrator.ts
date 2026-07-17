import type {
  AgentRunTrace,
  CommitmentRecoveryOutput,
} from "../domain/agents/schemas";
import { CommitmentRecoveryOutputSchema } from "../domain/agents/schemas";
import type { AiProvider } from "../providers/ai/types";
import {
  LiveChiefOfStaffDecisionSchema,
  type LiveCheckInDocument,
  type LiveChiefOfStaffDecision,
} from "./schemas";

export interface LiveCheckInAgentResult {
  recovery: CommitmentRecoveryOutput;
  decision: LiveChiefOfStaffDecision;
  traces: AgentRunTrace[];
}

export async function runLiveCheckInAgents(options: {
  checkIn: LiveCheckInDocument;
  reply: string;
  provider: AiProvider;
  onRecovery: (
    recovery: CommitmentRecoveryOutput,
    trace: AgentRunTrace,
  ) => Promise<void>;
  onDecision: (
    decision: LiveChiefOfStaffDecision,
    trace: AgentRunTrace,
  ) => Promise<void>;
}): Promise<LiveCheckInAgentResult> {
  const { checkIn, reply, provider, onRecovery, onDecision } = options;
  if (!checkIn.replyId) throw new Error("Claimed check-in has no reply id.");

  const traces: AgentRunTrace[] = [];
  let recovery = checkIn.recovery;
  if (!recovery) {
    const recoveryRun = await provider.generateStructured(
      {
        runId: traceId(checkIn.id, checkIn.replyId, "recovery"),
        agent: "COMMITMENT_RECOVERY",
        outputSchemaName: "CommitmentRecoveryOutput",
        inputSummary:
          "Live device reply received; raw reply omitted from persisted trace",
        input: {
          context: checkIn.context,
          userReply: reply,
          instruction:
            "Infer carefully, distinguish hypotheses from facts, and recommend a recovery path without shame.",
        },
      },
      CommitmentRecoveryOutputSchema,
    );
    await onRecovery(recoveryRun.output, recoveryRun.trace);
    recovery = recoveryRun.output;
    traces.push(recoveryRun.trace);
  }

  const chiefRun = await provider.generateStructured(
    {
      runId: traceId(checkIn.id, checkIn.replyId, "chief"),
      agent: "CHIEF_OF_STAFF",
      outputSchemaName: "LiveChiefOfStaffDecision",
      inputSummary:
        "Recovery output and live reply synthesized; raw reply omitted from persisted trace",
      input: {
        context: checkIn.context,
        userReply: reply,
        recovery,
        dispatchedAgents: ["COMMITMENT_RECOVERY"],
        currentTime: new Date().toISOString(),
        instruction:
          "Return one humane, immediately actionable adaptation. The follow-up must be in the future. Memory remains a proposal until confirmation.",
      },
    },
    LiveChiefOfStaffDecisionSchema,
  );
  await onDecision(chiefRun.output, chiefRun.trace);
  traces.push(chiefRun.trace);

  return { recovery, decision: chiefRun.output, traces };
}

function traceId(
  checkInId: string,
  replyId: string,
  role: "recovery" | "chief",
): string {
  const safeCheckInId = checkInId.replace(/[^A-Za-z0-9_-]/gu, "-").slice(0, 80);
  let hash = 2166136261;
  for (const character of replyId) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return `${safeCheckInId}-${role}-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
