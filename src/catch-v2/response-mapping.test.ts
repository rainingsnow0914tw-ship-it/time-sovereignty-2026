import { describe, expect, it } from "vitest";

import { catchResponseToLiveReply } from "./response-mapping";
import { CatchResponseSchema } from "./schemas";

const BASE = {
  eventId: "check-in-one",
  responseId: "response-one",
  responseText: null,
  energy: null,
  delayMinutes: null,
  respondedAt: "2026-07-19T12:00:00.000Z",
} as const;

describe("native response to live GPT-5.6 reply", () => {
  it.each([
    ["complete", "REPORT_PROGRESS"],
    ["downgrade", "SOMETHING_CHANGED"],
    ["mercy", "SOMETHING_CHANGED"],
  ] as const)("maps %s without pretending persistence", (type, intent) => {
    const response = CatchResponseSchema.parse({ ...BASE, type });
    expect(catchResponseToLiveReply(response)).toMatchObject({
      replyId: BASE.responseId,
      intent,
      image: null,
    });
  });

  it("keeps the bounded delay in the model-visible reply", () => {
    const response = CatchResponseSchema.parse({
      ...BASE,
      type: "reschedule",
      delayMinutes: 10,
    });
    expect(catchResponseToLiveReply(response)).toMatchObject({
      intent: "DELAY",
      reply: expect.stringContaining("10 minutes"),
    });
  });

  it("refuses a server timeout at the user endpoint", () => {
    const response = CatchResponseSchema.parse({ ...BASE, type: "timeout" });
    expect(() => catchResponseToLiveReply(response)).toThrow(/server event/i);
  });
});
