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
  // The voice layer used to transcribe without ever answering, so pressing the
  // button only produced the user's own plan read back to her. It now answers
  // the person, while still being barred from deciding anything on her behalf:
  // GPT-5.6 makes the judgement after she submits, and she confirms it.
  it("builds a voice session that answers the person but never decides for her", () => {
    const config = buildRealtimeSessionConfig("zh-TW");

    expect(config.model).toBe(REALTIME_MODEL);
    expect(config.max_output_tokens).toBe(REALTIME_MAX_OUTPUT_TOKENS);
    expect(config.instructions).toContain("回應她本人說的話");
    expect(config.instructions).toContain("GPT-5.6");
    expect(config.instructions).not.toContain("逐字完整朗讀");
    // Says what it did, never what it cannot do: answering "我做不到" reads as
    // though the whole conversation was wasted, because she has no reason to
    // know a submit-judge-confirm chain exists behind it.
    expect(config.instructions).toContain("我記下來了");
    expect(config.instructions).toContain("不要用「我做不到」");
    // The boundary itself is unchanged.
    expect(config.instructions).toContain("不要宣布她已經完成");
    expect(config.audio.input.transcription).toEqual({
      model: REALTIME_TRANSCRIPTION_MODEL,
      language: "zh",
    });
    expect(config.audio.input.turn_detection).toMatchObject({
      type: "server_vad",
      create_response: true,
      interrupt_response: true,
    });
    expect(config.audio.output.voice).toBe("marin");
    // Lookup is the only tool it gets, and nothing else may be added without
    // a deliberate decision: every tool here can act while she is mid-sentence.
    expect(config.tools).toHaveLength(1);
    expect(config.tools[0]?.name).toBe("look_up");
    expect(config.tool_choice).toBe("auto");
    expect(config.instructions).toContain("不准拿去查");
    expect(config.tracing).toBeNull();
  });

  it("pushes toward acting rather than toward more conversation", () => {
    // Brevity alone was the wrong fix and briefly made things worse: "offer a
    // suggestion and ask how it sounds, then offer another" is a chat loop.
    // Reported from real use as "他很想跟我一起聊下去，我差點被帶歪掉了".
    // A product whose job is to end over-deliberation must not become a new
    // and more comfortable place to over-deliberate.
    const zh = buildRealtimeSessionConfig("zh-TW").instructions;
    expect(zh).toContain("讓她開始動，不是陪她想");
    expect(zh).toContain("不要問開放式的問題");
    expect(zh).toContain("這通對話越短越成功");
    // The explanation exception survives: being decisive never means leaving
    // a safety question half-answered.
    expect(zh).toContain("唯一的例外");

    const en = buildRealtimeSessionConfig("en").instructions;
    expect(en).toContain("get her moving, not to think alongside her");
    expect(en).toContain("Never ask open questions");
    expect(en).toContain("The shorter this call, the better it went");
    expect(en).toContain("The one exception is when she asks you to explain");
  });

  it("keeps the English instructions under the same boundary", () => {
    const config = buildRealtimeSessionConfig("en");

    expect(config.instructions).toContain("never say you have already changed");
    expect(config.instructions).toContain("never answer with 'I cannot do that'");
    expect(config.instructions).toContain("GPT-5.6");
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
