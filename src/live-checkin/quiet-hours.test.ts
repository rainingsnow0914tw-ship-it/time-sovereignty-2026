import { describe, expect, it } from "vitest";

import {
  moveOutsideQuietHours,
  selectLiveFollowUpTime,
} from "./quiet-hours";
import { LiveScheduleRequestSchema } from "./schemas";

const quietHours = {
  start: "22:30",
  end: "08:00",
  timezone: "Asia/Shanghai",
};

describe("live follow-up quiet-hours fence", () => {
  it("moves a 23:10 follow-up to 08:00 in the user's timezone", () => {
    expect(
      moveOutsideQuietHours(
        new Date("2026-07-17T15:10:00.000Z"),
        quietHours,
      ).toISOString(),
    ).toBe("2026-07-18T00:00:00.000Z");
  });

  it("moves an early-morning follow-up to the same local 08:00 boundary", () => {
    expect(
      moveOutsideQuietHours(
        new Date("2026-07-17T23:30:00.000Z"),
        quietHours,
      ).toISOString(),
    ).toBe("2026-07-18T00:00:00.000Z");
  });

  it("leaves an allowed daytime follow-up unchanged", () => {
    const daytime = new Date("2026-07-17T04:00:00.000Z");
    expect(moveOutsideQuietHours(daytime, quietHours)).toEqual(daytime);
  });

  it("applies the fence after rejecting an out-of-range model proposal", () => {
    expect(
      selectLiveFollowUpTime({
        proposedAt: "2026-07-20T00:00:00.000Z",
        now: new Date("2026-07-17T14:00:00.000Z"),
        quietHours,
      }),
    ).toBe("2026-07-18T00:00:00.000Z");
  });

  it("requires goal identity, locale, and quiet hours on every new live schedule", () => {
    const request = {
      scheduleId: "live-language-proof",
      message: "現在真實的情況是什麼？",
      context: {
        goalId: "goal-live-proof",
        goal: "完成驗收",
        motivation: "保護時間",
        targetWindow: "今晚",
        currentAction: "測試手機",
        minimumAction: "打開 PWA",
        preferredTone: "溫暖、直接",
        locale: "zh-TW",
        quietHours,
      },
      scheduledFor: "2026-07-17T15:00:00.000Z",
    };
    expect(LiveScheduleRequestSchema.parse(request).context.locale).toBe(
      "zh-TW",
    );
    const withoutFence = {
      ...request,
      context: { ...request.context, quietHours: undefined },
    };
    expect(() => LiveScheduleRequestSchema.parse(withoutFence)).toThrow();
  });
});
