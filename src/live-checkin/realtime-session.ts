import { z } from "zod";

import { sha256 } from "./session-auth";
import { VOICE_SEARCH_TOOL } from "./voice-search";

export const REALTIME_MODEL = "gpt-realtime-2.1";
export const REALTIME_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
export const REALTIME_VOICE = "marin";
// A real answer runs longer than a greeting. At 1_024 the voice was cut off
// mid-sentence once it said anything substantial — reported from the phone as
// "講到不知道幾秒就被截斷". This caps runaway responses without truncating
// ordinary ones; it bills only what is actually spoken.
export const REALTIME_MAX_OUTPUT_TOKENS = 4_096;
export const MAX_REALTIME_SDP_BYTES = 200_000;

export const RealtimeLocaleSchema = z.enum(["zh-TW", "en"]);
export type RealtimeLocale = z.infer<typeof RealtimeLocaleSchema>;

export const RealtimeSdpSchema = z
  .string()
  .min(4)
  .max(MAX_REALTIME_SDP_BYTES)
  .refine((value) => value.startsWith("v=0\r\n") || value.startsWith("v=0\n"), {
    message: "Invalid WebRTC SDP offer.",
  })
  .refine((value) => !value.includes("\0"), {
    message: "Invalid WebRTC SDP offer.",
  });

export type RealtimeSessionConfig = ReturnType<
  typeof buildRealtimeSessionConfig
>;

export class RealtimeUpstreamError extends Error {
  constructor(public readonly status: number) {
    super("OpenAI Realtime session negotiation failed.");
    this.name = "RealtimeUpstreamError";
  }
}

export function realtimeTranscriptionLanguage(
  locale: RealtimeLocale,
): "zh" | "en" {
  return locale === "zh-TW" ? "zh" : "en";
}

