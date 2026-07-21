import { describe, expect, it } from "vitest";

import { OpenAiResponsesProvider } from "../providers/ai/openai-provider";
import { answerVoiceSearch, formatVoiceSearchOutput } from "./voice-search";

// Structured output and web_search have never run together against the real
// API. A green unit suite has already lied about exactly this kind of thing
// once (return_token_budget typechecked and 400'd), so this contract is proved
// against the live endpoint, deliberately, not in CI.
const enabled = process.env.RUN_LIVE_VOICE_SEARCH === "1";

describe.skipIf(!enabled)("voice lookup against the live API", () => {
  it("searches, parses into the schema, and names its sources", async () => {
    const { answer, trace } = await answerVoiceSearch({
      provider: new OpenAiResponsesProvider(),
      query: "久坐造成下背疼痛時，有哪些低強度的替代活動比較安全？",
      goal: "每天完成一段專注工作時段",
      locale: "zh-TW",
      runId: "live-voice-search-check",
    });

    console.log("\n--- what the voice would receive ---");
    console.log(formatVoiceSearchOutput(answer, "zh-TW"));
    console.log(
      `\nmodel ${(trace as { model?: string }).model} · sources ${answer.sources.length} · weak ${answer.evidenceIsWeak} · tokens ${
        (trace as { tokenUsage?: { totalTokens?: number } }).tokenUsage?.totalTokens ?? "?"
      }\n`,
    );

    expect(answer.spokenAnswer.length).toBeGreaterThan(0);
    expect(answer.sources.length).toBeGreaterThan(0);
  }, 180_000);
});
