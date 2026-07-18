import type { GoalCadence } from "../../domain/goals/schemas";
import type { ClientLiveCheckIn } from "../../live-checkin/schemas";

const MIN_MINUTES = 2;
const MAX_MINUTES = 24 * 60;

export function inferFocusMinutes(
  targetWindow: string,
  kind: GoalCadence["kind"],
): number {
  const minuteMatch = targetWindow.match(
    /(\d{1,4})\s*(?:分鐘|分钟|分(?:鐘|钟)?|minutes?|mins?)/iu,
  );
  if (minuteMatch) return normalizeFocusMinutes(Number(minuteMatch[1]));

  const hourMatch = targetWindow.match(
    /(\d{1,2})\s*(?:小時|小时|hours?|hrs?)/iu,
  );
  if (hourMatch) {
    return normalizeFocusMinutes(Number(hourMatch[1]) * 60);
  }

  switch (kind) {
    case "SPRINT":
      return 25;
    case "HABIT":
      return 30;
    case "PROJECT":
      return 60;
  }
}

export function normalizeFocusMinutes(value: number): number {
  if (!Number.isFinite(value)) return 25;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(value)));
}

export function scheduleAtFromMinutes(
  minutes: number,
  now = new Date(),
): string {
  return new Date(
    now.getTime() + normalizeFocusMinutes(minutes) * 60 * 1_000,
  ).toISOString();
}

export function cadenceForScheduledCheckIn(
  cadence: GoalCadence,
  scheduledFor: string,
): GoalCadence {
  const scheduledMs = new Date(scheduledFor).getTime();
  const targetMs = cadence.targetEndAt
    ? new Date(cadence.targetEndAt).getTime()
    : Number.NaN;

  if (!Number.isFinite(targetMs) || scheduledMs < targetMs) return cadence;

  return {
    ...cadence,
    targetEndAt: null,
    rationale: `${cadence.rationale} The user explicitly restarted the focus window after the earlier absolute time became stale.`,
  };
}

export function planTimingNeedsRestart(
  proposedAt: string | null,
  confirmedAt: string,
): boolean {
  if (!proposedAt) return true;
  return new Date(proposedAt).getTime() <= new Date(confirmedAt).getTime();
}

export function canStartLiveFocusBlock(
  current: Pick<ClientLiveCheckIn, "status" | "nextCheckInId"> | null,
): boolean {
  return (
    current === null ||
    (current.status === "CONFIRMED" && current.nextCheckInId === null)
  );
}
