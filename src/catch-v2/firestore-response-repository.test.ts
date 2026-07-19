import { describe, expect, it } from "vitest";

import {
  CatchResponseConflictError,
  CatchResponseRecordSchema,
} from "./firestore-response-repository";

describe("immutable native response record", () => {
  const record = CatchResponseRecordSchema.parse({
    version: 1,
    responseId: "2a398290-1f8c-4e87-b912-825d9cc60582",
    eventId: "check-in-one",
    deviceId: "1d88041b-4d26-45ab-969d-f62402020b8f",
    sessionId: "session-one",
    fingerprint: "a".repeat(64),
    response: {
      eventId: "check-in-one",
      responseId: "2a398290-1f8c-4e87-b912-825d9cc60582",
      type: "downgrade",
      responseText: null,
      energy: null,
      delayMinutes: null,
      respondedAt: "2026-07-19T12:00:00.000Z",
    },
    recordedAt: "2026-07-19T12:00:01.000Z",
  });

  it("keeps the domain response nested in one immutable envelope", () => {
    expect(record.response.type).toBe("downgrade");
    expect(record.eventId).toBe(record.response.eventId);
    expect(record.responseId).toBe(record.response.responseId);
  });

  it("has a dedicated conflict error for id reuse", () => {
    expect(new CatchResponseConflictError()).toBeInstanceOf(Error);
  });
});
