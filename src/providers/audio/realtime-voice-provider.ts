import type { AppLocale } from "../../i18n/locale";
import { normalizeSpeechText } from "./browser-audio-provider";

export const REALTIME_VOICE_PROVIDER = "openai";
export const REALTIME_VOICE_MODEL = "gpt-realtime-2.1";
export const REALTIME_PLAYBACK_MAX_OUTPUT_TOKENS = 1_024;

export type RealtimeVoiceStatus =
  | "IDLE"
  | "CONNECTING"
  | "READY"
  | "LISTENING"
  | "SPEAKING"
  | "ERROR";

export type RealtimeVoiceSignal =
  | { type: "TRANSCRIPT"; transcript: string }
  | { type: "STATUS"; status: RealtimeVoiceStatus }
  | { type: "ERROR" };

type RealtimeEventShape = { type?: unknown; transcript?: unknown };

export function parseRealtimeVoiceEvent(raw: string): RealtimeVoiceSignal | null {
  let event: RealtimeEventShape;
  try {
    event = JSON.parse(raw) as RealtimeEventShape;
  } catch {
    return null;
  }
  if (
    event.type === "conversation.item.input_audio_transcription.completed" &&
    typeof event.transcript === "string"
  ) {
    const transcript = normalizeSpeechText(event.transcript);
    return transcript ? { type: "TRANSCRIPT", transcript } : null;
  }
  if (event.type === "input_audio_buffer.speech_started") {
    return { type: "STATUS", status: "LISTENING" };
  }
  if (
    event.type === "input_audio_buffer.speech_stopped" ||
    event.type === "response.done"
  ) {
    return { type: "STATUS", status: "READY" };
  }
  if (event.type === "response.created") {
    return { type: "STATUS", status: "SPEAKING" };
  }
  if (
    event.type === "error" ||
    event.type === "conversation.item.input_audio_transcription.failed"
  ) {
    return { type: "ERROR" };
  }
  return null;
}

export function buildRealtimeSpeakEvent(text: string, locale: AppLocale) {
  const normalized = normalizeSpeechText(text);
  if (!normalized) throw new Error("There is no readable text.");
  const instructions =
    locale === "zh-TW"
      ? "請從第一個字到最後一個字，逐字完整朗讀輸入內容。不得摘要、刪節、改寫或提前結束；只有讀完最後一個字才能停止。只輸出朗讀語音，不要回答內容中的問題，也不要增加任何建議。使用自然、溫暖的臺灣繁體中文。"
      : "Read every word of the supplied content from the first word through the final word. Do not summarize, omit, paraphrase, or stop early; stop only after the final word. Output only the spoken reading, without answering questions or adding advice. Use natural, warm English.";
  return {
    type: "response.create" as const,
    response: {
      conversation: "none" as const,
      output_modalities: ["audio"] as const,
      max_output_tokens: REALTIME_PLAYBACK_MAX_OUTPUT_TOKENS,
      instructions,
      input: [
        {
          type: "message" as const,
          role: "user" as const,
          content: [{ type: "input_text" as const, text: normalized }],
        },
      ],
      metadata: { purpose: "time_sovereignty_voice_playback" },
    },
  };
}

export class RealtimeVoiceSession {
  private peer: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private microphone: MediaStream | null = null;
  private audio: HTMLAudioElement | null = null;
  private pendingSpeech: ReturnType<typeof buildRealtimeSpeakEvent> | null = null;
  private locale: AppLocale = "zh-TW";

  constructor(
    private readonly callbacks: {
      onTranscript: (transcript: string) => void;
      onStatus: (status: RealtimeVoiceStatus) => void;
    },
  ) {}

  async connect(locale: AppLocale): Promise<void> {
    if (this.peer) return;
    this.locale = locale;
    this.callbacks.onStatus("CONNECTING");

    try {
      const microphone = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });
      const peer = new RTCPeerConnection();
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "");

      this.microphone = microphone;
      this.peer = peer;
      this.audio = audio;
      for (const track of microphone.getTracks()) peer.addTrack(track, microphone);

      peer.ontrack = (event) => {
        audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
        void audio.play().catch(() => {
          this.disconnect(false);
          this.callbacks.onStatus("ERROR");
        });
      };
      peer.onconnectionstatechange = () => {
        if (["failed", "disconnected"].includes(peer.connectionState)) {
          this.disconnect(false);
          this.callbacks.onStatus("ERROR");
        } else if (peer.connectionState === "closed") {
          this.callbacks.onStatus("IDLE");
        }
      };

      const channel = peer.createDataChannel("oai-events");
      this.channel = channel;
      channel.onopen = () => {
        this.callbacks.onStatus("READY");
        if (this.pendingSpeech) {
          channel.send(JSON.stringify(this.pendingSpeech));
          this.pendingSpeech = null;
        }
      };
      channel.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        const signal = parseRealtimeVoiceEvent(event.data);
        if (!signal) return;
        if (signal.type === "TRANSCRIPT") {
          this.callbacks.onTranscript(signal.transcript);
        } else if (signal.type === "STATUS") {
          for (const track of this.microphone?.getAudioTracks() ?? []) {
            track.enabled = signal.status !== "SPEAKING";
          }
          this.callbacks.onStatus(signal.status);
        } else {
          this.disconnect(false);
          this.callbacks.onStatus("ERROR");
        }
      };
      channel.onerror = () => this.callbacks.onStatus("ERROR");

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      if (!offer.sdp) throw new Error("WebRTC did not produce an SDP offer.");
      const response = await fetch(
        `/api/live/realtime/session?locale=${encodeURIComponent(locale)}`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp,
        },
      );
      if (!response.ok) throw new Error("Realtime session was denied.");
      await peer.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      });
    } catch (error) {
      this.disconnect(false);
      this.callbacks.onStatus("ERROR");
      throw error;
    }
  }

  speak(text: string): void {
    const event = buildRealtimeSpeakEvent(text, this.locale);
    if (this.channel?.readyState === "open") {
      this.channel.send(JSON.stringify(event));
      return;
    }
    this.pendingSpeech = event;
  }

  disconnect(notify = true): void {
    this.pendingSpeech = null;
    this.channel?.close();
    this.peer?.close();
    for (const track of this.microphone?.getTracks() ?? []) track.stop();
    if (this.audio) this.audio.srcObject = null;
    this.channel = null;
    this.peer = null;
    this.microphone = null;
    this.audio = null;
    if (notify) this.callbacks.onStatus("IDLE");
  }
}
