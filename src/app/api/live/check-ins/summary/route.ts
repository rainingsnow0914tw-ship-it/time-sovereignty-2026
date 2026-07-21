import { NextRequest } from "next/server";
import { z } from "zod";

import { OpenAiResponsesProvider } from "@/providers/ai/openai-provider";
import { summarizeVoiceConversation } from "@/live-checkin/conversation-summary";
import {
  authenticateLiveRequest,
  liveErrorResponse,
  liveJson,
} from "@/live-checkin/route-helpers";

export const runtime = "nodejs";

const RequestSchema = z
  .object({
    transcript: z.string().trim().min(1).max(8_000),
    goal: z.string().trim().min(1).max(240),
    currentAction: z.string().trim().min(1).max(500),
    locale: z.enum(["zh-TW", "en"]).default("zh-TW"),
  })
  .strict();

// Tidying a transcript decides nothing: it produces text the user reads,
// edits, and submits herself. The real judgement still happens in the confirm
// path, so nothing here writes to Firestore.
export async function POST(request: NextRequest) {
  try {
    const { session } = await authenticateLiveRequest(request);
    const body = RequestSchema.parse(await request.json());
    const { summary, trace } = await summarizeVoiceConversation({
      provider: new OpenAiResponsesProvider(),
      transcript: body.transcript,
      goal: body.goal,
      currentAction: body.currentAction,
      locale: body.locale,
      runId: `voice-summary-${session.id}-${Date.now()}`,
      safetyIdentifier: `ts_${session.id.slice(0, 32)}`,
    });

    return liveJson({ ok: true, summary, trace });
  } catch (error) {
    return liveErrorResponse(error, "voice-summary");
  }
}
