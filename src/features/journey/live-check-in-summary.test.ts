import { describe, expect, it } from "vitest";

import type { ClientLiveCheckIn } from "../../live-checkin/schemas";
import { summarizeLiveCheckIn } from "./live-check-in-summary";

function checkIn(
  status: ClientLiveCheckIn["status"],
  decision: ClientLiveCheckIn["decision"] = null,
): ClientLiveCheckIn {
  return {
    id: "live-summary",
    status,
    message: "What is true?",
    context: {
      goal: "Finish a cup sketch",
      motivation: "Practice finishing",
      targetWindow: "20 minutes",
      cadence: {
        kind: "SPRINT",
        targetEndAt: null,
        checkInFrequency: "CUSTOM",
        preferredCheckInTime: "22:11",
        reviewFrequencyDays: 1,
        rationale: "Match the focus block.",
        completionSignal: "A finished sketch.",
      },
      currentAction: "Draw the cup",
      minimumAction: "Draw the outline",
      preferredTone: "Warm and direct",
      locale: "zh-TW",
      quietHours: {
        start: "22:30",
        end: "08:00",
        timezone: "Asia/Taipei",
      },
    },
    scheduledFor: "2026-07-18T14:11:46.000Z",
    pendingAt: null,
    replyId: null,
    attemptCount: 0,
    decision,
    traceRunIds: [],
    retrievedMemoryIds: [],
    memoryDisposition: null,
    memoryCurationStatus: null,
    memoryCurationSummary: null,
    traces: [],
    confirmedAt: null,
    nextCheckInId: null,
    createdAt: "2026-07-18T13:51:46.000Z",
    updatedAt: "2026-07-18T13:51:46.000Z",
  };
}

describe("live check-in summary", () => {
  it("shows the real Cloud Tasks time while scheduled", () => {
    expect(summarizeLiveCheckIn(checkIn("SCHEDULED"), null)).toEqual({
      state: "SCHEDULED",
      scheduledFor: "2026-07-18T14:11:46.000Z",
    });
  });

  it("shows that reporting is available when the task arrives", () => {
    expect(summarizeLiveCheckIn(checkIn("PENDING"), null)).toEqual({
      state: "REPORT_READY",
    });
  });

  it("shows a completed goal instead of a stale proposal", () => {
    expect(
      summarizeLiveCheckIn(
        checkIn("CONFIRMED", {
          assessment: "COMPLETED",
          userMessage: "The sprint is complete.",
          adaptedCommitment: "Record one sentence about what worked.",
          dispatchedAgents: [],
          selectedStrategy: "CONTINUE",
          nextFollowUpAt: null,
          memoryProposal: null,
        }),
        null,
      ),
    ).toEqual({ state: "COMPLETED" });
  });
});
