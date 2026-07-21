import { z } from "zod";

import type { AiProvider } from "../providers/ai/types";
import { AgentRunTraceSchema } from "../domain/agents/schemas";

// A spoken check-in is not a transcript problem. Saying "five is too many,
// make it once" and then "in ten minutes" changes two different things, while
// "let's do two" followed by "one is enough" changes the same thing twice.
// Merging that correctly is a language judgement, so the rules live in the
// prompt and the model decides — including the option to say it is unsure.
export const ConversationSummarySchema = z
  .object({
    // Each field holds the latest value the user settled on, or null when she
    // never touched that dimension.
    amount: z.string().trim().min(1).max(120).nullable(),
    timing: z.string().trim().min(1).max(120).nullable(),
    completion: z.string().trim().min(1).max(160).nullable(),
    // Circumstances accumulate: having had back pain and then feeling better
    // is different information from never having had it.
    circumstances: z.array(z.string().trim().min(1).max(160)).max(6),
    // The third option beside keep and replace. When the model cannot tell
    // what she meant it asks her rather than guessing silently.
    questions: z.array(z.string().trim().min(1).max(200)).max(3),
    // What actually goes into the report field for her to review and edit.
    reportText: z.string().trim().min(1).max(1_200),
  })
  .strict();

export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;

const MERGE_RULES_ZH = `你在整理一段語音對話的逐字紀錄，讓使用者可以檢查後送出。

合併規則：
- 同一件事被改過，用最後說的那一個。例如先說做兩次、後來說改成一次，結論就是一次。
- 不同面向並存，不要互相覆蓋。份量、時間、身體狀況是三件事。
- 保留變化的過程，不只是結論。「痛過但緩解了」和「從來不痛」是不同的資訊。
- 丟掉語助詞、咳嗽、重複和寒暄。但如果閒聊裡藏著承諾或情緒，那一句要留。
- 不要加入她沒說過的東西，也不要替她決定她沒決定的事。

真的判斷不出來她的意思時，不要猜——寫進 questions，讓她自己回答。沒有疑問就給空陣列。

reportText 是要放進回報欄給她過目的內容。用她自己的語氣，簡短、具體、可以直接送出。
不要寫成報告格式，也不要加標題或客套話。`;

const MERGE_RULES_EN = `You are tidying the transcript of a spoken check-in so the user can review it and submit.

Merging rules:
- When the same thing changed, keep the last version she settled on. "Let's do two" then "one is enough" means one.
- Different dimensions coexist. Amount, timing, and physical condition are three separate things.
- Preserve the change itself, not only the conclusion. "It hurt but eased off" is different information from "it never hurt".
- Drop fillers, coughs, repetitions, and small talk — unless a promise or a feeling is buried in it.
- Never add anything she did not say, and never decide something she left open.

When you genuinely cannot tell what she meant, do not guess: put it in questions so she can answer. Return an empty array when nothing is unclear.

reportText is what goes into the report field for her to read before submitting. Use her own register, keep it short and concrete, no headings and no pleasantries.`;

export async function summarizeVoiceConversation(options: {
  provider: AiProvider;
  transcript: string;
  goal: string;
  currentAction: string;
  locale: "zh-TW" | "en";
  runId: string;
  safetyIdentifier?: string;
}): Promise<{ summary: ConversationSummary; trace: unknown }> {
  const result = await options.provider.generateStructured(
    {
      runId: options.runId,
      agent: "CHIEF_OF_STAFF",
      scenario: "VOICE_CONVERSATION_SUMMARY",
      outputSchemaName: "ConversationSummary",
      inputSummary:
        "Spoken check-in transcript for review before submission; no decision is made here.",
      input: {
        goal: options.goal,
        currentAction: options.currentAction,
        transcript: options.transcript,
      },
      additionalInstructions:
        options.locale === "zh-TW" ? MERGE_RULES_ZH : MERGE_RULES_EN,
      safetyIdentifier: options.safetyIdentifier,
    },
    ConversationSummarySchema,
  );
  return {
    summary: result.output,
    trace: AgentRunTraceSchema.parse(result.trace),
  };
}
