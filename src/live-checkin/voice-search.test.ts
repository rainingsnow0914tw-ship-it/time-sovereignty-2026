import { describe, expect, it } from "vitest";

import {
  MAX_VOICE_SEARCHES_PER_SESSION,
  VOICE_SEARCH_TOOL,
  buildVoiceToolResultEvents,
  formatVoiceSearchOutput,
  parseVoiceToolCall,
  voiceSearchUnavailableOutput,
} from "./voice-search";

function toolEvent(args: unknown, overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    type: "response.function_call_arguments.done",
    name: VOICE_SEARCH_TOOL.name,
    call_id: "call_1",
    arguments: typeof args === "string" ? args : JSON.stringify(args),
    ...overrides,
  });
}

describe("reading a lookup request off the live channel", () => {
  it("accepts a well-formed call", () => {
    const call = parseVoiceToolCall(
      toolEvent({ query: "久坐下背痛的低強度替代活動", reason: "我不確定哪些動作安全" }),
    );
    expect(call?.callId).toBe("call_1");
    expect(call?.arguments.query).toContain("下背痛");
  });

  it("drops anything malformed instead of throwing", () => {
    // A bad tool call must never take down a conversation she is in the
    // middle of, so every one of these returns null rather than raising.
    expect(parseVoiceToolCall("not json")).toBeNull();
    expect(parseVoiceToolCall(toolEvent("{broken"))).toBeNull();
    expect(parseVoiceToolCall(toolEvent({ query: "x" }))).toBeNull();
    expect(parseVoiceToolCall(toolEvent({ query: "", reason: "r" }))).toBeNull();
    expect(parseVoiceToolCall(toolEvent({ query: "ok", reason: "r" }, { call_id: "" }))).toBeNull();
    expect(parseVoiceToolCall(toolEvent({ query: "ok", reason: "r" }, { name: "other" }))).toBeNull();
  });

  it("ignores ordinary conversation events", () => {
    expect(
      parseVoiceToolCall(
        JSON.stringify({ type: "response.done", name: VOICE_SEARCH_TOOL.name }),
      ),
    ).toBeNull();
  });
});

describe("handing the result back", () => {
  it("always follows the output with permission to speak", () => {
    const events = buildVoiceToolResultEvents("call_1", "answer");
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("conversation.item.create");
    expect(events[1].type).toBe("response.create");
  });
});

describe("what the voice actually receives", () => {
  it("names the sources it used", () => {
    const output = formatVoiceSearchOutput(
      { spokenAnswer: "可以試試散步。", sources: ["NHS", "NICE"], evidenceIsWeak: false },
      "zh-TW",
    );
    expect(output).toContain("NHS");
    expect(output).toContain("NICE");
    expect(output).not.toContain("證據不足");
  });

  it("passes weak evidence through as weak evidence", () => {
    const output = formatVoiceSearchOutput(
      { spokenAnswer: "說法不一。", sources: [], evidenceIsWeak: true },
      "zh-TW",
    );
    expect(output).toContain("沒有找到可靠來源");
    expect(output).toContain("證據不足");
  });

  it("never dead-ends the conversation when the lookup fails", () => {
    // She has no reason to know a lookup was attempted, so "I cannot" would
    // land as though the whole exchange was wasted.
    for (const locale of ["zh-TW", "en"] as const) {
      const output = voiceSearchUnavailableOutput(locale);
      expect(output.length).toBeGreaterThan(0);
      expect(output).toMatch(locale === "zh-TW" ? /繼續談/u : /return to what she was asking/u);
    }
  });
});

describe("the spending guard", () => {
  it("keeps the per-session ceiling low enough to matter", () => {
    // One measured live search cost 23,877 tokens. The cap is the reason a
    // long conversation cannot quietly spend a week's budget.
    expect(MAX_VOICE_SEARCHES_PER_SESSION).toBeLessThanOrEqual(2);
  });

  it("tells the model in its own description not to search her own life", () => {
    expect(VOICE_SEARCH_TOOL.description).toMatch(/never search anything about her own goal/iu);
  });

  it("states the trigger as a duty, because a suggestion never fired", () => {
    // Live evidence 2026-07-21: with "prefer answering directly", zero calls
    // reached /api/live/voice-search across a full spoken session.
    expect(VOICE_SEARCH_TOOL.description).toMatch(/call this BEFORE answering/iu);
    expect(VOICE_SEARCH_TOOL.description).toMatch(/must look it up/iu);
    expect(VOICE_SEARCH_TOOL.description).not.toMatch(/if you are unsure whether to search, do not/iu);
  });
});
