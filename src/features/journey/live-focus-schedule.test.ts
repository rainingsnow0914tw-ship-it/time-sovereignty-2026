import { describe, expect, it } from "vitest";

import {
  cadenceForScheduledCheckIn,
  inferFocusMinutes,
  planTimingNeedsRestart,
  scheduleAtFromMinutes,
} from "./live-focus-schedule";

const cadence = {
  kind: "SPRINT" as const,
  targetEndAt: "2026-07-18T13:20:00.000Z",
  checkInFrequency: "CUSTOM" as const,
  preferredCheckInTime: "21:20",
  reviewFrequencyDays: 1,
  rationale: "Match the short goal window.",
  completionSignal: "A photo confirms the sketch is complete.",
};

describe("live focus scheduling", () => {
  it("uses the user's explicit Chinese minute window", () => {
    expect(inferFocusMinutes("從現在起20分鐘內", "SPRINT")).toBe(20);
  });

  it("creates a bounded future schedule", () => {
    expect(
      scheduleAtFromMinutes(20, new Date("2026-07-18T13:00:00.000Z")),
    ).toBe("2026-07-18T13:20:00.000Z");
  });

  it("clears an obsolete absolute target when the user restarts the block", () => {
    expect(
      cadenceForScheduledCheckIn(cadence, "2026-07-18T13:30:00.000Z"),
    ).toMatchObject({ kind: "SPRINT", targetEndAt: null });
  });

  it("keeps a still-valid target boundary", () => {
    expect(
      cadenceForScheduledCheckIn(cadence, "2026-07-18T13:10:00.000Z"),
    ).toEqual(cadence);
  });

  it("marks a proposal that expired during confirmation", () => {
    expect(
      planTimingNeedsRestart(
        "2026-07-18T13:13:00.000Z",
        "2026-07-18T13:15:00.000Z",
      ),
    ).toBe(true);
  });

  it("asks for a fresh start when a legacy plan has no proposal", () => {
    expect(planTimingNeedsRestart(null, "2026-07-18T13:15:00.000Z")).toBe(
      true,
    );
  });
});
