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

  it("builds out-of-band audio playback that cannot alter the conversation", () => {
    const event = buildRealtimeSpeakEvent("請告訴我現在的情況。", "zh-TW");
    expect(event.type).toBe("response.create");
    expect(event.response.conversation).toBe("none");
    expect(event.response.output_modalities).toEqual(["audio"]);
    expect(event.response.max_output_tokens).toBe(
      REALTIME_PLAYBACK_MAX_OUTPUT_TOKENS,
    );
    expect(event.response.instructions).toContain("逐字完整朗讀");
    expect(event.response.instructions).toContain("讀完最後一個字才能停止");
    expect(event.response.input[0]?.content[0]).toEqual({
      type: "input_text",
      text: "請告訴我現在的情況。",
    });
  });
});
