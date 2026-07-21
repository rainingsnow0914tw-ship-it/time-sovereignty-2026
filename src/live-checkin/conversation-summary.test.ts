import { describe, expect, it } from "vitest";

import type { AiProvider } from "../providers/ai/types";
import {
  ConversationSummarySchema,
  summarizeVoiceConversation,
} from "./conversation-summary";

const trace = {
  runId: "voice-summary-run",
  agent: "CHIEF_OF_STAFF" as const,
  provider: "openai" as const,
  model: "gpt-5.6-sol",
  outputSchemaName: "ConversationSummary",
  inputSummary:
    "Spoken check-in transcript for review before submission; no decision is made here.",
  tokenUsage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
  status: "COMPLETED" as const,
  startedAt: "2026-07-21T07:00:00.000Z",
  completedAt: "2026-07-21T07:00:02.000Z",
};

// The shape carries the merge semantics Chloe defined: amount and timing hold
// a single latest value, circumstances accumulate, and questions exist so the
// model can admit it could not tell what she meant.
describe("conversation summary contract", () => {
  const valid = {
    amount: "一天一次",
    timing: "十分鐘後",
    completion: null,
    circumstances: ["腰不舒服"],
    questions: [],
    reportText: "改成一天一次，十分鐘後做。腰不太舒服。",
  };

  it("accepts a summary where each dimension holds its latest value", () => {
    expect(ConversationSummarySchema.parse(valid)).toMatchObject({
      amount: "一天一次",
      timing: "十分鐘後",
    });
  });

  it("allows a dimension she never mentioned to stay empty", () => {
    const parsed = ConversationSummarySchema.parse({
      ...valid,
      amount: null,
      timing: null,
      circumstances: [],
    });

    expect(parsed.amount).toBeNull();
    expect(parsed.circumstances).toEqual([]);
  });

  it("carries several circumstances because they accumulate", () => {
    const parsed = ConversationSummarySchema.parse({
      ...valid,
      circumstances: ["腰不舒服", "休息後好一點"],
    });

    expect(parsed.circumstances).toHaveLength(2);
  });

  it("carries questions so the model can ask instead of guessing", () => {
    const parsed = ConversationSummarySchema.parse({
      ...valid,
      questions: ["妳說的『改一下』是指次數還是時間？"],
    });

    expect(parsed.questions).toHaveLength(1);
  });

  it("always produces text for her to review before submitting", () => {
    expect(
      ConversationSummarySchema.safeParse({ ...valid, reportText: "" }).success,
    ).toBe(false);
  });

  it("rejects an unknown field so the contract cannot drift", () => {
    expect(
      ConversationSummarySchema.safeParse({ ...valid, decision: "COMPLETED" })
        .success,
    ).toBe(false);
  });
});

describe("summarizing a spoken check-in", () => {
  it("sends the transcript and the merge rules, and decides nothing itself", async () => {
    let captured: Record<string, unknown> | null = null;
    const provider: AiProvider = {
      async generateStructured(request, outputSchema) {
        captured = request as unknown as Record<string, unknown>;
        return {
          output: outputSchema.parse({
            amount: "一天一次",
            timing: "十分鐘後",
            completion: null,
            circumstances: ["腰不舒服"],
            questions: [],
            reportText: "改成一天一次，十分鐘後做。腰不太舒服。",
          }),
          trace,
        };
      },
    };

    const { summary } = await summarizeVoiceConversation({
      provider,
      transcript: "嗯，可是\n我想要改成一天一次，可以嗎？\n我的腰有點不舒服，十分鐘後執行",
      goal: "每天完成五次肩頸伸展",
      currentAction: "完成第一次伸展",
      locale: "zh-TW",
      runId: "voice-summary-test",
    });

    expect(summary.amount).toBe("一天一次");
    expect(captured!.scenario).toBe("VOICE_CONVERSATION_SUMMARY");
    expect(captured!.outputSchemaName).toBe("ConversationSummary");
    expect(String(captured!.additionalInstructions)).toContain(
      "用最後說的那一個",
    );
    expect(String(captured!.additionalInstructions)).toContain("不要猜");
    // Nothing about deciding, completing, or scheduling belongs in this call.
    expect(String(captured!.inputSummary)).toContain("no decision is made here");
  });
});