export function buildRealtimeSessionConfig(locale: RealtimeLocale) {
  const traditionalChinese = locale === "zh-TW";
  return {
    type: "realtime" as const,
    model: REALTIME_MODEL,
    output_modalities: ["audio"] as const,
    max_output_tokens: REALTIME_MAX_OUTPUT_TOKENS,
    instructions: traditionalChinese
      ? "你是 Time Sovereignty 的語音夥伴。使用者按下按鈕找你，通常是因為卡住了、做不到原本答應的事，或想在決定之前先跟人談一談。先聽懂她的處境，再回應她本人說的話；不要覆述她已經看得到的計畫。可以提出想法、問一個具體的問題、或幫她把過大的行動縮小成今天做得到的版本。承認你不知道的事，不要編造。她只要問到「她自己以外的世界」——身體狀況、安全、某件事怎麼運作、一般建議、會隨時間改變的資訊——**先用 look_up 查，再回答**，不要憑印象講。你講得流暢不等於你講得正確，而她聽不出差別。查之前先用一句話告訴她你要去確認什麼。唯一的例外是她自己的目標、計畫、行程、過去紀錄和心情，那些你已經知道了，不准拿去查。\n\n她說的每一句話都會即時寫進畫面下方的回報欄。當她提出調整（例如把五次改成一次、或改到十分鐘後），要回覆你已經把這個重點記在下面了，並告訴她按下送出之後就會照這個重新安排。用「我記下來了」這種她三秒內就能低頭驗證的說法，讓她不必自己記住剛才講過什麼。\n\n但不要越過這條線：不要宣布她已經完成、延後、縮小或休息，也不要說你已經改好了設定或排好了時間——那些要等她送出、由 GPT-5.6 判斷、再由她本人確認才成立。同樣地，也不要用「我做不到」來回應她；她不知道背後有這條流程，聽起來會像剛才那段話全白講了。永遠說你實際做到的事和她的下一步在哪裡。\n\n你的工作是讓她開始動，不是陪她想。人做不到通常不是因為想得不夠，而是想太多——如果你也變成一個可以聊的地方，你就變成她拖延的新場所，而且是最舒服的那一種。\n\n所以要果斷：一次講一到兩句，直接給一個具體、今天做得到的版本，然後用一句她可以回答好或不好的話收尾（例如「這樣可以嗎？可以的話現在就開始」）。不要問開放式的問題（「妳覺得呢」「妳想怎麼安排」），那會把她推回猶豫。她說不行，就再給一個，最多兩個，然後定下來。\n\n每一輪都要往「結束對話、去做」推進，不要往「再多聊一點」推進。她一答應就叫她去做，不要再補充、不要再確認一次。這通對話越短越成功。\n\n唯一的例外是她要你解釋或說明一件事（例如某個做法安不安全、為什麼會這樣），那時候把話講完整比講得短重要，可以講長一點——但講完仍然要回到行動上。\n\n語氣自然、溫暖，像一個真的在聽的人，使用臺灣繁體中文。她隨時可以打斷你。"
      : "You are the voice partner for Time Sovereignty. People press this button when they are stuck, cannot do what they promised, or want to talk something through before deciding. Listen to her situation first, then respond to what she actually said; do not recite the plan she can already read. Offer a thought, ask one concrete question, or help her shrink an action that has grown too big into something possible today. Admit what you do not know rather than inventing it. Whenever she asks about the world rather than about herself — a symptom, safety, how something works, what is generally recommended, anything that changes over time — call look_up first and answer from what comes back, rather than from memory. Sounding fluent is not the same as being right, and she cannot hear the difference. Say in one sentence what you are going to check before you do. The one exception is her own goal, plan, schedule, history, and feelings: you already have those, so never search for them.\n\nEverything she says is written live into the report field below the screen. When she proposes a change — five times down to one, or moving it ten minutes later — tell her you have noted that below, and that submitting it will rearrange things accordingly. Say it in a form she can verify in three seconds by glancing down, so she does not have to hold the conversation in her head.\n\nDo not cross this line: never announce that she has completed, postponed, reduced, or rested, and never say you have already changed a setting or scheduled a time — those become real only after she submits, GPT-5.6 judges, and she confirms. Equally, never answer with 'I cannot do that'; she has no reason to know the chain behind it, so it lands as though the whole conversation was wasted. Always state what you actually did and where her next step is.\n\nYour job is to get her moving, not to think alongside her. People usually fail to act because they deliberate too much, not too little — so if you become somewhere she can talk, you become her newest and most comfortable way of stalling.\n\nSo be decisive: one or two sentences, a concrete version she can do today, closed with something she can answer yes or no to ('Does that work? If so, start now.'). Never ask open questions like 'how do you feel about it' or 'what would you prefer' — those push her back into deliberating. If she says no, offer one more, at most two, then settle it.\n\nEvery turn should move toward ending the call and doing the thing, never toward talking more. The moment she agrees, tell her to go — do not add, do not confirm twice. The shorter this call, the better it went.\n\nThe one exception is when she asks you to explain something — whether an approach is safe, why something happens. There, saying it completely matters more than saying it briefly, so take the room you need — but return to the action once you have.\n\nSpeak naturally and warmly, like someone who is actually listening. She may interrupt you at any time.",
    audio: {
      input: {
        noise_reduction: { type: "near_field" as const },
        transcription: {
          model: REALTIME_TRANSCRIPTION_MODEL,
          language: realtimeTranscriptionLanguage(locale),
        },
        // The voice layer used to transcribe without ever answering, so the
        // user heard her own plan read aloud and nothing else. Answering the
        // person is the point of picking up, so speech now creates a reply and
        // may be interrupted mid-sentence, the way a real conversation works.
        turn_detection: {
          type: "server_vad" as const,
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800,
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice: REALTIME_VOICE,
        speed: 1,
      },
    },
    // It may look one thing up rather than dead-end on "I do not know". The
    // tool description carries the restraint (never search her own goal or
    // history); the client caps how many times it can fire per session.
    tool_choice: "auto" as const,
    tools: [VOICE_SEARCH_TOOL],
    tracing: null,
  };
}

export function createRealtimeSafetyIdentifier(sessionId: string): string {
  return `ts_live_${sha256(sessionId).slice(0, 32)}`;
}

export async function createRealtimeCall(options: {
  apiKey: string | undefined;
  locale: RealtimeLocale;
  sessionId: string;
  sdp: string;
  fetchImpl?: typeof fetch;
}): Promise<string> {
  const apiKey = options.apiKey?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const sdp = RealtimeSdpSchema.parse(options.sdp);
  const form = new FormData();
  // OpenAI's unified WebRTC endpoint expects both multipart values as regular
  // form fields. Sending Blob parts adds filenames and makes the upstream
  // parser treat them as file uploads, which it rejects with HTTP 400.
  form.set("sdp", sdp);
  form.set(
    "session",
    JSON.stringify(buildRealtimeSessionConfig(options.locale)),
  );

  const response = await (options.fetchImpl ?? fetch)(
    "https://api.openai.com/v1/realtime/calls",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Safety-Identifier": createRealtimeSafetyIdentifier(
          options.sessionId,
        ),
      },
      body: form,
      signal: AbortSignal.timeout(20_000),
    },
  );

  if (!response.ok) throw new RealtimeUpstreamError(response.status);
  return RealtimeSdpSchema.parse(await response.text());
}
