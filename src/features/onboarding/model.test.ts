import { describe, expect, it } from "vitest";

import {
  applyGoalCadenceRecommendation,
  applyPlanFeedback,
  createMockGoalArchitectResult,
  defaultSupportAgreementDraft,
  normalizeTimeInput,
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

  it("does not stretch a tonight deadline into a generic long journey", async () => {
    const now = new Date("2026-07-18T03:00:00.000Z");
    const result = await createMockGoalArchitectResult(
      {
        goal: "今晚完成黑客松提交",
        targetWindow: "今天晚上十一點前",
        motivation: "我要完成真正能用的作品",
      },
      () => now,
    );

    expect(result.output.cadence).toMatchObject({
      kind: "SPRINT",
      checkInFrequency: "CUSTOM",
      reviewFrequencyDays: 1,
    });
    expect(
      new Date(result.output.initialCheckInProposal.scheduledFor).getTime() -
        now.getTime(),
    ).toBeLessThanOrEqual(24 * 60 * 60 * 1_000);
  });

  it("separates an ongoing practice from a finite project", async () => {
    const now = () => new Date("2026-07-18T03:00:00.000Z");
    const habit = await createMockGoalArchitectResult(
      {
        goal: "每天畫一張小插畫",
        targetWindow: "一個月",
        motivation: "讓畫畫成為生活的一部分",
      },
      now,
    );
    const project = await createMockGoalArchitectResult(
      {
        goal: "完成一本小說初稿",
        targetWindow: "六個月",
        motivation: "把故事真正寫完",
      },
      now,
    );

    expect(habit.output.cadence.kind).toBe("HABIT");
    expect(project.output.cadence.kind).toBe("PROJECT");
  });

  it("prefills support from the recommendation without locking user control", async () => {
    const result = await createMockGoalArchitectResult(
      {
        goal: "今晚完成黑客松提交",
        targetWindow: "今天晚上十一點前",
        motivation: "完成可提交成果",
      },
      () => new Date("2026-07-18T03:00:00.000Z"),
    );
    const support = applyGoalCadenceRecommendation(
      { ...defaultSupportAgreementDraft, checkInFrequency: "WEEKLY" },
      result.output,
    );

    expect(support.checkInFrequency).toBe("CUSTOM");
    expect(support.reviewFrequencyDays).toBe(1);
  });
});

describe("check-in time input on a numeric keypad", () => {
  it("inserts the separator the phone keyboard cannot type", () => {
    expect(normalizeTimeInput("1225")).toBe("12:25");
    expect(normalizeTimeInput("0930")).toBe("09:30");
  });

  it("keeps a partially typed value usable while typing and deleting", () => {
    expect(normalizeTimeInput("")).toBe("");
    expect(normalizeTimeInput("1")).toBe("1");
    expect(normalizeTimeInput("12")).toBe("12");
    expect(normalizeTimeInput("122")).toBe("12:2");
  });

  it("accepts a value that already contains a colon", () => {
    expect(normalizeTimeInput("12:25")).toBe("12:25");
  });

  it("ignores stray characters and extra digits", () => {
    expect(normalizeTimeInput("12a25")).toBe("12:25");
    expect(normalizeTimeInput("122599")).toBe("12:25");
  });
});
