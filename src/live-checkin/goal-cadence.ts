import type { GoalCadence, GoalPlan } from "../domain/goals/schemas";

const HOUR_MS = 60 * 60 * 1_000;

export class GoalCadenceTimingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoalCadenceTimingError";
  }
}

export function maximumInitialCheckInDelayMs(
  kind: GoalPlan["cadence"]["kind"],
): number {
  switch (kind) {
    case "SPRINT":
      return 24 * HOUR_MS;
    case "HABIT":
      return 72 * HOUR_MS;
    case "PROJECT":
      return 7 * 24 * HOUR_MS;
  }
}

export function assertGoalCadenceTiming(plan: GoalPlan, now: Date): void {
  const nowMs = now.getTime();
  const checkInMs = new Date(
    plan.initialCheckInProposal.scheduledFor,
  ).getTime();
  if (!Number.isFinite(checkInMs) || checkInMs <= nowMs) {
    throw new GoalCadenceTimingError(
      "Goal Architect returned a non-future check-in time.",
    );
  }

  const maximumDelay = maximumInitialCheckInDelayMs(plan.cadence.kind);
  if (checkInMs - nowMs > maximumDelay) {
    throw new GoalCadenceTimingError(
      `The first ${plan.cadence.kind.toLowerCase()} check-in is too far away.`,
    );
  }

  if (plan.cadence.targetEndAt) {
    const targetEndMs = new Date(plan.cadence.targetEndAt).getTime();
    if (!Number.isFinite(targetEndMs) || targetEndMs <= nowMs) {
      throw new GoalCadenceTimingError(
        "Goal Architect returned a target end time that is not in the future.",
      );
    }
    if (checkInMs >= targetEndMs) {
      throw new GoalCadenceTimingError(
        "The first check-in must happen before the target end time.",
      );
    }
  }
}

export function assertGoalCadenceFollowUp(options: {
  nextFollowUpAt: string | null;
  cadence?: GoalCadence;
  now: Date;
}): void {
  if (!options.nextFollowUpAt || !options.cadence) return;
  const nowMs = options.now.getTime();
  const followUpMs = new Date(options.nextFollowUpAt).getTime();
  if (!Number.isFinite(followUpMs) || followUpMs <= nowMs) {
    throw new GoalCadenceTimingError("The next follow-up is not in the future.");
  }
  if (
    followUpMs - nowMs >
    maximumInitialCheckInDelayMs(options.cadence.kind)
  ) {
    throw new GoalCadenceTimingError(
      `The next ${options.cadence.kind.toLowerCase()} follow-up is too far away.`,
    );
  }
  if (
    options.cadence.targetEndAt &&
    followUpMs >= new Date(options.cadence.targetEndAt).getTime()
  ) {
    throw new GoalCadenceTimingError(
      "The next follow-up must happen before the target end time.",
    );
  }
}
