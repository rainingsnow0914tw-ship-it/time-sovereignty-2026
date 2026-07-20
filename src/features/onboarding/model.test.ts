import { describe, expect, it } from "vitest";

import {
  applyGoalCadenceRecommendation,
  applyPlanFeedback,
  createMockGoalArchitectResult,
  defaultSupportAgreementDraft,
  normalizeTimeInput,
  OnboardingAnswersSchema,
  previewNextCheckIn,
  suggestedScheduleTimes,
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

describe("next check-in preview", () => {
  const now = new Date("2026-07-20T05:00:00.000Z"); // 13:00 in Asia/Macau
  const support = {
    ...defaultSupportAgreementDraft,
    checkInFrequency: "DAILY" as const,
    timezone: "Asia/Macau",
    quietStart: "22:30",
    quietEnd: "08:00",
  };
  const endOfAfternoon = "2026-07-20T10:00:00.000Z"; // 18:00 in Asia/Macau

  it("states the instant the backend will really schedule", () => {
    const preview = previewNextCheckIn({
      scheduleTimes: ["15:00"],
      support,
      targetEndAt: endOfAfternoon,
      now,
    });

    expect(preview.kind).toBe("SCHEDULED");
    expect(preview.kind === "SCHEDULED" && preview.at).toBe(
      "2026-07-20T07:00:00.000Z",
    );
  });

  it("warns when every chosen time falls outside the goal window", () => {
    // 12:00 already passed today, and tomorrow's 12:00 is after the goal ends,
    // so the backend would silently fall back to the plan's proposal.
    const preview = previewNextCheckIn({
      scheduleTimes: ["12:00"],
      support,
      targetEndAt: endOfAfternoon,
      now,
    });

    expect(preview.kind).toBe("UNREACHABLE");
  });

  it("rolls to tomorrow when the goal has no end time", () => {
    const preview = previewNextCheckIn({
      scheduleTimes: ["12:00"],
      support,
      targetEndAt: null,
      now,
    });

    expect(preview.kind === "SCHEDULED" && preview.at).toBe(
      "2026-07-21T04:00:00.000Z",
    );
  });

  it("stays silent while a time is still being typed", () => {
    expect(
      previewNextCheckIn({ scheduleTimes: ["1"], support, targetEndAt: null, now }).kind,
    ).toBe("NONE");
    expect(
      previewNextCheckIn({ scheduleTimes: [], support, targetEndAt: null, now }).kind,
    ).toBe("NONE");
  });

  it("does not guess a weekly goal's allowed weekday", () => {
    const preview = previewNextCheckIn({
      scheduleTimes: ["15:00"],
      support: { ...support, checkInFrequency: "WEEKLY" },
      targetEndAt: null,
      now,
    });

    expect(preview.kind).toBe("NONE");
  });
});

describe("schedule suggestions from a plan", () => {
  const basePlan = async () =>
    (
      await createMockGoalArchitectResult(
        {
          goal: "每天三組橋式",
          targetWindow: "一個月",
          motivation: "保護下背",
        },
        () => new Date("2026-07-20T01:00:00.000Z"),
      )
    ).output;

  it("uses the sessions the model stated structurally", async () => {
    const plan = await basePlan();
    const times = suggestedScheduleTimes({
      ...plan,
      cadence: {
        ...plan.cadence,
        preferredCheckInTime: "09:00",
        additionalCheckInTimes: ["14:00", "19:00"],
      },
    });

    expect(times).toEqual(["09:00", "14:00", "19:00"]);
  });

  it("does not turn a time mentioned in an assumption into a session", async () => {
    const plan = await basePlan();
    const times = suggestedScheduleTimes({
      ...plan,
      cadence: {
        ...plan.cadence,
        preferredCheckInTime: "21:00",
        additionalCheckInTimes: null,
        rationale: "Protect one evening review.",
        completionSignal: "Thirty sessions are recorded.",
      },
      initialCheckInProposal: {
        ...plan.initialCheckInProposal,
        rationale: "Check in after the first real session.",
      },
      assumptionsNeedingConfirmation: [
        "假設你的一天從 09:00 開始，且 12:30 前後有空檔",
      ],
    });

    expect(times).toEqual(["21:00"]);
  });

  it("still reads sessions stated in the rhythm fields themselves", async () => {
    const plan = await basePlan();
    const times = suggestedScheduleTimes({
      ...plan,
      cadence: {
        ...plan.cadence,
        preferredCheckInTime: "09:00",
        additionalCheckInTimes: null,
        rationale: "三個時段：09:00、14:00 與 19:00 各一次。",
      },
    });

    expect(times).toEqual(["09:00", "14:00", "19:00"]);
  });
});
