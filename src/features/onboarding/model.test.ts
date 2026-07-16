import { describe, expect, it } from "vitest";

import {
  applyPlanFeedback,
  createMockGoalArchitectResult,
  OnboardingAnswersSchema,
} from "./model";

describe("Phase 2 onboarding model", () => {
  it("accepts natural, incomplete onboarding answers", () => {
    expect(
      OnboardingAnswersSchema.safeParse({
        goal: "Finish Build Week",
        targetWindow: "This week",
        motivation: "I want to prove the recovery loop in real life",
      }).success,
    ).toBe(true);
  });

  it("runs the mock Goal Architect through the live output contract", async () => {
    const result = await createMockGoalArchitectResult(
      {
        goal: "Finish Build Week",
        targetWindow: "Before Sunday",
        motivation: "This product should protect meaningful work",
      },
      () => new Date("2026-07-16T10:00:00.000Z"),
    );

    expect(result.output.goalSummary).toBe("Finish Build Week");
    expect(
      new Date(result.output.initialCheckInProposal.scheduledFor).getTime(),
    ).toBeGreaterThan(new Date("2026-07-16T10:00:00.000Z").getTime());
    expect(result.trace).toMatchObject({
      agent: "GOAL_ARCHITECT",
      provider: "mock",
      model: "mock:goal-onboarding",
      status: "COMPLETED",
    });
  });

  it("keeps user disagreement as an explicit plan note", async () => {
    const result = await createMockGoalArchitectResult(
      {
        goal: "Write a novel",
        targetWindow: "This year",
        motivation: "The story matters to me",
      },
      () => new Date("2026-07-16T10:00:00.000Z"),
    );

    const adjusted = applyPlanFeedback(
      result.output,
      "Twenty-five minutes is too large on clinic days.",
    );

    expect(adjusted.feasibilityNotes.at(-1)).toContain("clinic days");
  });
});
