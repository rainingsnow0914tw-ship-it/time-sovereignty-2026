import type { AppLocale } from "../../i18n/locale";
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
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "live_goal_architect_failed";
    throw new LiveGoalArchitectClientError(response.status, code);
  }
  const parsed = LiveGoalArchitectResponseSchema.parse(payload);
  return { output: parsed.plan, trace: parsed.trace };
}
