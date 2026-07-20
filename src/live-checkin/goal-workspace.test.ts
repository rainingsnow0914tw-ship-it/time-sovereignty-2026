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

  it("schedules the first occurrence from the user's confirmed slot, not the plan's proposal", async () => {
    // 11:00 in Asia/Macau. The mock architect proposes either one hour later or
    // the next evening, so neither can coincide with the user's edited slot.
    const now = () => new Date("2026-07-20T03:00:00.000Z");
    const answers = {
      goal: "今天完成 5 次肩頸伸展",
      targetWindow: "今天",
      motivation: "因久坐導致肩膀緊繃",
    };
    const generated = await createMockGoalArchitectResult(answers, now);
    const record = createConfirmedOnboardingRecord({
      answers,
      plan: generated.output,
      agentTrace: generated.trace,
      support: {
        ...defaultSupportAgreementDraft,
        checkInFrequency: "DAILY",
        preferredCheckInTime: "11:30",
        timezone: "Asia/Macau",
      },
      now,
      idFactory: (prefix) => `${prefix}-stretch`,
    });

    const result = createInitialGoalWorkspace({
      ownerId: "private-single-device",
      requestId: "save-stretch",
      record,
      scheduleTimes: ["11:30"],
    });

    const localTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Macau",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(result.workspace.action.nextCheckAt as string));

    expect(localTime).toBe("11:30");
    expect(result.workspace.schedule.nextOccurrenceAt).toBe(
      result.workspace.action.nextCheckAt,
    );
    expect(result.workspace.action.nextCheckAt).not.toBe(
      record.plan.initialCheckInProposal.scheduledFor,
    );
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
