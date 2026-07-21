import { NextRequest } from "next/server";
import { z } from "zod";

import { OpenAiResponsesProvider } from "@/providers/ai/openai-provider";
import { answerVoiceSearch } from "@/live-checkin/voice-search";
import {
  authenticateLiveRequest,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";

export const runtime = "nodejs";

const RequestSchema = z
  .object({
    query: z.string().trim().min(2).max(300),
    goal: z.string().trim().min(1).max(240),
    locale: z.enum(["zh-TW", "en"]).default("zh-TW"),
  })
  .strict();

// Looking something up changes nothing: no Firestore write, no memory
// proposal, no commitment. It only gives the voice partner a sentence it can
// say honestly instead of guessing or dead-ending on "I do not know".
export async function POST(request: NextRequest) {
  try {
    const { session } = await authenticateLiveRequest(request);
    const body = RequestSchema.parse(await request.json());
    const { answer, trace } = await answerVoiceSearch({
      provider: new OpenAiResponsesProvider(),
      query: body.query,
      goal: body.goal,
      locale: body.locale,
      runId: `voice-search-${session.id}-${Date.now()}`,
      safetyIdentifier: `ts_${session.id.slice(0, 32)}`,
    });

    return liveJson({ ok: true, answer, trace });
  } catch (error) {
    return liveErrorResponse(error, "voice-search");
  }
}
