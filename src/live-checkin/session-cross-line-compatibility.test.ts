import { describe, expect, it } from "vitest";

import {
  LiveCheckInDocumentSchema,
  LiveDeviceSessionSchema,
} from "./schemas";

// The parallel `codex/longitudinal-goal-loop` line deploys to the same Cloud
// Run service and the same Firestore database. A session it created carries
// `ownerId` and no `goalStates`; this line's schema is strict, so before this
// compatibility the whole private live path answered 400 and the phone showed
// "受保護的連線暫時無法使用。" until the device was paired again.
//
// The document below is the real shape observed in
// live_device_sessions/single-device on 2026-07-20, with identifiers replaced.
describe("device session written by the parallel development line", () => {
  const sessionFromOtherLine = {
    version: 1,
    id: "f7322b54-6338-4565-8f93-cb3271996c72",
    ownerId: "private-single-device",
    deviceLabel: "Android PWA",
    expiresAt: "2026-07-22T10:03:20.905Z",
    activeCheckInId: "goal-e8e7f665e88eafe9b15e2314785798897ab3766aa602b35d",
    lastConfirmedCheckInId: "live-1784499276418-0d6572b0",
    createdAt: "2026-07-18T10:03:21.531Z",
    revokedAt: null,
    updatedAt: "2026-07-19T22:34:08.099Z",
  };

  it("stays readable instead of forcing the user to pair again", () => {
    const parsed = LiveDeviceSessionSchema.parse(sessionFromOtherLine);

    expect(parsed.id).toBe(sessionFromOtherLine.id);
    expect(parsed.activeCheckInId).toBe(sessionFromOtherLine.activeCheckInId);
  });

  it("preserves ownerId so the other line's pairing is not stripped on write", () => {
    const parsed = LiveDeviceSessionSchema.parse(sessionFromOtherLine);

    expect(parsed.ownerId).toBe("private-single-device");
  });

  it("defaults goalStates without inventing goal scopes", () => {
    const parsed = LiveDeviceSessionSchema.parse(sessionFromOtherLine);

    expect(parsed.goalStates).toEqual({});
  });

  it("still accepts a session created by this line", () => {
    const parsed = LiveDeviceSessionSchema.parse({
      ...sessionFromOtherLine,
      ownerId: undefined,
      goalStates: {
        "goal-1683dbc3-237f-4d24-958b-346a022315a9": {
          activeCheckInId: null,
          lastConfirmedCheckInId: "live-1784499276418-0d6572b0",
          updatedAt: "2026-07-19T22:34:08.099Z",
        },
      },
    });

    expect(Object.keys(parsed.goalStates)).toHaveLength(1);
  });

  it("still rejects a genuinely unknown field", () => {
    expect(
      LiveDeviceSessionSchema.safeParse({
        ...sessionFromOtherLine,
        somethingNobodyWrites: true,
      }).success,
    ).toBe(false);
  });
});

describe("check-in written by the parallel development line", () => {
  // Check-ins created by codex/longitudinal-goal-loop carry ownerId. Reading
  // one through session.activeCheckInId or lastConfirmedCheckInId would fail
  // the entire current-check-in request if the strict schema rejected it.
  const checkInFromOtherLine = {
    version: 1,
    id: "live-1784499276418-0d6572b0",
    sessionId: "f7322b54-6338-4565-8f93-cb3271996c72",
    ownerId: "private-single-device",
    status: "CONFIRMED",
    message: "How did the session go?",
    context: {
      goal: "Drink one glass of water",
      motivation: "Support physical health",
      targetWindow: "Today",
      currentAction: "Pick up a glass of water now",
      minimumAction: "Take a single sip",
      preferredTone: "Warm",
    },
    scheduledFor: "2026-07-19T22:16:36.416Z",
    taskName: null,
    pendingAt: "2026-07-19T22:16:36.416Z",
    replyId: null,
    replyFingerprint: null,
    attemptCount: 1,
    leaseToken: null,
    leaseExpiresAt: null,
    recovery: null,
    decision: null,
    traceRunIds: [],
    confirmedAt: null,
    confirmationId: null,
    nextCheckInId: null,
    nextTaskName: null,
    errorName: null,
    createdAt: "2026-07-19T22:14:36.626Z",
    updatedAt: "2026-07-19T22:34:08.099Z",
  };

  it("stays readable so one legacy record cannot fail the whole request", () => {
    const parsed = LiveCheckInDocumentSchema.safeParse(checkInFromOtherLine);

    expect(parsed.success ? [] : parsed.error.issues).toEqual([]);
  });

  it("preserves ownerId rather than stripping it on write", () => {
    const parsed = LiveCheckInDocumentSchema.parse(checkInFromOtherLine);

    expect(parsed.ownerId).toBe("private-single-device");
  });
});
