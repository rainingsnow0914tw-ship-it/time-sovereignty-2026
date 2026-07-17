import { z } from "zod";

import { sha256 } from "./session-auth";

export const REALTIME_MODEL = "gpt-realtime-2.1";
export const REALTIME_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
export const REALTIME_VOICE = "marin";
export const REALTIME_MAX_OUTPUT_TOKENS = 1_024;
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
      ? "你是 Time Sovereignty 的高擬真語音層，只負責從第一個字到最後一個字，逐字完整朗讀應用程式提供的文字。不得摘要、刪節、改寫或提前結束；只有讀完最後一個字才能停止。不要自行制定、修改或確認承諾，不要使用工具，也不要補充建議。使用自然、溫暖的臺灣繁體中文。"
      : "You are the natural voice layer for Time Sovereignty. Read every word supplied by the application from the first word through the final word. Never summarize, omit, paraphrase, or stop early; stop only after the final word. Never create, change, or confirm commitments, use tools, or add advice. Speak naturally and warmly in English.",
    audio: {
      input: {
        noise_reduction: { type: "near_field" as const },
        transcription: {
          model: REALTIME_TRANSCRIPTION_MODEL,
          language: realtimeTranscriptionLanguage(locale),
        },
        turn_detection: {
          type: "server_vad" as const,
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800,
          create_response: false,
          interrupt_response: false,
        },
      },
      output: {
        voice: REALTIME_VOICE,
        speed: 1,
      },
    },
    tool_choice: "none" as const,
    tools: [],
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
