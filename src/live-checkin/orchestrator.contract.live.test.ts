import { describe, expect, it } from "vitest";

import { OpenAiResponsesProvider } from "../providers/ai/openai-provider";
import { runLiveCheckInAgents } from "./orchestrator";
import {
  LiveCheckInDocumentSchema,
  type LiveChiefOfStaffDecision,
} from "./schemas";

const runLive = process.env.RUN_LIVE_CHECK_IN_CONTRACT === "1";
const transportImage =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAITcAACE3ATNYn3oAAACySURBVFhH7c9BDsMgDERRDtv7X6HRVLIEA07sgM2ifKmLEuLnlO/mCh9kdxb4rwXKp+f6k6CAy685b/4FVMOpCzA6wn/3+GA2BjVY0p+8iNEnHN0/NcagBZZst5QY9MCS73YVo15Ycr9VY7M4cr3JXzwDS+YJDK/AkWkKw6tw9DiJ4ZU4up3G8GocqRMZjsDRcCrDUTjqJjMciaNmOsPROOqETBwNlSwc5UlKZ4GzwPYFLmzY8kG+lDjSAAAAAElFTkSuQmCC";

function checkIn(replyId: string) {
  const now = new Date();
  return LiveCheckInDocumentSchema.parse({
    version: 1,
    id: `contract-${replyId}`,
    sessionId: `contract-session-${replyId}`,
    status: "PROCESSING",
    message: "What is true right now?",
    context: {
      goal: "Write one visible paragraph for a short story",
      motivation: "Build a sustainable writing practice",
      targetWindow: "By tonight",
      currentAction: "Write one paragraph",
      minimumAction: "Write one sentence",
      preferredTone: "Warm, direct, and practical",
      locale: "zh-TW",
    },
    scheduledFor: new Date(now.getTime() - 60_000).toISOString(),
    taskName: "contract-task",
    pendingAt: now.toISOString(),
    replyId,
    replyFingerprint: "a".repeat(64),
    attemptCount: 1,
    leaseToken: "00000000-0000-4000-8000-000000000001",
    leaseExpiresAt: new Date(now.getTime() + 300_000).toISOString(),
    triage: null,
    recovery: null,
    decision: null,
    traceRunIds: [],
    confirmedAt: null,
    confirmationId: null,
    nextCheckInId: null,
    nextTaskName: null,
    errorName: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
}

async function runScenario(options: {
  replyId: string;
  intent: "REPORT_PROGRESS" | "SOMETHING_CHANGED";
  reply: string;
  withImage: boolean;
}) {
  let persistedDecision: LiveChiefOfStaffDecision | null = null;
  const result = await runLiveCheckInAgents({
    checkIn: checkIn(options.replyId),
    reply: {
      replyId: options.replyId,
      intent: options.intent,
      reply: options.reply,
      image: options.withImage
        ? { mimeType: "image/png", dataUrl: transportImage }
        : null,
    },
    provider: new OpenAiResponsesProvider(),
    onTriage: async () => undefined,
    onRecovery: async () => undefined,
    onDecision: async (decision) => {
      persistedDecision = decision;
    },
  });
  expect(persistedDecision).toEqual(result.decision);
  return result;
}

describe.skipIf(!runLive)("live multimodal check-in contracts", () => {
  it(
    "lets GPT-5.6 review progress and a transient image without forced Recovery",
    async () => {
      const result = await runScenario({
        replyId: "on-track-20260718",
        intent: "REPORT_PROGRESS",
        reply:
          "我已經完成承諾的一段文字。附圖只用來驗證圖片傳輸，不應被當成額外事實。",
        withImage: true,
      });
      expect(["ON_TRACK", "PARTIAL", "COMPLETED"]).toContain(
        result.decision.assessment,
      );
      expect(result.decision.dispatchedAgents).toEqual([]);
      expect(result.traces).toHaveLength(1);
      console.info(
        "[live-check-in-contract]",
        JSON.stringify({
          scenario: "progress_with_transient_image",
          assessment: result.decision.assessment,
          dispatchedAgents: result.decision.dispatchedAgents,
          models: result.traces.map((trace) => trace.model),
          tokenUsage: result.traces.map((trace) => trace.tokenUsage),
          schemaPassed: true,
          imagePersisted: false,
          sdkRetries: 0,
        }),
      );
    },
    180_000,
  );

  it(
    "routes illness through real Chief, Recovery, and final Chief synthesis",
    async () => {
      const result = await runScenario({
        replyId: "blocked-20260718",
        intent: "SOMETHING_CHANGED",
        reply:
          "我今天生病了，現在無法完成原本的承諾；請依照真實狀況幫我縮小、改期或暫停。",
        withImage: false,
      });
      expect(["BLOCKED", "GOAL_CHANGED"]).toContain(
        result.decision.assessment,
      );
      expect(result.decision.dispatchedAgents).toEqual([
        "COMMITMENT_RECOVERY",
      ]);
      expect(result.traces.map((trace) => trace.agent)).toEqual([
        "CHIEF_OF_STAFF",
        "COMMITMENT_RECOVERY",
        "CHIEF_OF_STAFF",
      ]);
      console.info(
        "[live-check-in-contract]",
        JSON.stringify({
          scenario: "illness_recovery",
          assessment: result.decision.assessment,
          dispatchedAgents: result.decision.dispatchedAgents,
          models: result.traces.map((trace) => trace.model),
          tokenUsage: result.traces.map((trace) => trace.tokenUsage),
          schemaPassed: true,
          sdkRetries: 0,
        }),
      );
    },
    240_000,
  );
});
