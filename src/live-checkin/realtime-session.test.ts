import { describe, expect, it, vi } from "vitest";

import {
  buildRealtimeSessionConfig,
  createRealtimeCall,
  createRealtimeSafetyIdentifier,
  REALTIME_MAX_OUTPUT_TOKENS,
  REALTIME_MODEL,
  REALTIME_TRANSCRIPTION_MODEL,
  RealtimeSdpSchema,
  realtimeTranscriptionLanguage,
} from "./realtime-session";

const offer = "v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\n";
const answer = "v=0\r\no=- 2 3 IN IP4 127.0.0.1\r\n";

describe("Realtime session boundary", () => {
  it("builds a voice-only session that transcribes but never auto-decides", () => {
    const config = buildRealtimeSessionConfig("zh-TW");

    expect(config.model).toBe(REALTIME_MODEL);
    expect(config.max_output_tokens).toBe(REALTIME_MAX_OUTPUT_TOKENS);
    expect(config.instructions).toContain("逐字完整朗讀");
    expect(config.instructions).toContain("讀完最後一個字才能停止");
    expect(config.audio.input.transcription).toEqual({
      model: REALTIME_TRANSCRIPTION_MODEL,
      language: "zh",
    });
    expect(config.audio.input.turn_detection).toMatchObject({
      type: "server_vad",
      create_response: false,
      interrupt_response: false,
    });
    expect(config.audio.output.voice).toBe("marin");
    expect(config.tools).toEqual([]);
    expect(config.tracing).toBeNull();
  });

  it("maps UI locale to an ISO-639-1 transcription language", () => {
    expect(realtimeTranscriptionLanguage("zh-TW")).toBe("zh");
    expect(realtimeTranscriptionLanguage("en")).toBe("en");
  });

  it("rejects malformed or oversized SDP without accepting arbitrary text", () => {
    expect(() => RealtimeSdpSchema.parse("not-sdp")).toThrow();
    expect(() => RealtimeSdpSchema.parse(`v=0\n${"a".repeat(200_001)}`)).toThrow();
    expect(RealtimeSdpSchema.parse(offer)).toBe(offer);
  });

  it("uses a stable privacy-preserving safety identifier", () => {
    const value = createRealtimeSafetyIdentifier("private-session-id");
    expect(value).toMatch(/^ts_live_[a-f0-9]{32}$/u);
    expect(value).not.toContain("private-session-id");
  });

  it("sends one protected multipart negotiation without exposing the key in config", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        Authorization: "Bearer test-server-key",
      });
      const form = init?.body as FormData;
      expect(form.get("sdp")).toBe(offer);
      expect(typeof form.get("session")).toBe("string");
      const session = JSON.parse(String(form.get("session"))) as Record<
        string,
        unknown
      >;
      expect(JSON.stringify(session)).not.toContain("test-server-key");
      return new Response(answer, {
        status: 200,
        headers: { "Content-Type": "application/sdp" },
      });
    });

    await expect(
      createRealtimeCall({
        apiKey: "test-server-key",
        locale: "en",
        sessionId: "session-123",
        sdp: offer,
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).resolves.toBe(answer);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
