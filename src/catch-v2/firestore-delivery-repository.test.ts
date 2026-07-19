import { describe, expect, it } from "vitest";

import { decideCatchDeliveryClaim } from "./firestore-delivery-repository";

describe("catch delivery receipt claim", () => {
  const now = new Date("2026-07-19T12:00:00.000Z");

  it("creates one stable in-flight claim", () => {
    const decision = decideCatchDeliveryClaim({
      current: null,
      eventId: "event-one",
      level: 4,
      now,
      leaseToken: "4fd9e240-0c0e-462c-9566-ebc58132dcd5",
      leaseSeconds: 60,
    });
    expect(decision).toMatchObject({
      kind: "CLAIMED",
      receipt: { idempotencyKey: "event-one:level:4", attemptCount: 1 },
    });
  });

  it("does not resend a completed level", () => {
    const first = decideCatchDeliveryClaim({
      current: null,
      eventId: "event-one",
      level: 1,
      now,
      leaseToken: "4fd9e240-0c0e-462c-9566-ebc58132dcd5",
      leaseSeconds: 60,
    });
    if (first.kind !== "CLAIMED") throw new Error("expected claim");
    const completed = { ...first.receipt, status: "DELIVERED" as const };
    expect(
      decideCatchDeliveryClaim({
        current: completed,
        eventId: "event-one",
        level: 1,
        now,
        leaseToken: "38863896-2cb2-4457-a455-8b990773e058",
        leaseSeconds: 60,
      }).kind,
    ).toBe("DUPLICATE");
  });

  it("returns busy before lease expiry and reclaims after it", () => {
    const first = decideCatchDeliveryClaim({
      current: null,
      eventId: "event-one",
      level: 2,
      now,
      leaseToken: "4fd9e240-0c0e-462c-9566-ebc58132dcd5",
      leaseSeconds: 60,
    });
    if (first.kind !== "CLAIMED") throw new Error("expected claim");
    expect(
      decideCatchDeliveryClaim({
        current: first.receipt,
        eventId: "event-one",
        level: 2,
        now: new Date(now.getTime() + 10_000),
        leaseToken: "38863896-2cb2-4457-a455-8b990773e058",
        leaseSeconds: 60,
      }).kind,
    ).toBe("BUSY");
    expect(
      decideCatchDeliveryClaim({
        current: first.receipt,
        eventId: "event-one",
        level: 2,
        now: new Date(now.getTime() + 61_000),
        leaseToken: "38863896-2cb2-4457-a455-8b990773e058",
        leaseSeconds: 60,
      }),
    ).toMatchObject({ kind: "CLAIMED", receipt: { attemptCount: 2 } });
  });
});
