import { describe, expect, it } from "vitest";

import { findRecoveredConfirmation } from "./live-confirmation-recovery";

type Candidate = {
  id: string;
  status: string;
};

const candidate = (id: string, status: string): Candidate => ({ id, status });

describe("findRecoveredConfirmation", () => {
  it("recovers the current check-in when its confirmation reached the cloud", () => {
    const confirmed = candidate("check-in-1", "CONFIRMED");

    expect(
      findRecoveredConfirmation(
        { checkIn: confirmed, lastConfirmedCheckIn: null },
        "check-in-1",
      ),
    ).toBe(confirmed);
  });

  it("recovers the prior check-in after the next follow-up becomes current", () => {
    const confirmed = candidate("check-in-1", "CONFIRMED");

    expect(
      findRecoveredConfirmation(
        {
          checkIn: candidate("follow-check-in-1", "SCHEDULED"),
          lastConfirmedCheckIn: confirmed,
        },
        "check-in-1",
      ),
    ).toBe(confirmed);
  });

  it("does not treat another or unconfirmed check-in as recovered", () => {
    expect(
      findRecoveredConfirmation(
        {
          checkIn: candidate("check-in-1", "DECISION_READY"),
          lastConfirmedCheckIn: candidate("check-in-0", "CONFIRMED"),
        },
        "check-in-1",
      ),
    ).toBeNull();
  });
});
