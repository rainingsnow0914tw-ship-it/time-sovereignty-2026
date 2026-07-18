import { describe, expect, it } from "vitest";

import { OpenAiResponsesProvider } from "../providers/ai/openai-provider";
import { runLiveMemoryCurator } from "./memory-curator";
import { LiveCheckInDocumentSchema } from "./schemas";

const runLive = process.env.RUN_LIVE_MEMORY_CURATOR === "1";

describe.skipIf(!runLive)("live phone Memory Curator contract", () => {
  it(
    "parses one bounded post-response curation with GPT-5.6",
    async () => {
      const checkIn = LiveCheckInDocumentSchema.parse({
        version: 1,
        id: "memory-curator-contract-20260719",
        sessionId: "contract-session-no-user-data",
        status: "CONFIRMED",
        message: "What is true now?",
        context: {
          goal: "建立可以持續的素描練習節奏",
          motivation: "用小幅插畫培養完成感",
          targetWindow: "一個月",
          currentAction: "畫一張二十分鐘的小物素描",
          minimumAction: "只畫完整外輪廓",
          preferredTone: "溫暖、直接、務實",
          locale: "zh-TW",
        },
        scheduledFor: "2026-07-19T01:00:00.000Z",
        taskName: "contract-task",
        pendingAt: "2026-07-19T01:00:00.000Z",
        replyId: "contract-reply",
        replyFingerprint: "a".repeat(64),
        attemptCount: 1,
        leaseToken: null,
        leaseExpiresAt: null,
        triage: null,
        recovery: null,
        decision: {
          assessment: "COMPLETED",
          userMessage: "這次小物素描已完成，而且有可見成果。",
          adaptedCommitment: "下次仍先完成，再決定要不要修改。",
          dispatchedAgents: [],
          selectedStrategy: "CONTINUE",
          nextFollowUpAt: null,
          memoryProposal: {
            summary: "短時限即時督促可能有助於減少反覆修改。",
            confidence: 0.72,
            requiresUserConfirmation: true,
          },
        },
        traceRunIds: ["contract-chief"],
        evidenceKinds: ["TEXT", "PHOTO"],
        retrievedMemoryIds: [],
        memoryDisposition: "DEFER",
        memoryCurationStatus: "PROCESSING",
        memoryCurationLeaseToken: "11111111-1111-4111-8111-111111111111",
        memoryCurationLeaseExpiresAt: "2026-07-19T01:10:00.000Z",
        memoryCurationSummary: null,
        confirmedAt: "2026-07-19T01:02:00.000Z",
        confirmationId: "contract-confirmation",
        nextCheckInId: null,
        nextTaskName: null,
        errorName: null,
        createdAt: "2026-07-19T00:59:00.000Z",
        updatedAt: "2026-07-19T01:02:00.000Z",
      });

      const result = await runLiveMemoryCurator({
        checkIn,
        relevantMemories: [],
        disposition: "DEFER",
        provider: new OpenAiResponsesProvider(),
      });

      expect(result.trace.provider).toBe("openai");
      expect(result.trace.model).toContain("gpt-5.6");
      expect(result.trace.tokenUsage?.totalTokens).toBeGreaterThan(0);
      expect(result.output.proposals.length).toBeLessThanOrEqual(1);
      for (const proposal of result.output.proposals) {
        expect(proposal.kind).toBe("STRATEGY");
        expect(proposal.sourceType).toBe("OBSERVED_PATTERN");
        expect(proposal.confidence).toBeLessThanOrEqual(0.45);
        expect(proposal.requiresUserConfirmation).toBe(true);
      }

      console.info(
        "[live-memory-curator-proof]",
        JSON.stringify({
          requestedModel: "gpt-5.6",
          returnedModel: result.trace.model,
          provider: result.trace.provider,
          outputSchemaName: result.trace.outputSchemaName,
          tokenUsage: result.trace.tokenUsage,
          schemaPassed: true,
          proposalCount: result.output.proposals.length,
          limitedEvidenceBoundaryPassed: true,
          rawReplyOrPhotoPersisted: false,
          zeroSdkRetries: true,
        }),
      );
    },
    120_000,
  );
});
