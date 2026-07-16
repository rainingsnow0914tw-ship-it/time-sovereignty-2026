import { NextResponse } from "next/server";

import { readAiProviderMode } from "@/providers/ai/runtime-provider";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "time-sovereignty",
      providerMode: readAiProviderMode(),
      model: process.env.OPENAI_MODEL ?? "mock",
      revision: process.env.K_REVISION ?? "local",
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
