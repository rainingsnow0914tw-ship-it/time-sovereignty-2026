import { describe, expect, it } from "vitest";

import { GoalPlanOutputSchema } from "../domain/goals/schemas";
import {
  assertGoalCadenceTiming,
  assertGoalCadenceFollowUp,
  GoalCadenceTimingError,
  maximumInitialCheckInDelayMs,
} from "./goal-cadence";

function plan(options: {
  kind: "SPRINT" | "PROJECT" | "HABIT";
  scheduledFor: string;
  targetEndAt?: string | null;
}) {
  return GoalPlanOutputSchema.parse({
    goalSummary: "Finish one meaningful outcome",
    motivation: "It matters",
    targetWindow: "This week",
    cadence: {
      kind: options.kind,
      targetEndAt: options.targetEndAt ?? null,
      checkInFrequency: options.kind === "SPRINT" ? "CUSTOM" : "DAILY",
      preferredCheckInTime: "19:30",
      reviewFrequencyDays: options.kind === "SPRINT" ? 1 : 7,
      rationale: "Match support to the real target window.",
      completionSignal: "The user confirms the outcome is complete.",
    },
    feasibilityNotes: [],
    firstMilestone: "Create visible evidence",
    bestNextAction: "Start now",
    minimumViableAction: "Open the work",
    initialCheckInProposal: {
      scheduledFor: options.scheduledFor,
      rationale: "Return while the next action is still relevant.",
    },
    assumptionsNeedingConfirmation: [],
  });
}

describe("goal cadence timing guard", () => {
  const now = new Date("2026-07-18T03:00:00.000Z");

  it("keeps sprint support inside the next day and before its target", () => {
    expect(() =>
      assertGoalCadenceTiming(
        plan({
          kind: "SPRINT",
          scheduledFor: "2026-07-18T04:00:00.000Z",
          targetEndAt: "2026-07-18T12:00:00.000Z",
        }),
        now,
      ),
    ).not.toThrow();
  });

  it("rejects a weekly-style first check-in for a one-night sprint", () => {
    expect(() =>
      assertGoalCadenceTiming(
        plan({
          kind: "SPRINT",
          scheduledFor: "2026-07-20T03:00:00.000Z",
        }),
        now,
      ),
    ).toThrow(GoalCadenceTimingError);
  });

  it("rejects a first check-in after the target end", () => {
    expect(() =>
      assertGoalCadenceTiming(
        plan({
          kind: "PROJECT",
          scheduledFor: "2026-07-20T03:00:00.000Z",
          targetEndAt: "2026-07-19T03:00:00.000Z",
        }),
        now,
      ),
    ).toThrow("before the target end time");
  });

  it("assigns different maximum first-return windows", () => {
    expect(maximumInitialCheckInDelayMs("SPRINT")).toBeLessThan(
      maximumInitialCheckInDelayMs("HABIT"),
    );
    expect(maximumInitialCheckInDelayMs("HABIT")).toBeLessThan(
      maximumInitialCheckInDelayMs("PROJECT"),
    );
  });

  it("keeps later sprint follow-ups inside the same bounded rhythm", () => {
    const sprint = plan({
      kind: "SPRINT",
      scheduledFor: "2026-07-18T04:00:00.000Z",
      targetEndAt: "2026-07-18T12:00:00.000Z",
    }).cadence;
    expect(() =>
      assertGoalCadenceFollowUp({
        cadence: sprint,
        now,
        nextFollowUpAt: "2026-07-19T12:00:00.000Z",
      }),
    ).toThrow(GoalCadenceTimingError);
  });
});
