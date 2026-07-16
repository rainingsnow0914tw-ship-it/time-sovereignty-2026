import type { Action, ActionStatus } from "../goals/schemas";
import { toIsoDateTime } from "../shared";
import { InvalidTransitionError } from "./errors";

export const ACTION_TRANSITIONS = {
  PLANNED: ["READY", "PAUSED", "RETIRED", "CANCELLED"],
  READY: ["IN_PROGRESS", "PAUSED", "RETIRED", "CANCELLED"],
  IN_PROGRESS: [
    "AWAITING_UPDATE",
    "COMPLETED",
    "PAUSED",
    "RETIRED",
    "CANCELLED",
  ],
  AWAITING_UPDATE: [
    "IN_PROGRESS",
    "COMPLETED",
    "PAUSED",
    "RETIRED",
    "CANCELLED",
  ],
  COMPLETED: [],
  PAUSED: ["READY", "RETIRED", "CANCELLED"],
  RETIRED: [],
  CANCELLED: [],
} as const satisfies Record<ActionStatus, readonly ActionStatus[]>;

export const TERMINAL_ACTION_STATES = [
  "COMPLETED",
  "RETIRED",
  "CANCELLED",
] as const satisfies readonly ActionStatus[];

const REMINDER_ELIGIBLE_ACTION_STATES = [
  "READY",
  "IN_PROGRESS",
  "AWAITING_UPDATE",
] as const satisfies readonly ActionStatus[];

export function canTransitionAction(
  from: ActionStatus,
  to: ActionStatus,
): boolean {
  return (ACTION_TRANSITIONS[from] as readonly ActionStatus[]).includes(to);
}

export function transitionAction(
  action: Action,
  to: ActionStatus,
  at: Date,
): Action {
  if (!canTransitionAction(action.status, to)) {
    throw new InvalidTransitionError("action", action.status, to);
  }

  return {
    ...action,
    status: to,
    updatedAt: toIsoDateTime(at),
  };
}

export function shouldScheduleInterventionForAction(action: Action): boolean {
  return (REMINDER_ELIGIBLE_ACTION_STATES as readonly ActionStatus[]).includes(
    action.status,
  );
}
