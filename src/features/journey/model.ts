import { z } from "zod";

import {
  AgentRunTraceSchema,
  type AgentRunTrace,
  type ImplementedAgentRole,
} from "../../domain/agents/schemas";
import { InterventionStateSchema } from "../../domain/interventions/schemas";
import type { LocalOnboardingRecord } from "../../repositories/local-onboarding-repository";

export const JourneyViewSchema = z.enum([
  "TODAY",
  "CHECK_IN",
  "PROGRESS",
  "JOURNEY",
  "DEVELOPER",
]);

export const JourneyEventKindSchema = z.enum([
  "GOAL_CREATED",
  "SUPPORT_CONFIRMED",
  "CHECK_IN",
  "DELAY",
  "RECOVERY",
  "PROGRESS",
  "FEEDBACK",
  "MEMORY",
  "RESUME_POINT",
  "CALIBRATION",
]);

export const ProgressEvidenceSchema = z
  .object({
    id: z.string().trim().min(1).max(128),
    format: z.enum(["TEXT", "PHOTO", "VOICE"]),
    summary: z.string().trim().min(1).max(2_000),
    assetName: z.string().trim().min(1).max(240).nullable(),
    assetDataUrl: z.string().nullable(),
    feedback: z.string().trim().min(1).max(2_000),
    simulatedDay: z.number().int().min(1).max(30),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const JourneyEventSchema = z
  .object({
    id: z.string().trim().min(1).max(128),
    kind: JourneyEventKindSchema,
    title: z.string().trim().min(1).max(240),
    detail: z.string().trim().min(1).max(2_000),
    simulatedDay: z.number().int().min(1).max(30),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const JourneyMemorySchema = z
  .object({
    id: z.string().trim().min(1).max(128),
    kind: z.enum(["NORTH_STAR", "STRATEGY", "PROGRESS", "CALIBRATION"]),
    summary: z.string().trim().min(1).max(2_000),
    sourceType: z.enum([
      "CONFIRMED_BY_USER",
      "OBSERVED_PATTERN",
      "AI_HYPOTHESIS",
    ]),
    requiresConfirmation: z.boolean(),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const ResumePointSchema = z
  .object({
    task: z.string().trim().min(1).max(1_000),
    lastCompletedCheckpoint: z.string().trim().min(1).max(1_000),
    currentBlocker: z.string().trim().min(1).max(1_000).nullable(),
    nextPhysicalAction: z.string().trim().min(1).max(1_000),
    relatedContext: z.array(z.string().trim().min(1).max(500)).max(8),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const JourneyEffectivenessSchema = z
  .object({
    id: z.string().trim().min(1).max(128),
    interventionId: z.string().trim().min(1).max(128),
    rating: z.number().int().min(1).max(5),
    sentiment: z.enum(["HELPED", "NEUTRAL", "PRESSURED", "ANNOYED"]),
    note: z.string().trim().max(1_000),
    recordedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const JourneyStateSchema = z
  .object({
    version: z.literal(1),
    activeView: JourneyViewSchema,
    simulatedDay: z.number().int().min(1).max(30),
    simulationComplete: z.boolean(),
    interventionId: z.string().trim().min(1).max(128),
    interventionState: InterventionStateSchema,
    delayCount: z.number().int().nonnegative(),
    currentAction: z.string().trim().min(1).max(1_000),
    minimumAction: z.string().trim().min(1).max(1_000),
    nextCheckAt: z.string().datetime({ offset: true }),
    latestFeedback: z.string().trim().max(2_000),
    resumePoint: ResumePointSchema,
    progress: z.array(ProgressEvidenceSchema).max(50),
    memories: z.array(JourneyMemorySchema).max(50),
    effectiveness: z.array(JourneyEffectivenessSchema).max(50),
    events: z.array(JourneyEventSchema).max(200),
    agentTraces: z.array(AgentRunTraceSchema).max(200),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export type JourneyView = z.infer<typeof JourneyViewSchema>;
export type JourneyEventKind = z.infer<typeof JourneyEventKindSchema>;
export type ProgressEvidence = z.infer<typeof ProgressEvidenceSchema>;
export type JourneyEvent = z.infer<typeof JourneyEventSchema>;
export type JourneyMemory = z.infer<typeof JourneyMemorySchema>;
export type JourneyState = z.infer<typeof JourneyStateSchema>;

export function createInitialJourneyState(
  record: LocalOnboardingRecord,
): JourneyState {
  const timestamp = record.savedAt;
  return JourneyStateSchema.parse({
    version: 1,
    activeView: "TODAY",
    simulatedDay: 1,
    simulationComplete: false,
    interventionId: `check-in-${record.action.id}`,
    interventionState: "DUE",
    delayCount: 0,
    currentAction: record.action.title,
    minimumAction: record.action.minimumVersion,
    nextCheckAt: record.action.nextCheckAt ?? timestamp,
    latestFeedback: "",
    resumePoint: {
      task: record.action.title,
      lastCompletedCheckpoint: "Goal and support agreement confirmed",
      currentBlocker: null,
      nextPhysicalAction: record.action.minimumVersion,
      relatedContext: [record.plan.firstMilestone],
      updatedAt: timestamp,
    },
    progress: [],
    memories: [
      {
        id: `north-star-${record.goal.id}`,
        kind: "NORTH_STAR",
        summary: `${record.goal.title} — ${record.goal.motivation}`,
        sourceType: "CONFIRMED_BY_USER",
        requiresConfirmation: false,
        updatedAt: timestamp,
      },
    ],
    effectiveness: [],
    events: [
      journeyEvent("GOAL_CREATED", "Goal created", record.goal.title, 1, timestamp),
      journeyEvent(
        "SUPPORT_CONFIRMED",
        "Support agreement confirmed",
        `${record.supportAgreement.interventionIntensity.toLowerCase()} support at ${record.supportAgreement.preferredCheckInTime}`,
        1,
        timestamp,
      ),
    ],
    agentTraces: [record.agentTrace],
    updatedAt: timestamp,
  });
}

export function addJourneyEvent(
  state: JourneyState,
  options: {
    kind: JourneyEventKind;
    title: string;
    detail: string;
    now?: Date;
  },
): JourneyState {
  const now = options.now ?? new Date();
  const timestamp = now.toISOString();
  return JourneyStateSchema.parse({
    ...state,
    events: [
      ...state.events,
      journeyEvent(
        options.kind,
        options.title,
        options.detail,
        state.simulatedDay,
        timestamp,
      ),
    ],
    updatedAt: timestamp,
  });
}

export function addAgentTrace(
  state: JourneyState,
  agent: ImplementedAgentRole,
  outputSchemaName: string,
  inputSummary: string,
  now = new Date(),
): JourneyState {
  return JourneyStateSchema.parse({
    ...state,
    agentTraces: [
      ...state.agentTraces,
      safeMockTrace(agent, outputSchemaName, inputSummary, state.simulatedDay, now),
    ],
    updatedAt: now.toISOString(),
  });
}

export function advanceSimulation(
  state: JourneyState,
  record: LocalOnboardingRecord,
  now = new Date(),
): JourneyState {
  const milestones = [2, 3, 4, 5, 8, 14, 30];
  const nextDay = milestones.find((day) => day > state.simulatedDay);
  if (!nextDay) return state;

  const timestamp = now.toISOString();
  let next: JourneyState = JourneyStateSchema.parse({
    ...state,
    simulatedDay: nextDay,
    updatedAt: timestamp,
  });

  if (nextDay === 2) {
    next = addJourneyEvent(next, {
      kind: "CHECK_IN",
      title: "First protected check-in",
      detail: `Time to continue: ${next.currentAction}`,
      now,
    });
    return addAgentTrace(
      next,
      "CHIEF_OF_STAFF",
      "ChiefOfStaffOutput",
      "Simulated Day 2 check-in; private context omitted",
      now,
    );
  }

  if (nextDay === 3) {
    next = JourneyStateSchema.parse({
      ...next,
      delayCount: 1,
      interventionState: "SCHEDULED",
    });
    return addJourneyEvent(next, {
      kind: "DELAY",
      title: "One delay accepted",
      detail: "The check-in moved without judgment because real life interrupted.",
      now,
    });
  }

  if (nextDay === 4) {
    next = JourneyStateSchema.parse({
      ...next,
      delayCount: 2,
      interventionState: "ADAPTING",
    });
    next = addJourneyEvent(next, {
      kind: "RECOVERY",
      title: "Repeated-delay pattern detected",
      detail: "Commitment Recovery asks whether timing, task size, method, or direction is wrong.",
      now,
    });
    next = addAgentTrace(
      next,
      "COMMITMENT_RECOVERY",
      "CommitmentRecoveryOutput",
      "Two delays detected; private wording omitted",
      now,
    );
    return addAgentTrace(
      next,
      "CHIEF_OF_STAFF",
      "ChiefOfStaffOutput",
      "Recovery synthesis after repeated delay",
      now,
    );
  }

  if (nextDay === 5) {
    const memory: JourneyMemory = {
      id: `strategy-day-5-${record.goal.id}`,
      kind: "STRATEGY",
      summary: "Reducing the action restored continuity after the original plan no longer fit the available window.",
      sourceType: "OBSERVED_PATTERN",
      requiresConfirmation: true,
      updatedAt: timestamp,
    };
    next = JourneyStateSchema.parse({
      ...next,
      currentAction: record.action.minimumVersion,
      interventionState: "CONFIRMED",
      memories: [...next.memories, memory],
      resumePoint: {
        ...next.resumePoint,
        currentBlocker: "The original action did not fit the available window",
        nextPhysicalAction: record.action.minimumVersion,
        updatedAt: timestamp,
      },
    });
    next = addJourneyEvent(next, {
      kind: "RECOVERY",
      title: "Action resized",
      detail: `The protected minimum is now: ${record.action.minimumVersion}`,
      now,
    });
    next = addJourneyEvent(next, {
      kind: "MEMORY",
      title: "Strategy proposed for memory",
      detail: memory.summary,
      now,
    });
    next = addAgentTrace(
      next,
      "MEMORY_CURATOR",
      "MemoryCuratorOutput",
      "Observed recovery strategy; confirmation still required",
      now,
    );
    return addAgentTrace(
      next,
      "CHIEF_OF_STAFF",
      "ChiefOfStaffOutput",
      "Confirmed a smaller next commitment",
      now,
    );
  }

  if (nextDay === 8) {
    const feedback =
      "You protected continuity by completing the smaller action. The evidence matters because it shows the plan survived a high-pressure day.";
    next = JourneyStateSchema.parse({
      ...next,
      progress: [
        ...next.progress,
        {
          id: `simulated-progress-day-8-${record.goal.id}`,
          format: "VOICE",
          summary: "Completed the protected minimum and shared a short voice update.",
          assetName: "simulated-voice-update",
          assetDataUrl: null,
          feedback,
          simulatedDay: 8,
          createdAt: timestamp,
        },
      ],
      latestFeedback: feedback,
      interventionState: "CLOSED",
      effectiveness: [
        ...next.effectiveness,
        {
          id: `effectiveness-day-8-${record.goal.id}`,
          interventionId: next.interventionId,
          rating: 4,
          sentiment: "HELPED",
          note: "The smaller action made continuation possible.",
          recordedAt: timestamp,
        },
      ],
    });
    next = addJourneyEvent(next, {
      kind: "PROGRESS",
      title: "Voice progress shared",
      detail: "The protected minimum was completed.",
      now,
    });
    return addJourneyEvent(next, {
      kind: "FEEDBACK",
      title: "Specific feedback returned",
      detail: feedback,
      now,
    });
  }

  if (nextDay === 14) {
    next = JourneyStateSchema.parse({
      ...next,
      memories: [
        ...next.memories,
        {
          id: `calibration-day-14-${record.goal.id}`,
          kind: "CALIBRATION",
          summary: `The North Star still fits: ${record.goal.title}. The current practice method can change without discarding the deeper direction.`,
          sourceType: "CONFIRMED_BY_USER",
          requiresConfirmation: false,
          updatedAt: timestamp,
        },
      ],
    });
    return addJourneyEvent(next, {
      kind: "CALIBRATION",
      title: "Goal calibration",
      detail: "North Star retained; the current goal and practice method were recalibrated around real constraints.",
      now,
    });
  }

  next = JourneyStateSchema.parse({
    ...next,
    simulationComplete: true,
  });
  return addJourneyEvent(next, {
    kind: "RESUME_POINT",
    title: "Thirty-day continuity visible",
    detail: "The journey connects planning, interruption, adaptation, evidence, memory, and continuation.",
    now,
  });
}

export function isWithinQuietHours(
  start: string,
  end: string,
  date = new Date(),
): boolean {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return minutes >= startMinutes && minutes < endMinutes;
  }
  return minutes >= startMinutes || minutes < endMinutes;
}

function journeyEvent(
  kind: JourneyEventKind,
  title: string,
  detail: string,
  simulatedDay: number,
  createdAt: string,
): JourneyEvent {
  return {
    id: `${kind.toLowerCase()}-${simulatedDay}-${createdAt.replaceAll(/[^0-9]/gu, "").slice(-14)}`,
    kind,
    title,
    detail,
    simulatedDay,
    createdAt,
  };
}

function safeMockTrace(
  agent: ImplementedAgentRole,
  outputSchemaName: string,
  inputSummary: string,
  simulatedDay: number,
  now: Date,
): AgentRunTrace {
  const startedAt = now.toISOString();
  const completedAt = new Date(now.getTime() + 1).toISOString();
  return AgentRunTraceSchema.parse({
    runId: `simulation-day-${simulatedDay}-${agent.toLowerCase().replaceAll("_", "-")}-${now.getTime()}`,
    agent,
    provider: "mock",
    model: `mock:simulation-day-${simulatedDay}`,
    outputSchemaName,
    inputSummary,
    tokenUsage: null,
    status: "COMPLETED",
    startedAt,
    completedAt,
  });
}
