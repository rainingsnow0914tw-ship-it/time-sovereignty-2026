import { CatchEscalationContextSchema, type CatchLevel } from "./schemas";

export const CATCH_RESPONSE_DEADLINE_SECONDS = {
  1: 10 * 60,
  2: 5 * 60,
  4: 2 * 60,
} as const satisfies Record<CatchLevel, number>;

export const CatchStopReason = {
  USER_RESPONDED: "USER_RESPONDED",
  CANCELLED: "CANCELLED",
  SUPPORT_PAUSED: "SUPPORT_PAUSED",
  CATEGORY_DISABLED: "CATEGORY_DISABLED",
  CONSENT_EXPIRED: "CONSENT_EXPIRED",
  QUIET_HOURS: "QUIET_HOURS",
  SICK_OR_EMERGENCY: "SICK_OR_EMERGENCY",
  LOW_ENERGY_REQUIRES_REPLAN: "LOW_ENERGY_REQUIRES_REPLAN",
  LOW_PRIORITY: "LOW_PRIORITY",
  PRIORITY_CAP: "PRIORITY_CAP",
  FULL_SCREEN_NOT_CONSENTED: "FULL_SCREEN_NOT_CONSENTED",
  TERMINAL_LEVEL: "TERMINAL_LEVEL",
} as const;

export type CatchStopReason =
  (typeof CatchStopReason)[keyof typeof CatchStopReason];

export type CatchEscalationDecision =
  | {
      kind: "ESCALATE";
      eventId: string;
      from: CatchLevel;
      to: CatchLevel;
      responseDeadlineSeconds: number;
    }
  | {
      kind: "STOP";
      eventId: string;
      level: CatchLevel;
      reason: CatchStopReason;
    };

export function nextEscalationLevel(level: CatchLevel): CatchLevel | null {
  if (level === 1) {
    return 2;
  }

  if (level === 2) {
    return 4;
  }

  return null;
}

export function evaluateCatchEscalation(
  input: unknown,
): CatchEscalationDecision {
  const context = CatchEscalationContextSchema.parse(input);

  const stop = (reason: CatchStopReason): CatchEscalationDecision => ({
    kind: "STOP",
    eventId: context.eventId,
    level: context.level,
    reason,
  });

  if (context.responded) {
    return stop(CatchStopReason.USER_RESPONDED);
  }
  if (context.cancelled) {
    return stop(CatchStopReason.CANCELLED);
  }
  if (context.supportPaused) {
    return stop(CatchStopReason.SUPPORT_PAUSED);
  }
  if (!context.categoryEnabled) {
    return stop(CatchStopReason.CATEGORY_DISABLED);
  }
  if (!context.consentValid) {
    return stop(CatchStopReason.CONSENT_EXPIRED);
  }
  if (context.withinQuietHours) {
    return stop(CatchStopReason.QUIET_HOURS);
  }
  if (context.userCondition === "SICK_OR_EMERGENCY") {
    return stop(CatchStopReason.SICK_OR_EMERGENCY);
  }
  if (context.userCondition === "LOW_ENERGY") {
    return stop(CatchStopReason.LOW_ENERGY_REQUIRES_REPLAN);
  }
  if (context.priority === "LOW") {
    return stop(CatchStopReason.LOW_PRIORITY);
  }

  const nextLevel = nextEscalationLevel(context.level);
  if (nextLevel === null) {
    return stop(CatchStopReason.TERMINAL_LEVEL);
  }
  if (context.priority === "NORMAL" && nextLevel === 4) {
    return stop(CatchStopReason.PRIORITY_CAP);
  }
  if (nextLevel === 4 && !context.fullScreenConsent) {
    return stop(CatchStopReason.FULL_SCREEN_NOT_CONSENTED);
  }

  return {
    kind: "ESCALATE",
    eventId: context.eventId,
    from: context.level,
    to: nextLevel,
    responseDeadlineSeconds: CATCH_RESPONSE_DEADLINE_SECONDS[nextLevel],
  };
}
