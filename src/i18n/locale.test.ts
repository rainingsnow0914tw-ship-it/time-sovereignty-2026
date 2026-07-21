import { describe, expect, it } from "vitest";

import { speechLanguageForLocale, translateUiText } from "./locale";

describe("native interface localization", () => {
  it("translates the corrected product meaning into Traditional Chinese", () => {
    expect(
      translateUiText(
        "Because I want to prove I can build something that genuinely protects people’s time…",
        "zh-TW",
      ),
    ).toContain("不只想參加比賽");
  });

  it("handles JSX whitespace and dynamic journey patterns", () => {
    expect(
      translateUiText(
        "  One meaningful goal. A plan you approve. Support that adapts without taking control away from you.  ",
        "zh-TW",
      ),
    ).toContain("主導權");
    expect(translateUiText("Simulated Day 7", "zh-TW")).toBe("模擬第 7 天");
    expect(
      translateUiText(
        "You planned to continue “Finish the evidence”. What is true right now?",
        "zh-TW",
      ),
    ).toBe("你原本打算繼續「Finish the evidence」。現在真實的情況是什麼？");
  });

  it("leaves English and user-authored text unchanged", () => {
    expect(translateUiText("How should I support you?", "en")).toBe(
      "How should I support you?",
    );
    expect(translateUiText("Chloe 自己寫的目標", "zh-TW")).toBe(
      "Chloe 自己寫的目標",
    );
  });

  it("maps the selected interface language to an explicit speech locale", () => {
    expect(speechLanguageForLocale("zh-TW")).toBe("zh-TW");
    expect(speechLanguageForLocale("en")).toBe("en-US");
  });
});

describe("headings that carry a count", () => {
  it("translates the assumptions heading, count and all", () => {
    // It rendered as English inside a Chinese page because the JSX split it
    // into a string plus an interpolated number, so no key could match.
    expect(translateUiText("Assumptions to confirm (2)", "zh-TW")).toBe(
      "待確認的假設（2）",
    );
    expect(translateUiText("Assumptions to confirm (0)", "zh-TW")).toBe(
      "待確認的假設（0）",
    );
  });
});
