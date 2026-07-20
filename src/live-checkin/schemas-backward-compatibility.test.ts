import { describe, expect, it } from "vitest";

import {
  ClientLiveCheckInSchema,
  LIVE_PRIVATE_OWNER_ID,
  LiveDeviceSessionSchema,
} from "./schemas";

describe("live schema backward compatibility", () => {
  it("upgrades the legacy phone session without retaining its obsolete goal index", () => {
    const session = LiveDeviceSessionSchema.parse({
      version: 1,
      id: "f7322b54-6338-4565-8f93-cb3271996c72",
      deviceLabel: "Android PWA",
      expiresAt: "2026-07-22T10:03:20.905Z",
      activeCheckInId: "follow-live-1784499276418-0d6572b0",
      lastConfirmedCheckInId: "live-1784499276418-0d6572b0",
      goalStates: {
        "legacy-goal": { activeCheckInId: "legacy-check-in" },
      },
      createdAt: "2026-07-18T10:03:21.531Z",
      revokedAt: null,
      updatedAt: "2026-07-19T22:34:08.099Z",
    });

    expect(session.ownerId).toBe(LIVE_PRIVATE_OWNER_ID);
    expect(session).not.toHaveProperty("goalStates");
    expect(session.activeCheckInId).toBe("follow-live-1784499276418-0d6572b0");
  });

  it("projects a goal-led check-in that carries all four agent traces", () => {
    // A goal-led check-in runs Goal Architect in addition to the three-step
    // recovery trace. The document already allows four `traceRunIds`, so the
    // client projection must not reject the matching four traces; otherwise a
    // single confirmed check-in fails `/api/live/check-ins/current` for the
    // whole screen.
    const trace = (
      runId: string,
      agent:
        | "CHIEF_OF_STAFF"
        | "COMMITMENT_RECOVERY"
        | "GOAL_ARCHITECT",
    ) => ({
      runId,
      agent,
      provider: "openai" as const,
      model: "gpt-5.6-sol",
      outputSchemaName: `${agent}Output`,
      inputSummary: "Safe summary",
      tokenUsage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
      status: "COMPLETED" as const,
      startedAt: "2026-07-19T22:14:37.000Z",
      completedAt: "2026-07-19T22:14:39.000Z",
    });
    const traces = [
      trace("trace-goal-architect", "GOAL_ARCHITECT"),
      trace("trace-chief-triage", "CHIEF_OF_STAFF"),
      trace("trace-recovery", "COMMITMENT_RECOVERY"),
      trace("trace-chief-final", "CHIEF_OF_STAFF"),
    ];

    const result = ClientLiveCheckInSchema.safeParse({
      id: "live-1784499276418-0d6572b0",
      status: "CONFIRMED",
      message: "How did the session go?",
      context: {
        goalId: "0d6572b0-8f2a-4d1c-9a3e-77c1b5e40f21",
        goal: "Drink one glass of water",
        motivation: "Support physical health",
        targetWindow: "Today",
        currentAction: "Pick up a glass of water now",
        minimumAction: "Take a single sip",
        preferredTone: "Warm",
        locale: "zh-TW",
      },
      scheduledFor: "2026-07-19T22:16:36.416Z",
      pendingAt: "2026-07-19T22:16:36.416Z",
      replyId: "reply-four-traces",
      attemptCount: 1,
      decision: {
        assessment: "COMPLETED",
        userMessage: "You finished it.",
        adaptedCommitment: "Keep the finished result as evidence.",
        dispatchedAgents: [],
        selectedStrategy: null,
        nextFollowUpAt: null,
        memoryProposal: null,
      },
      traceRunIds: traces.map(({ runId }) => runId),
      traces,
      confirmedAt: "2026-07-19T22:34:08.099Z",
      nextCheckInId: null,
      createdAt: "2026-07-19T22:14:36.626Z",
      updatedAt: "2026-07-19T22:34:08.099Z",
    });

    expect(result.success ? [] : result.error.issues).toEqual([]);
    expect(result.success && result.data.traces).toHaveLength(4);
  });
});
