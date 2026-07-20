import { z } from "zod";

import {
  GoalAttendanceEntrySchema,
  GoalPlanRevisionSchema,
  GoalWorkspaceSchema,
  type GoalWorkspaceStatus,
} from "../../domain/goals/workspace-schemas";
import type { LocalOnboardingRecord } from "../../repositories/local-onboarding-repository";

const GoalListResponseSchema = z
  .object({
    ok: z.literal(true),
    goals: z.array(GoalWorkspaceSchema),
  })
  .strict();

const GoalCreateResponseSchema = z
  .object({
    ok: z.literal(true),
    workspace: GoalWorkspaceSchema,
    duplicate: z.boolean(),
    nextCheckInId: z.string().nullable(),
  })
  .strict();

const GoalDetailResponseSchema = z
  .object({
    ok: z.literal(true),
    goal: GoalWorkspaceSchema,
    planRevision: GoalPlanRevisionSchema,
    attendance: z.array(GoalAttendanceEntrySchema),
  })
  .strict();

const GoalTransitionResponseSchema = z
  .object({
    ok: z.literal(true),
    workspace: GoalWorkspaceSchema,
    invalidatedTaskName: z.string().nullable(),
  })
  .strict();

const GoalDeleteResponseSchema = z
  .object({
    ok: z.literal(true),
    duplicate: z.boolean(),
    tombstone: z.object({ goalId: z.string() }).passthrough(),
  })
  .passthrough();

export type LiveGoalDetail = z.infer<typeof GoalDetailResponseSchema>;

export class LiveGoalWorkspaceClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`Live goal workspace request failed: ${code}`);
    this.name = "LiveGoalWorkspaceClientError";
  }
}

type Fetcher = typeof fetch;

async function failure(response: Response): Promise<never> {
  const payload: unknown = await response.json().catch(() => null);
  const code =
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
      ? payload.error
      : "live_goal_request_failed";
  throw new LiveGoalWorkspaceClientError(response.status, code);
}

export async function listLiveGoals(fetcher: Fetcher = fetch) {
  const response = await fetcher("/api/live/goals", {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) return failure(response);
  return GoalListResponseSchema.parse(await response.json()).goals;
}

export async function getLiveGoal(
  goalId: string,
  fetcher: Fetcher = fetch,
) {
  const response = await fetcher(`/api/live/goals/${encodeURIComponent(goalId)}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) return failure(response);
  return GoalDetailResponseSchema.parse(await response.json());
}

export async function saveLiveGoal(
  options: {
    requestId: string;
    record: LocalOnboardingRecord;
    scheduleTimes: string[];
  },
  fetcher: Fetcher = fetch,
) {
  const response = await fetcher("/api/live/goals", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok) return failure(response);
  return GoalCreateResponseSchema.parse(await response.json());
}

export async function changeLiveGoalStatus(
  options: {
    goalId: string;
    expectedRevision: number;
    status: GoalWorkspaceStatus;
  },
  fetcher: Fetcher = fetch,
) {
  const response = await fetcher(
    `/api/live/goals/${encodeURIComponent(options.goalId)}`,
    {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expectedRevision: options.expectedRevision,
        status: options.status,
      }),
    },
  );
  if (!response.ok) return failure(response);
  return GoalTransitionResponseSchema.parse(await response.json()).workspace;
}

export async function deleteLiveGoal(
  options: { goalId: string; expectedRevision: number },
  fetcher: Fetcher = fetch,
) {
  const response = await fetcher(
    `/api/live/goals/${encodeURIComponent(options.goalId)}`,
    {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedRevision: options.expectedRevision }),
    },
  );
  if (!response.ok) return failure(response);
  return GoalDeleteResponseSchema.parse(await response.json());
}
