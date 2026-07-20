import { describe, expect, it } from "vitest";

import type { LiveCheckInDocument } from "./schemas";
import { liveCheckInBelongsTo } from "./firestore-repository";

describe("stable live check-in ownership", () => {
  it("allows a replacement paired session to resume the same owner", () => {
    const checkIn = {
      sessionId: "expired-session",
      ownerId: "private-single-device",
    } as LiveCheckInDocument;

    expect(
      liveCheckInBelongsTo({
        checkIn,
        sessionId: "replacement-session",
        ownerId: "private-single-device",
      }),
    ).toBe(true);
  });

  it("does not let a different owner inherit the check-in", () => {
    const checkIn = {
      sessionId: "expired-session",
      ownerId: "owner-one",
    } as LiveCheckInDocument;

    expect(
      liveCheckInBelongsTo({
        checkIn,
        sessionId: "replacement-session",
        ownerId: "owner-two",
      }),
    ).toBe(false);
  });
});
