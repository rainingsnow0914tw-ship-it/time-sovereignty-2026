import { z } from "zod";

import type { AiProvider } from "../providers/ai/types";
import { AgentRunTraceSchema } from "../domain/agents/schemas";

// The voice partner is allowed to admit it does not know something. Saying so
// and stopping there is still a dead end for the user, so it may look one
// thing up mid-conversation. Every guard here exists because search is the
// most expensive thing this product does: one live run measured 23,877 tokens,
// roughly 58% of a week's budget.
export const MAX_VOICE_SEARCHES_PER_SESSION = 2;

export const VOICE_SEARCH_TOOL = {
  type: "function" as const,
  name: "look_up",
  // First wording said "prefer answering directly; if unsure, do not" — and it
  // never once fired. The model always believed it knew. But an unverified
  // fluent answer and a sourced one sound identical to the listener, which is
  // the whole reason this tool exists, so the trigger is now stated as a duty.
  description:
    "Look something up on the web. Call this BEFORE answering whenever she asks about the world rather than about herself: health, symptoms, safety, how something works, what is recommended, anything that changes over time, any specific product, place, or organisation. Fluency is not knowledge — if your answer would rest on memory alone and she could be harmed or misled by it being out of date, you must look it up instead of answering. The one hard exception: never search anything about her own goal, plan, schedule, history, or feelings. You already have those, and searching for them is both wrong and expensive.",
  parameters: {
    type: "object" as const,
    properties: {
      query: {
        type: "string" as const,
        description:
          "A short, self-contained search question. It must make sense on its own, without the conversation.",
      },
      reason: {
        type: "string" as const,
        description:
          "One short clause naming what you do not know. Spoken back to the user so she knows why you paused.",
      },
    },
    required: ["query", "reason"],
    additionalProperties: false,
  },
} as const;

export const VoiceSearchArgumentsSchema = z
  .object({
    query: z.string().trim().min(2).max(300),
    reason: z.string().trim().min(1).max(160),
  })
  .strict();

export type VoiceSearchArguments = z.infer<typeof VoiceSearchArgumentsSchema>;

export interface VoiceToolCall {
  callId: string;
  arguments: VoiceSearchArguments;
}

type RealtimeToolEventShape = {
  type?: unknown;
  name?: unknown;
  call_id?: unknown;
  arguments?: unknown;
};

// The realtime channel delivers arguments as a JSON string once the model has
// finished emitting them. Anything malformed is dropped rather than thrown:
// a bad tool call must never take down a live conversation.
export function parseVoiceToolCall(raw: string): VoiceToolCall | null {
  let event: RealtimeToolEventShape;
  try {
    event = JSON.parse(raw) as RealtimeToolEventShape;
  } catch {
    return null;
  }
  if (event.type !== "response.function_call_arguments.done") return null;
  if (event.name !== VOICE_SEARCH_TOOL.name) return null;
  if (typeof event.call_id !== "string" || !event.call_id) return null;
  if (typeof event.arguments !== "string") return null;

  try {
    const parsed = VoiceSearchArgumentsSchema.safeParse(
      JSON.parse(event.arguments),
    );
    return parsed.success
      ? { callId: event.call_id, arguments: parsed.data }
      : null;
  } catch {
    return null;
  }
}

// Handing a result back is two events: the output item, then permission to
// speak again. They are returned together so a caller cannot send one and
// forget the other, which would leave the user in silence.
export function buildVoiceToolResultEvents(callId: string, output: string) {
  return [
    {
      type: "conversation.item.create" as const,
      item: {
        type: "function_call_output" as const,
        call_id: callId,
        output,
      },
    },
    { type: "response.create" as const },
  ];
}

export const VoiceSearchAnswerSchema = z
  .object({
    // Spoken aloud, so it is measured in breaths rather than paragraphs.
    spokenAnswer: z.string().trim().min(1).max(600),
    // Naming the source out loud is what separates this from the model simply
    // sounding confident.
    sources: z.array(z.string().trim().min(1).max(160)).max(3),
    // The honest option. Weak or contradictory evidence must reach the user as
    // weak evidence, not as a clean answer.
    evidenceIsWeak: z.boolean(),
  })
  .strict();

