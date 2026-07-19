import { describe, expect, it } from "vitest";

import { CatchStopReason } from "./escalation";
import { evaluateCatchDeliveryGuard } from "./delivery";

const quietHours = {
  start: "22:30",
  end: "08:00",
  timezone: "Asia/Taipei",
};

describe("V2 catch delivery guard", () => {
  it("stops the first native delivery during quiet hours", () => {
    expect(
      evaluateCatchDeliveryGuard({
        eventId: "quiet-level-1",
        requestedLevel: 1,
        status: "PENDING",
        quietHours,
        fullScreenConsent: true,
        now: new Date("2026-07-19T16:00:00.000Z"),
      }),
    ).toMatchObject({ kind: "STOP", reason: CatchStopReason.QUIET_HOURS });
  });

  it("allows the first native delivery outside quiet hours", () => {
    expect(
      evaluateCatchDeliveryGuard({
        eventId: "awake-level-1",
        requestedLevel: 1,
        status: "PENDING",
        quietHours,
        fullScreenConsent: true,
        now: new Date("2026-07-19T14:00:00.000Z"),
      }),
    ).toMatchObject({ kind: "ESCALATE", from: 1, to: 2 });
  });

  it("still requires full-screen consent before level 4", () => {
    expect(
      evaluateCatchDeliveryGuard({
        eventId: "no-full-screen-consent",
        requestedLevel: 4,
        status: "PENDING",
        quietHours,
        fullScreenConsent: false,
        now: new Date("2026-07-19T14:00:00.000Z"),
      }),
    ).toMatchObject({
      kind: "STOP",
      reason: CatchStopReason.FULL_SCREEN_NOT_CONSENTED,
    });
  });
});
