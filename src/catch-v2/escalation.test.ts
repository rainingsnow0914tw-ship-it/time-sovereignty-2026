import { describe, expect, it } from "vitest";

import {
  CATCH_RESPONSE_DEADLINE_SECONDS,
  CatchStopReason,
  evaluateCatchEscalation,
  nextEscalationLevel,
} from "./escalation";
import { parseCatchResponse, requiresDurableFollowUp } from "./responses";
import type {
  CatchEscalationContext,
  CatchLevel,
  CatchResponse,
} from "./schemas";

const BASE_CONTEXT: CatchEscalationContext = {
  eventId: "catch-event-1",
  level: 1,
  priority: "HIGH",
  responded: false,
  cancelled: false,
  supportPaused: false,
  categoryEnabled: true,
  consentValid: true,
  fullScreenConsent: true,
  withinQuietHours: false,
  userCondition: "NORMAL",
};

function decide(overrides: Partial<CatchEscalationContext> = {}) {
  return evaluateCatchEscalation({ ...BASE_CONTEXT, ...overrides });
}

describe("V2 catch escalation", () => {
  it("uses the explicit 1 -> 2 -> 4 -> stop transition", () => {
    expect(nextEscalationLevel(1)).toBe(2);
    expect(nextEscalationLevel(2)).toBe(4);
    expect(nextEscalationLevel(4)).toBeNull();
  });

  it.each([
    [1, 2],
    [2, 4],
  ] as const)("escalates level %i to %i with the new deadline", (from, to) => {
    expect(decide({ level: from })).toEqual({
      kind: "ESCALATE",
      eventId: BASE_CONTEXT.eventId,
      from,
      to,
      responseDeadlineSeconds:
        CATCH_RESPONSE_DEADLINE_SECONDS[to as CatchLevel],
    });
  });

  it.each([
    [{ responded: true }, CatchStopReason.USER_RESPONDED],
    [{ cancelled: true }, CatchStopReason.CANCELLED],
    [{ supportPaused: true }, CatchStopReason.SUPPORT_PAUSED],
    [{ categoryEnabled: false }, CatchStopReason.CATEGORY_DISABLED],
    [{ consentValid: false }, CatchStopReason.CONSENT_EXPIRED],
    [{ withinQuietHours: true }, CatchStopReason.QUIET_HOURS],
    [
      { userCondition: "SICK_OR_EMERGENCY" },
      CatchStopReason.SICK_OR_EMERGENCY,
    ],
    [
      { userCondition: "LOW_ENERGY" },
      CatchStopReason.LOW_ENERGY_REQUIRES_REPLAN,
    ],
    [{ priority: "LOW" }, CatchStopReason.LOW_PRIORITY],
    [{ level: 4 }, CatchStopReason.TERMINAL_LEVEL],
  ] as const)("stops deterministically for %s", (overrides, reason) => {
    expect(decide(overrides)).toMatchObject({ kind: "STOP", reason });
  });

  it("caps a normal-priority reminder before the full-screen call", () => {
    expect(decide({ level: 2, priority: "NORMAL" })).toMatchObject({
      kind: "STOP",
      reason: CatchStopReason.PRIORITY_CAP,
    });
  });

  it("requires separate consent before a high-priority full-screen call", () => {
    expect(decide({ level: 2, fullScreenConsent: false })).toMatchObject({
      kind: "STOP",
      reason: CatchStopReason.FULL_SCREEN_NOT_CONSENTED,
    });
  });
});

describe("V2 catch response contract", () => {
  const response: CatchResponse = {
    eventId: "catch-event-1",
    responseId: "response-1",
    type: "reschedule",
    responseText: "Please come back in ten minutes.",
    energy: "MEDIUM",
    delayMinutes: 10,
    respondedAt: "2026-07-19T12:00:00.000Z",
  };

  it("marks reschedule as requiring a durable follow-up", () => {
    const parsed = parseCatchResponse(response);
    expect(requiresDurableFollowUp(parsed)).toBe(true);
  });

  it("rejects a reschedule that cannot create a bounded next event", () => {
    expect(() =>
      parseCatchResponse({ ...response, delayMinutes: null }),
    ).toThrow(/bounded delay/i);
  });

  it("rejects delayMinutes on response types that must not reschedule", () => {
    expect(() =>
      parseCatchResponse({ ...response, type: "complete" }),
    ).toThrow(/only a reschedule/i);
  });
});
