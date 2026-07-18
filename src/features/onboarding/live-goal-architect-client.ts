import type { AppLocale } from "../../i18n/locale";
import { z } from "zod";
import {
  LiveGoalArchitectResponseSchema,
} from "../../live-checkin/goal-architect-schemas";
import type { AgentRunResult } from "../../providers/ai/types";
import type { GoalPlan } from "../../domain/goals/schemas";
import type { OnboardingAnswers } from "./model";

export class LiveGoalArchitectClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`Live Goal Architect request failed: ${code}`);
    this.name = "LiveGoalArchitectClientError";
  }
}

export class LivePairingClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`Live pairing request failed: ${code}`);
    this.name = "LivePairingClientError";
  }
}

const LivePairingResponseSchema = z
  .object({
    ok: z.literal(true),
    paired: z.literal(true),
    expiresAt: z.string().datetime({ offset: true }),
    deviceLabel: z.string().trim().min(1).max(120),
  })
  .strict();

type Fetcher = typeof fetch;

async function readFailureCode(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  return payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : "live_request_failed";
}

export async function pairLiveGoalArchitectDevice(
  options: { pairingCode: string; deviceLabel: string },
  fetcher: Fetcher = fetch,
): Promise<z.infer<typeof LivePairingResponseSchema>> {
  const response = await fetcher("/api/live/pair", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    throw new LivePairingClientError(
      response.status,
      await readFailureCode(response),
    );
  }
  return LivePairingResponseSchema.parse(await response.json());
}

export async function createLiveGoalArchitectResult(options: {
  answers: OnboardingAnswers;
  locale: AppLocale;
  timezone: string;
  requestId: string;
}): Promise<AgentRunResult<GoalPlan>> {
  const response = await fetch("/api/live/goals/plan", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    throw new LiveGoalArchitectClientError(
      response.status,
      await readFailureCode(response),
    );
  }
  const payload: unknown = await response.json();
  const parsed = LiveGoalArchitectResponseSchema.parse(payload);
  return { output: parsed.plan, trace: parsed.trace };
}
