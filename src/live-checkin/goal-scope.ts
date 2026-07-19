import type {
  LiveCheckInDocument,
  LiveDeviceSession,
} from "./schemas";

export interface GoalCheckInPointers {
  activeCheckInId: string | null;
  lastConfirmedCheckInId: string | null;
  updatedAt: string;
}

export function goalCheckInPointers(
  session: LiveDeviceSession,
  goalId: string,
): GoalCheckInPointers | null {
  return session.goalStates[goalId] ?? null;
}

export function withActiveGoalCheckIn(
  session: LiveDeviceSession,
  goalId: string,
  checkInId: string,
  updatedAt: string,
): LiveDeviceSession {
  const current = goalCheckInPointers(session, goalId);
  return {
    ...session,
    // Preserve the legacy pointer for the native event path and old clients.
    // Goal-aware reads never use it.
    activeCheckInId: checkInId,
    goalStates: {
      ...session.goalStates,
      [goalId]: {
        activeCheckInId: checkInId,
        lastConfirmedCheckInId: current?.lastConfirmedCheckInId ?? null,
        updatedAt,
      },
    },
    updatedAt,
  };
}

export function withLastConfirmedGoalCheckIn(
  session: LiveDeviceSession,
  goalId: string,
  checkInId: string,
  updatedAt: string,
): LiveDeviceSession {
  const current = goalCheckInPointers(session, goalId);
  return {
    ...session,
    // Preserve the legacy pointer for old diagnostics only.
    lastConfirmedCheckInId: checkInId,
    goalStates: {
      ...session.goalStates,
      [goalId]: {
        activeCheckInId: current?.activeCheckInId ?? checkInId,
        lastConfirmedCheckInId: checkInId,
        updatedAt,
      },
    },
    updatedAt,
  };
}

export function checkInBelongsToGoal(
  checkIn: LiveCheckInDocument,
  goalId: string,
): boolean {
  return checkIn.context.goalId === goalId;
}
