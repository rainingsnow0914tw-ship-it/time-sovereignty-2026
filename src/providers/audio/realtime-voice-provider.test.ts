import { describe, expect, it } from "vitest";

import {
  buildRealtimeSpeakEvent,
  parseRealtimeVoiceEvent,
  REALTIME_PLAYBACK_MAX_OUTPUT_TOKENS,
} from "./realtime-voice-provider";

describe("Realtime voice provider", () => {
  it("accepts only the completed transcription event as reply text", () => {
    expect(
      parseRealtimeVoiceEvent(
        JSON.stringify({
          type: "conversation.item.input_audio_transcription.completed",
          transcript: "  雲端除錯完成了。  ",
          hidden: "ignored",
        }),
      ),
    ).toEqual({ type: "TRANSCRIPT", transcript: "雲端除錯完成了。" });
    expect(parseRealtimeVoiceEvent("not-json")).toBeNull();
    expect(
      parseRealtimeVoiceEvent(JSON.stringify({ type: "response.text.delta" })),
    ).toBeNull();
  });

  it("maps VAD, playback, and error events to safe UI states", () => {
    expect(
      parseRealtimeVoiceEvent(
        JSON.stringify({ type: "input_audio_buffer.speech_started" }),
      ),
    ).toEqual({ type: "STATUS", status: "LISTENING" });
    expect(
      parseRealtimeVoiceEvent(JSON.stringify({ type: "response.created" })),
    ).toEqual({ type: "STATUS", status: "SPEAKING" });
    expect(parseRealtimeVoiceEvent(JSON.stringify({ type: "error" }))).toEqual({
      type: "ERROR",
    });
  });

  // The opening turn reads the check-in aloud, then stops and waits. It joins
  // the conversation on purpose: whatever she says next only makes sense if
  // the assistant remembers what it just read to her.
  it("builds an opening turn that reads the check-in and then waits for her", () => {
    const event = buildRealtimeSpeakEvent("請告訴我現在的情況。", "zh-TW");
    expect(event.type).toBe("response.create");
    expect(event.response.output_modalities).toEqual(["audio"]);
    expect(event.response.max_output_tokens).toBe(
      REALTIME_PLAYBACK_MAX_OUTPUT_TOKENS,
    );
    expect(event.response.instructions).toContain("完整唸出");
    expect(event.response.instructions).toContain("等她說話");
    expect(event.response.instructions).not.toContain("不要回答");
    expect(event.response.input[0]?.content[0]).toEqual({
      type: "input_text",
      text: "請告訴我現在的情況。",
    });
  });

  it("does not isolate the opening turn from the conversation", () => {
    const event = buildRealtimeSpeakEvent("請告訴我現在的情況。", "zh-TW");
    expect("conversation" in event.response).toBe(false);
  });
});
