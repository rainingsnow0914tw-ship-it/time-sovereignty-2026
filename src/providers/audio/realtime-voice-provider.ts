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
  // This is the opening turn: read the check-in aloud so she hears where she
  // is, then stop and let her talk. It deliberately joins the conversation
  // (no `conversation: "none"`), because everything she says next only makes
  // sense if the assistant remembers what it just read to her.
  const instructions =
    locale === "zh-TW"
      ? "請完整唸出這段報到內容，從第一個字到最後一個字，不要摘要或刪節。唸完就停下來等她說話——她按下這個按鈕，通常是因為卡住了或想談一談。不要在唸完後自問自答，也不要追加建議；等她開口。使用自然、溫暖的臺灣繁體中文。"
      : "Read this check-in aloud in full, from the first word through the final word, without summarizing or omitting anything. Then stop and wait for her to speak — she pressed this button because she is stuck or wants to talk it through. Do not answer yourself or add advice after reading; wait for her. Use natural, warm English.";
  return {
    type: "response.create" as const,
    response: {
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
      metadata: { purpose: "time_sovereignty_voice_opening" },
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
