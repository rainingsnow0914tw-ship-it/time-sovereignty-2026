import { describe, expect, it } from "vitest";

import {
  ClientLiveCheckInSchema,
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

describe("client-safe recovery trace", () => {
  it("accepts the confirmed Chief, Recovery, Chief, Curator trace", () => {
    const trace = (
      runId: string,
      agent: "CHIEF_OF_STAFF" | "COMMITMENT_RECOVERY" | "MEMORY_CURATOR",
    ) => ({
      runId,
      agent,
      provider: "openai" as const,
      model: "gpt-5.6-sol",
      outputSchemaName: `${agent}Output`,
      inputSummary: "Safe summary",
      tokenUsage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      status: "COMPLETED" as const,
      startedAt: "2026-07-18T02:32:39.000Z",
      completedAt: "2026-07-18T02:32:40.000Z",
    });
    const traces = [
      trace("trace-chief-triage", "CHIEF_OF_STAFF"),
      trace("trace-recovery", "COMMITMENT_RECOVERY"),
      trace("trace-chief-final", "CHIEF_OF_STAFF"),
      trace("trace-memory-curator", "MEMORY_CURATOR"),
    ];

    const result = ClientLiveCheckInSchema.safeParse({
      id: "live-four-traces",
      status: "CONFIRMED",
      message: "What is true?",
      context: {
        goal: "Ship",
        motivation: "Use it",
        targetWindow: "Tonight",
        currentAction: "Test the live loop",
        minimumAction: "Open the app",
        preferredTone: "Warm",
      },
      scheduledFor: "2026-07-18T02:30:00.000Z",
      pendingAt: "2026-07-18T02:30:00.000Z",
      replyId: "reply-four-traces",
      attemptCount: 1,
      decision: {
        assessment: "BLOCKED",
        userMessage: "The plan needs to change.",
        adaptedCommitment: "Take the smallest useful next step.",
        dispatchedAgents: ["COMMITMENT_RECOVERY"],
        selectedStrategy: "REDUCE",
        nextFollowUpAt: "2026-07-18T03:30:00.000Z",
        memoryProposal: null,
      },
      traceRunIds: traces.map(({ runId }) => runId),
      traces,
      confirmedAt: "2026-07-18T02:33:00.000Z",
      nextCheckInId: null,
      errorName: null,
      createdAt: "2026-07-18T02:29:00.000Z",
      updatedAt: "2026-07-18T02:32:55.000Z",
    });

    expect(result.success).toBe(true);
  });
});
