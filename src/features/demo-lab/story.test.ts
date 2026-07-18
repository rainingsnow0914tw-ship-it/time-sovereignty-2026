import { describe, expect, it } from "vitest";

import { LocalOnboardingRecordSchema } from "../../repositories/local-onboarding-repository";
import { advanceSimulation, createInitialJourneyState } from "../journey/model";
import { createDemoLabRecord } from "./story";

describe("Demo Lab story", () => {
  it("uses a schema-valid isolated record in both languages", () => {
    for (const locale of ["zh-TW", "en"] as const) {
      const record = createDemoLabRecord(locale);
      expect(LocalOnboardingRecordSchema.safeParse(record).success).toBe(true);
      expect(record.goal.id).toContain("demo-lab");
      expect(record.agentTrace.provider).toBe("mock");
      expect(record.agentTrace.model).toBe("mock:scripted-demo-lab");
    }
  });

  it("compresses the full recovery, memory, progress, and calibration story", () => {
    const record = createDemoLabRecord("zh-TW");
    let state = createInitialJourneyState(record);

    for (let index = 0; index < 7; index += 1) {
      state = advanceSimulation(
        state,
        record,
        new Date(`2026-07-${String(index + 2).padStart(2, "0")}T19:30:00+08:00`),
      );
    }

    expect(state.simulatedDay).toBe(30);
    expect(state.simulationComplete).toBe(true);
    const eventKinds = state.events.map((event) => event.kind);
    for (const kind of [
      "DELAY",
      "RECOVERY",
      "PROGRESS",
      "MEMORY",
      "CALIBRATION",
      "RESUME_POINT",
    ] as const) {
      expect(eventKinds).toContain(kind);
    }
    expect(new Set(state.agentTraces.map((trace) => trace.agent))).toEqual(
      new Set([
        "GOAL_ARCHITECT",
        "CHIEF_OF_STAFF",
        "COMMITMENT_RECOVERY",
        "MEMORY_CURATOR",
      ]),
    );
    expect(state.agentTraces.every((trace) => trace.provider === "mock")).toBe(
      true,
    );
  });
});