export type VoiceSearchAnswer = z.infer<typeof VoiceSearchAnswerSchema>;

const SEARCH_RULES_ZH = `你正在替一個語音對話查資料。你的回答會被直接唸給使用者聽。

- 用兩三句話講完，像人在講話，不要條列、不要標題。
- 說出你參考的來源名稱（機構或網站），不要唸網址。
- 證據薄弱、來源互相矛盾，或這件事因人而異時，evidenceIsWeak 設為 true，並在話裡直說「這件事沒有定論」。
- 絕對不要編造來源。查不到就說查不到。
- 不要給她個人化的醫療或財務指示。可以講一般性的做法，並提醒該問專業人士。
- 不要替她決定要不要做、要做幾次、什麼時候做——那是她自己的事。`;

const SEARCH_RULES_EN = `You are looking something up for a spoken conversation. Your answer will be read aloud to the user.

- Two or three sentences, spoken like a person. No bullets, no headings.
- Name the sources you used (the organisation or site), never read out URLs.
- When evidence is thin, sources disagree, or it genuinely varies by person, set evidenceIsWeak to true and say plainly that it is not settled.
- Never invent a source. If you found nothing, say you found nothing.
- Give no personalised medical or financial instructions. General practice is fine, alongside pointing her to a professional.
- Never decide for her whether to act, how much, or when. That part is hers.`;

export async function answerVoiceSearch(options: {
  provider: AiProvider;
  query: string;
  goal: string;
  locale: "zh-TW" | "en";
  runId: string;
  safetyIdentifier?: string;
}): Promise<{ answer: VoiceSearchAnswer; trace: unknown }> {
  const result = await options.provider.generateStructured(
    {
      runId: options.runId,
      agent: "CHIEF_OF_STAFF",
      scenario: "VOICE_WEB_SEARCH",
      outputSchemaName: "VoiceSearchAnswer",
      inputSummary:
        "External lookup during a spoken check-in; no decision and no memory change is made here.",
      input: {
        // The goal travels as context so the answer lands in her situation,
        // but it is never itself the thing being searched for.
        goalContext: options.goal,
        question: options.query,
      },
      additionalInstructions:
        options.locale === "zh-TW" ? SEARCH_RULES_ZH : SEARCH_RULES_EN,
      safetyIdentifier: options.safetyIdentifier,
      webSearch: { returnTokenBudget: "default" },
    },
    VoiceSearchAnswerSchema,
  );
  return {
    answer: result.output,
    trace: AgentRunTraceSchema.parse(result.trace),
  };
}

// What the voice model receives back. It is deliberately plain text rather
// than JSON: the model speaks better from a sentence than from a structure.
export function formatVoiceSearchOutput(
  answer: VoiceSearchAnswer,
  locale: "zh-TW" | "en",
): string {
  const sources = answer.sources.length
    ? locale === "zh-TW"
      ? `來源：${answer.sources.join("、")}`
      : `Sources: ${answer.sources.join(", ")}`
    : locale === "zh-TW"
      ? "沒有找到可靠來源。"
      : "No reliable source was found.";
  const caveat = answer.evidenceIsWeak
    ? locale === "zh-TW"
      ? "這件事證據不足或說法不一，請照這個語氣講。"
      : "Evidence is thin or mixed; say so when you speak."
    : "";
  return [answer.spokenAnswer, sources, caveat].filter(Boolean).join("\n");
}

export function voiceSearchUnavailableOutput(locale: "zh-TW" | "en"): string {
  // Even the failure path must not end in "I cannot" — she has no reason to
  // know a lookup was attempted, so silence reads as the conversation wasting
  // her time.
  return locale === "zh-TW"
    ? "這次查不到資料。請直接告訴她你查不到，然後回到她原本的問題繼續談。"
    : "The lookup returned nothing. Tell her plainly that you could not find it, then return to what she was asking.";
}
