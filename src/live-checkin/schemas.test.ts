import { describe, expect, it } from "vitest";

import {
  LiveChiefOfStaffDecisionSchema,
  LiveReplyRequestSchema,
} from "./schemas";

describe("live reply input boundary", () => {
  it("accepts a photo-only progress report", () => {
    const result = LiveReplyRequestSchema.safeParse({
      replyId: "photo-report-1",
      intent: "REPORT_PROGRESS",
      reply: "",
      image: {
        mimeType: "image/jpeg",
        dataUrl: "data:image/jpeg;base64,YWJj",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an explicit delay without pretending the user wrote a reason", () => {
    const result = LiveReplyRequestSchema.safeParse({
      replyId: "delay-1",
      intent: "DELAY",
      reply: "",
      image: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty generic progress report", () => {
    const result = LiveReplyRequestSchema.safeParse({
      replyId: "empty-report-1",
      intent: "REPORT_PROGRESS",
      reply: "",
      image: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("live decision compatibility", () => {
  it("parses an older recovery-only decision as blocked", () => {
    const parsed = LiveChiefOfStaffDecisionSchema.parse({
      userMessage: "Let's reduce the action.",
      adaptedCommitment: "Open the document.",
      dispatchedAgents: ["COMMITMENT_RECOVERY"],
      selectedStrategy: "REDUCE",
      nextFollowUpAt: "2026-07-19T01:00:00.000Z",
      memoryProposal: null,
    });
    expect(parsed.assessment).toBe("BLOCKED");
  });

  it("allows a completed goal to end without an artificial follow-up", () => {
    const result = LiveChiefOfStaffDecisionSchema.safeParse({
      assessment: "COMPLETED",
      userMessage: "You completed the goal.",
      adaptedCommitment: "Keep the finished result as evidence.",
      dispatchedAgents: [],
      selectedStrategy: null,
      nextFollowUpAt: null,
      memoryProposal: null,
    });
    expect(result.success).toBe(true);
  });
});
