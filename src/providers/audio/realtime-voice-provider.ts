import type { AppLocale } from "../../i18n/locale";
import { normalizeSpeechText } from "./browser-audio-provider";
import {
  MAX_VOICE_SEARCHES_PER_SESSION,
  buildVoiceToolResultEvents,
  parseVoiceToolCall,
  voiceSearchUnavailableOutput,
} from "../../live-checkin/voice-search";

export const REALTIME_VOICE_PROVIDER = "openai";
export const REALTIME_VOICE_MODEL = "gpt-realtime-2.1";
export const REALTIME_PLAYBACK_MAX_OUTPUT_TOKENS = 4_096;

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

export function buildRealtimeSpeakEvent(
  text: string,
  locale: AppLocale,
  priorNotes = "",
) {
  const normalized = normalizeSpeechText(text);
  if (!normalized) throw new Error("There is no readable text.");
  // Voice can be stopped and started again mid-check-in — she reopens it to add
  // one more thing. Without this, the second session began with no idea what
  // was already agreed, and she had to repeat herself. What is already in the
  // report field is handed over as memory, not as something to read aloud.
  const carried = priorNotes.trim();
  // This is the opening turn: read the check-in aloud so she hears where she
  // is, then stop and let her talk. It deliberately joins the conversation
  // (no `conversation: "none"`), because everything she says next only makes
  // sense if the assistant remembers what it just read to her.
  const instructions =
    locale === "zh-TW"
      ? "請完整唸出這段報到內容，從第一個字到最後一個字，不要摘要或刪節。唸完就停下來等她說話——她按下這個按鈕，通常是因為卡住了或想談一談。不要在唸完後自問自答，也不要追加建議；等她開口。使用自然、溫暖的臺灣繁體中文。"
      : "Read this check-in aloud in full, from the first word through the final word, without summarizing or omitting anything. Then stop and wait for her to speak — she pressed this button because she is stuck or wants to talk it through. Do not answer yourself or add advice after reading; wait for her. Use natural, warm English.";
  const carryInstruction =
    locale === "zh-TW"
      ? "另外附上的「先前已記下的內容」是這次報到稍早談定的事，請當作你已經知道的背景，不要唸出來；她接下來說的話若是修改其中一項，就以最新的說法為準。"
      : "The 'already noted' block is what was agreed earlier in this same check-in. Treat it as background you already know and do not read it aloud; if what she says next revises one of those items, the newest version wins.";
  return {
    type: "response.create" as const,
    response: {
      output_modalities: ["audio"] as const,
      max_output_tokens: REALTIME_PLAYBACK_MAX_OUTPUT_TOKENS,
      instructions: carried ? `${instructions} ${carryInstruction}` : instructions,
      input: [
        ...(carried
          ? [
              {
                type: "message" as const,
                role: "user" as const,
                content: [
                  {
                    type: "input_text" as const,
                    text:
                      locale === "zh-TW"
                        ? `先前已記下的內容：
${carried}`
                        : `Already noted:
${carried}`,
                  },
                ],
              },
            ]
          : []),
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
  // Search is the most expensive thing the product can do, so the ceiling is
  // enforced here rather than trusted to the model's own restraint.
  private searchesUsed = 0;

  constructor(
    private readonly callbacks: {
      onTranscript: (transcript: string) => void;
      onStatus: (status: RealtimeVoiceStatus) => void;
      // Resolving a lookup needs the server, which the panel owns. Returning
      // null means "could not answer" and is handled the same as a failure.
      onLookUp?: (query: string) => Promise<string | null>;
      onLookUpStarted?: (reason: string) => void;
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
        const toolCall = parseVoiceToolCall(event.data);
        if (toolCall) {
          void this.resolveLookUp(toolCall.callId, toolCall.arguments.query, toolCall.arguments.reason);
          return;
        }
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

  private async resolveLookUp(
    callId: string,
    query: string,
    reason: string,
  ): Promise<void> {
    let output: string | null = null;
    if (this.searchesUsed < MAX_VOICE_SEARCHES_PER_SESSION) {
      this.searchesUsed += 1;
      this.callbacks.onLookUpStarted?.(reason);
      try {
        output = (await this.callbacks.onLookUp?.(query)) ?? null;
      } catch {
        output = null;
      }
    }
    // Over budget, failed, or unwired all end the same way: the voice keeps
    // talking to her instead of stalling on an unanswered tool call.
    this.send(
      ...buildVoiceToolResultEvents(
        callId,
        output ?? voiceSearchUnavailableOutput(this.locale),
      ),
    );
  }

  private send(...events: object[]): void {
    if (this.channel?.readyState !== "open") return;
    for (const event of events) this.channel.send(JSON.stringify(event));
  }

  speak(text: string, priorNotes = ""): void {
    const event = buildRealtimeSpeakEvent(text, this.locale, priorNotes);
    if (this.channel?.readyState === "open") {
      this.channel.send(JSON.stringify(event));
      return;
    }
    this.pendingSpeech = event;
  }

  disconnect(notify = true): void {
    this.pendingSpeech = null;
    this.searchesUsed = 0;
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
