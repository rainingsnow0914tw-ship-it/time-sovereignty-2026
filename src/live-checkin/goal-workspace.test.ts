import { describe, expect, it } from "vitest";

import {
  createMockGoalArchitectResult,
  defaultSupportAgreementDraft,
} from "../features/onboarding/model";
import { createConfirmedOnboardingRecord } from "../repositories/local-onboarding-repository";
import { createInitialGoalWorkspace } from "./goal-workspace";

describe("initial cloud goal workspace", () => {
  it("turns one confirmed browser record into one stable-owner cloud goal", async () => {
    const now = () => new Date("2026-07-20T00:00:00.000Z");
    const answers = {
      goal: "每天練習英語口說",
      targetWindow: "一個月",
      motivation: "我想用英語學習 AI",
    };
    const generated = await createMockGoalArchitectResult(answers, now);
    const record = createConfirmedOnboardingRecord({
      answers,
      plan: generated.output,
      agentTrace: generated.trace,
      support: {
        ...defaultSupportAgreementDraft,
        checkInFrequency: "DAILY",
        preferredCheckInTime: "21:00",
        timezone: "Asia/Macau",
      },
      now,
      idFactory: (prefix) => `${prefix}-english`,
    });

    const result = createInitialGoalWorkspace({
      ownerId: "private-single-device",
      requestId: "save-english",
      record,
      scheduleTimes: ["09:00", "15:00", "21:00"],
    });

    expect(result.workspace.ownerId).toBe("private-single-device");
    expect(result.workspace.id).toBe(record.goal.id);
    expect(result.workspace.schedule.slots).toHaveLength(3);
    expect(result.workspace.currentPlanRevisionId).toBe(
      result.planRevision.id,
    );
    expect(result.planRevision.assumptions.every(
      (assumption) => assumption.disposition === "PENDING",
    )).toBe(true);
  });

  it("maps a custom cadence to a meaningful AI-led schedule mode", async () => {
    const now = () => new Date("2026-07-20T00:00:00.000Z");
    const answers = {
      goal: "今晚完成一份短稿",
      targetWindow: "今晚",
      motivation: "我需要交稿",
    };
    const generated = await createMockGoalArchitectResult(answers, now);
    const record = createConfirmedOnboardingRecord({
      answers,
      plan: generated.output,
      agentTrace: generated.trace,
      support: {
        ...defaultSupportAgreementDraft,
        checkInFrequency: "CUSTOM",
        timezone: "Asia/Macau",
      },
      now,
      idFactory: (prefix) => `${prefix}-sprint`,
    });

    expect(
      createInitialGoalWorkspace({
        ownerId: "private-single-device",
        requestId: "save-sprint",
        record,
      }).workspace.schedule.mode,
    ).toBe("AI_LED");
  });
});
