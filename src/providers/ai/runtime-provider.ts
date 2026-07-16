import { z } from "zod";

import type { MemoryProposal, MemoryProposedValue } from "../../domain/memories/schemas";
import {
  selectAgentsByNeed,
  type ChiefOfStaffOrchestrationRequest,
} from "../../orchestration/chief-of-staff";
import { MockAiProvider } from "./mock-provider";
import { OpenAiResponsesProvider } from "./openai-provider";
import type { AiProvider } from "./types";

export const AiProviderModeSchema = z.enum(["mock", "live"]);
export type AiProviderMode = z.infer<typeof AiProviderModeSchema>;

export function readAiProviderMode(
  env: Readonly<Record<string, string | undefined>> = process.env,
): AiProviderMode {
  return AiProviderModeSchema.parse(env.AI_PROVIDER_MODE ?? "mock");
}

export function createRuntimeAiProvider(
  request: ChiefOfStaffOrchestrationRequest,
  options: {
    mode?: AiProviderMode;
    now?: () => Date;
  } = {},
): AiProvider {
  const mode = options.mode ?? readAiProviderMode();
  if (mode === "live") {
    return new OpenAiResponsesProvider({ now: options.now });
  }

  const now = options.now ?? (() => new Date());
  return new MockAiProvider(buildRuntimeMockScenarios(request, now()), now);
}

export function buildRuntimeMockScenarios(
  request: ChiefOfStaffOrchestrationRequest,
  now: Date,
): Readonly<Record<string, unknown>> {
  const goal = stringContext(request.context, "goal", "Continue the chosen goal");
  const motivation = stringContext(
    request.context,
    "motivation",
    "Protect time for the work the user chose",
  );
  const targetWindow = stringContext(
    request.context,
    "targetWindow",
    "At the confirmed target window",
  );
  const currentAction = stringContext(
    request.context,
    "currentAction",
    "Complete the smallest visible next step",
  );
  const memoryCandidate = stringContext(
    request.context,
    "memoryCandidate",
    "A smaller next action may help restore momentum",
  );
  const followUpAt = new Date(now.getTime() + 60 * 60 * 1_000).toISOString();
  const dispatchedAgents = selectAgentsByNeed(request.signals);
  const memoryProposals =
    request.signals.memoryCandidateCount > 0
      ? [memoryProposal(memoryCandidate)]
      : [];

  return {
    GOAL_ARCHITECT: {
      goalSummary: goal,
      motivation,
      targetWindow,
      feasibilityNotes: [
        "This is a deterministic mock plan; live mode uses GPT-5.6.",
      ],
      firstMilestone: currentAction,
      bestNextAction: currentAction,
      minimumViableAction: `Spend ten focused minutes on: ${currentAction}`,
      initialCheckInProposal: {
        scheduledFor: followUpAt,
        rationale: "Review after one focused work interval.",
      },
      assumptionsNeedingConfirmation: [],
    },
    COMMITMENT_RECOVERY: {
      possibleReason: "The current action may be too large for the available window",
      confidence: 0.65,
      needsClarification: true,
      suggestedQuestion: "Is the task too large, the timing wrong, or the method blocked?",
      strategyCandidates: ["REDUCE", "RESCHEDULE"],
      recommendedFollowUpAt: followUpAt,
    },
    MEMORY_CURATOR: {
      proposals: memoryProposals,
      summary:
        memoryProposals.length > 0
          ? "One tentative strategy memory requires user confirmation."
          : "No durable memory change is needed.",
    },
    CHIEF_OF_STAFF: {
      userMessage: request.signals.repeatedDelayDetected
        ? "Let's reduce the next action and check what is actually blocking it."
        : "Let's continue with the smallest visible next action.",
      dispatchedAgents,
      selectedStrategy: request.signals.repeatedDelayDetected
        ? "REDUCE"
        : "CONTINUE",
      nextFollowUpAt: followUpAt,
      memoryProposals,
    },
  };
}

function memoryProposal(summary: string): MemoryProposal {
  const proposedValue: MemoryProposedValue = {
    summary,
    attributes: [
      {
        key: "status",
        value: "Tentative until the user confirms it",
      },
    ],
  };
  return {
    operation: "CREATE",
    memoryId: null,
    kind: "STRATEGY",
    sourceType: "AI_HYPOTHESIS",
    proposedValue,
    confidence: 0.65,
    rationale: "Preserve a potentially useful strategy without treating it as fact.",
    requiresUserConfirmation: true,
  };
}

function stringContext(
  context: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = context[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
