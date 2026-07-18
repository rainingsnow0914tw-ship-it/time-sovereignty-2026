import type { ClientLiveCheckIn } from "../../live-checkin/schemas";

export type LiveCheckInSummary =
  | { state: "START_REQUIRED" }
  | { state: "SCHEDULED"; scheduledFor: string }
  | { state: "REPORT_READY" }
  | { state: "REVIEWING" }
  | { state: "AWAITING_CONFIRMATION" }
  | { state: "COMPLETED" }
  | { state: "NO_FOLLOW_UP" };

export function summarizeLiveCheckIn(
  current: ClientLiveCheckIn | null,
  lastConfirmed: ClientLiveCheckIn | null,
): LiveCheckInSummary {
  const checkIn = current ?? lastConfirmed;
  if (!checkIn) return { state: "START_REQUIRED" };

  switch (checkIn.status) {
    case "SCHEDULED":
      return checkIn.scheduledFor
        ? { state: "SCHEDULED", scheduledFor: checkIn.scheduledFor }
        : { state: "START_REQUIRED" };
    case "PENDING":
    case "FAILED":
      return { state: "REPORT_READY" };
    case "PROCESSING":
      return { state: "REVIEWING" };
    case "DECISION_READY":
      return { state: "AWAITING_CONFIRMATION" };
    case "CONFIRMED":
      if (checkIn.decision?.assessment === "COMPLETED") {
        return { state: "COMPLETED" };
      }
      if (checkIn.decision?.nextFollowUpAt) {
        return {
          state: "SCHEDULED",
          scheduledFor: checkIn.decision.nextFollowUpAt,
        };
      }
      return { state: "NO_FOLLOW_UP" };
  }
}
