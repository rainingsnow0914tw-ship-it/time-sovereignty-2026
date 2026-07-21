import { describe, expect, it } from "vitest";

import { APP_CAPABILITIES } from "./app-capabilities";
import { instructionsFor } from "../../providers/ai/openai-provider";

describe("telling the planning agents what the app can do", () => {
  it("reaches every agent that writes an action the user will read", () => {
    // The plan that shipped told her to set five alarms and tally 1/5, 2/5.
    // Nothing in the prompt had ever told the model the app schedules its own
    // check-ins, so it wrote like a coach with no software behind it.
    expect(instructionsFor("GOAL_ARCHITECT")).toContain(APP_CAPABILITIES);
    expect(instructionsFor("CHIEF_OF_STAFF")).toContain(APP_CAPABILITIES);
  });

  it("names the limits as explicitly as the abilities", () => {
    // Listing only what it can do invites the opposite failure: promising a
    // calendar entry that never appears. Believing something is handled when
    // it is not is worse than being asked to do it yourself.
    expect(APP_CAPABILITIES).toMatch(/cannot do these things, so never promise them/iu);
    expect(APP_CAPABILITIES).toMatch(/Set an alarm on the phone, or write anything into a calendar/iu);
    expect(APP_CAPABILITIES).toMatch(/no screen showing 1\/5, 2\/5/iu);
  });

  it("keeps the memory curator out of it", () => {
    // It proposes memory, never actions, so capability text would only be
    // tokens it has to read past.
    expect(instructionsFor("MEMORY_CURATOR")).not.toContain(APP_CAPABILITIES);
  });
});
