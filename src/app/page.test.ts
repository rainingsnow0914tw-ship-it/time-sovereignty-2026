import { describe, expect, it } from "vitest";

import { resolveOnboardingProfile } from "./page";

describe("home onboarding profile", () => {
  it("opens the real private workspace from either protected Cloud Run tag", () => {
    expect(
      resolveOnboardingProfile(
        undefined,
        "live-mobile---time-sovereignty-defqnamrrq-de.a.run.app",
      ),
    ).toBe("play");
    expect(
      resolveOnboardingProfile(
        undefined,
        "v2-private---time-sovereignty-defqnamrrq-de.a.run.app",
      ),
    ).toBe("play");
  });

  it("keeps the stable public front door on the safe default profile", () => {
    expect(
      resolveOnboardingProfile(
        undefined,
        "time-sovereignty-defqnamrrq-de.a.run.app",
      ),
    ).toBe("default");
  });

  it("still permits an explicit private play profile", () => {
    expect(resolveOnboardingProfile("play", "localhost:3000")).toBe("play");
  });
});
