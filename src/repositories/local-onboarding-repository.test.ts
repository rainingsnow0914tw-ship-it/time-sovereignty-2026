import { describe, expect, it } from "vitest";

import {
  createMockGoalArchitectResult,
  defaultSupportAgreementDraft,
} from "../features/onboarding/model";
import {
  createConfirmedOnboardingRecord,
  createLocalOnboardingRepository,
  LOCAL_ONBOARDING_STORAGE_KEY,
  onboardingStorageKey,
  type StorageLike,
} from "./local-onboarding-repository";

function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe("local onboarding repository", () => {
  it("persists a confirmed goal, first action, support agreement, and trace", async () => {
    const now = () => new Date("2026-07-16T10:00:00.000Z");
    const answers = {
      goal: "Finish Build Week",
      targetWindow: "Before Sunday",
      motivation: "I want the product to help in real life",
    };
    const generated = await createMockGoalArchitectResult(answers, now);
    let id = 0;
    const record = createConfirmedOnboardingRecord({
      answers,
      plan: generated.output,
      agentTrace: generated.trace,
      support: {
        checkInFrequency: "DAILY",
        preferredCheckInTime: "19:30",
        quietStart: "22:30",
        quietEnd: "08:00",
        timezone: "Asia/Shanghai",
        interventionIntensity: "BALANCED",
        preferredTone: "Warm and direct",
        allowedChannels: ["TEXT", "TTS", "VOICE"],
        progressSharingFormats: ["TEXT", "PHOTO", "VOICE"],
        desiredFeedbackStyle: "Concrete and concise",
        pauseConditions: "Illness or an explicit pause request",
        strongerFollowUpConditions: "Two repeated delays",
        reviewFrequencyDays: 7,
      },
      now,
      idFactory: (prefix) => `${prefix}-${++id}`,
    });
    const storage = createMemoryStorage();
    const repository = createLocalOnboardingRepository(storage);

    repository.save(record);
    const restored = repository.load();

    expect(restored).toMatchObject({
      version: 1,
      goal: { status: "ACTIVE", supportAgreementId: "support-3" },
      action: { status: "READY", id: "action-2" },
      supportAgreement: {
        checkInFrequency: "DAILY",
        interventionIntensity: "BALANCED",
      },
      agentTrace: { provider: "mock", agent: "GOAL_ARCHITECT" },
    });
  });

  it("fails closed when local data is malformed", () => {
    const storage = createMemoryStorage();
    storage.setItem(LOCAL_ONBOARDING_STORAGE_KEY, "{not-json");

    expect(createLocalOnboardingRepository(storage).load()).toBeNull();
  });

  it("upgrades a saved pre-cadence journey instead of discarding it", async () => {
    const now = () => new Date("2026-07-18T03:00:00.000Z");
    const answers = {
      goal: "今晚完成黑客松提交",
      targetWindow: "今天晚上十一點前",
      motivation: "我要交出真正能使用的作品",
    };
    const generated = await createMockGoalArchitectResult(answers, now);
    const record = createConfirmedOnboardingRecord({
      answers,
      plan: generated.output,
      agentTrace: generated.trace,
      support: defaultSupportAgreementDraft,
      now,
      idFactory: (prefix) => `${prefix}-legacy`,
    });
    const legacy = JSON.parse(JSON.stringify(record)) as {
      plan: { cadence?: unknown };
    };
    delete legacy.plan.cadence;
    const storage = createMemoryStorage();
    storage.setItem(onboardingStorageKey("play"), JSON.stringify(legacy));

    const restored = createLocalOnboardingRepository(storage, "play").load();

    expect(restored?.goal.title).toBe("今晚完成黑客松提交");
    expect(restored?.plan.cadence.kind).toBe("SPRINT");
    expect(restored?.plan.cadence.checkInFrequency).toBe("CUSTOM");
  });

  it("clears the saved journey", () => {
    const storage = createMemoryStorage();
    storage.setItem(LOCAL_ONBOARDING_STORAGE_KEY, "placeholder");
    const repository = createLocalOnboardingRepository(storage);

    repository.clear();

    expect(storage.getItem(LOCAL_ONBOARDING_STORAGE_KEY)).toBeNull();
  });

  it("keeps the recording profile and private play profile isolated", () => {
    const storage = createMemoryStorage();
    storage.setItem(LOCAL_ONBOARDING_STORAGE_KEY, "recording-state");
    storage.setItem(onboardingStorageKey("play"), "play-state");

    createLocalOnboardingRepository(storage, "play").clear();

    expect(onboardingStorageKey()).toBe(LOCAL_ONBOARDING_STORAGE_KEY);
    expect(storage.getItem(LOCAL_ONBOARDING_STORAGE_KEY)).toBe(
      "recording-state",
    );
    expect(storage.getItem(onboardingStorageKey("play"))).toBeNull();
  });
});
