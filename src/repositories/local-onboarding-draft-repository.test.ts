import { describe, expect, it } from "vitest";

import { createLocalOnboardingDraftRepository } from "./local-onboarding-draft-repository";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

const draft = {
  version: 1 as const,
  stage: "why" as const,
  answers: {
    goal: "Practise English speaking",
    targetWindow: "One month",
    motivation: "",
  },
  plan: null,
  trace: null,
  support: {
    checkInFrequency: "DAILY" as const,
    preferredCheckInTime: "21:00",
    quietStart: "22:30",
    quietEnd: "08:00",
    timezone: "Asia/Macau",
    interventionIntensity: "BALANCED" as const,
    preferredTone: "Warm and direct",
    allowedChannels: ["TEXT" as const],
    progressSharingFormats: ["TEXT" as const],
    desiredFeedbackStyle: "Specific feedback",
    pauseConditions: "Illness or emergency",
    strongerFollowUpConditions: "Two unexplained delays",
    reviewFrequencyDays: 7,
  },
  scheduleTimes: ["09:00", "14:00", "19:00"],
  savedAt: "2026-07-20T00:00:00.000Z",
};

describe("local onboarding draft repository", () => {
  it("restores an unfinished multi-time goal without mixing profiles", () => {
    const shared = storage();
    const play = createLocalOnboardingDraftRepository(shared, "play");
    const demo = createLocalOnboardingDraftRepository(shared, "default");

    play.save(draft);

    expect(play.load()).toEqual(draft);
    expect(demo.load()).toBeNull();
  });

  it("clears only the selected draft", () => {
    const shared = storage();
    const repository = createLocalOnboardingDraftRepository(shared, "play");
    repository.save(draft);
    repository.clear();
    expect(repository.load()).toBeNull();
  });
});
