import {
  InterventionSchema,
  type Intervention,
  type InterventionState,
} from "../interventions/schemas";
import { toIsoDateTime } from "../shared";
import { DomainInvariantError, InvalidTransitionError } from "./errors";

export const INTERVENTION_TRANSITIONS = {
  SCHEDULED: ["DUE", "CANCELLED", "FAILED"],
  DUE: ["DELIVERED", "CANCELLED", "FAILED"],
  DELIVERED: ["USER_RESPONDED", "CLOSED", "CANCELLED", "FAILED"],
  USER_RESPONDED: [
    "ADAPTING",
    "RESCHEDULED",
    "CONFIRMED",
    "CLOSED",
    "FAILED",
  ],
  ADAPTING: ["RESCHEDULED", "CONFIRMED", "CLOSED", "FAILED"],
  RESCHEDULED: ["SCHEDULED", "CANCELLED", "FAILED"],
  CONFIRMED: ["CLOSED", "FAILED"],
  CLOSED: [],
  FAILED: [],
  CANCELLED: [],
} as const satisfies Record<InterventionState, readonly InterventionState[]>;

export const TERMINAL_INTERVENTION_STATES = [
  "CLOSED",
  "FAILED",
  "CANCELLED",
] as const satisfies readonly InterventionState[];

export function canTransitionIntervention(
  from: InterventionState,
  to: InterventionState,
): boolean {
  return (
    INTERVENTION_TRANSITIONS[from] as readonly InterventionState[]
  ).includes(to);
}

export function transitionIntervention(
  intervention: Intervention,
  to: InterventionState,
  at: Date,
): Intervention {
  if (!canTransitionIntervention(intervention.state, to)) {
    throw new InvalidTransitionError("intervention", intervention.state, to);
  }

  return {
    ...intervention,
    state: to,
    updatedAt: toIsoDateTime(at),
  };
}

export function isActiveIntervention(intervention: Intervention): boolean {
  return !(
    TERMINAL_INTERVENTION_STATES as readonly InterventionState[]
  ).includes(intervention.state);
}

export function rescheduleIntervention(
  intervention: Intervention,
  revisedScheduledFor: string,
  statedReason: string | null,
  at: Date,
): Intervention {
  const rescheduled = transitionIntervention(intervention, "RESCHEDULED", at);

  return InterventionSchema.parse({
    ...rescheduled,
    scheduledFor: revisedScheduledFor,
    delayCount: intervention.delayCount + 1,
    delayHistory: [
      ...intervention.delayHistory,
      {
        originalScheduledFor: intervention.scheduledFor,
        revisedScheduledFor,
        statedReason,
        createdAt: toIsoDateTime(at),
      },
    ],
  });
}

export function activateRescheduledIntervention(
  intervention: Intervention,
  at: Date,
): Intervention {
  return transitionIntervention(intervention, "SCHEDULED", at);
}

export function requiresPatternAnalysis(
  intervention: Intervention,
  repeatedDelayThreshold: number,
): boolean {
  if (!Number.isInteger(repeatedDelayThreshold) || repeatedDelayThreshold < 1) {
    throw new DomainInvariantError(
      "Repeated-delay threshold must be a positive integer.",
    );
  }

  return intervention.delayCount >= repeatedDelayThreshold;
}

export function assertSingleActiveIntervention(
  actionId: string,
  interventions: readonly Intervention[],
): void {
  const activeCount = interventions.filter(
    (intervention) =>
      intervention.actionId === actionId && isActiveIntervention(intervention),
  ).length;

  if (activeCount > 1) {
    throw new DomainInvariantError(
      `Action ${actionId} has ${activeCount} active interventions; expected at most one.`,
    );
  }
}

export function assertUniqueDeliveryKeys(
  interventions: readonly Intervention[],
): void {
  const seen = new Set<string>();

  for (const intervention of interventions) {
    if (seen.has(intervention.deliveryKey)) {
      throw new DomainInvariantError(
        `Duplicate intervention delivery key: ${intervention.deliveryKey}`,
      );
    }
    seen.add(intervention.deliveryKey);
  }
}
