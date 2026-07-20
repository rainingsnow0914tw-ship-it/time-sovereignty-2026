import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyCloudTaskOidc } from "@/infrastructure/auth/cloud-task-oidc";
import { readLiveCheckInConfig } from "@/live-checkin/config";
import { createLiveCheckInRepository } from "@/live-checkin/firestore-repository";
import { createLiveGoalWorkspaceRepository } from "@/live-checkin/goal-workspace-repository";

vi.mock("@/infrastructure/auth/cloud-task-oidc", () => ({
  CloudTaskAuthenticationError: class CloudTaskAuthenticationError extends Error {},
  verifyCloudTaskOidc: vi.fn(),
}));
vi.mock("@/live-checkin/config", () => ({
  readLiveCheckInConfig: vi.fn(),
}));
vi.mock("@/live-checkin/firestore-repository", () => ({
  createLiveCheckInRepository: vi.fn(),
}));
vi.mock("@/live-checkin/goal-workspace-repository", () => ({
  createLiveGoalWorkspaceRepository: vi.fn(),
}));
vi.mock("@/live-checkin/route-helpers", () => ({
  liveJson: (body: unknown, init: ResponseInit = {}) =>
    Response.json(body, {
      ...init,
      headers: { "Cache-Control": "no-store", ...init.headers },
    }),
  liveErrorResponse: () =>
    Response.json({ ok: false, error: "test_failure" }, { status: 500 }),
}));

import { POST } from "./route";

const findById = vi.fn();
const markPending = vi.fn();
const isDeliverable = vi.fn();

function request() {
  return new NextRequest(
    "https://preview.example/api/tasks/live-checkins/check-in-one",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer test",
        "Content-Type": "application/json",
        "X-CloudTasks-TaskName": "task-one",
      },
      body: JSON.stringify({ checkInId: "check-in-one" }),
    },
  );
}

describe("Cloud Tasks live goal fence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readLiveCheckInConfig).mockReturnValue({
      cloud: {
        tasksOidcAudience: "https://preview.example",
        tasksServiceAccountEmail: "tasks@example.com",
      },
    } as ReturnType<typeof readLiveCheckInConfig>);
    vi.mocked(verifyCloudTaskOidc).mockResolvedValue({
      email: "tasks@example.com",
    });
    vi.mocked(createLiveCheckInRepository).mockReturnValue({
      findById,
      markPending,
    } as unknown as ReturnType<typeof createLiveCheckInRepository>);
    vi.mocked(createLiveGoalWorkspaceRepository).mockReturnValue({
      isDeliverable,
    } as unknown as ReturnType<typeof createLiveGoalWorkspaceRepository>);
  });

  it("turns a late task for a paused or deleted goal into a safe no-op", async () => {
    findById.mockResolvedValue({
      id: "check-in-one",
      context: { goalId: "goal-one" },
    });
    isDeliverable.mockResolvedValue(false);

    const response = await POST(request(), {
      params: Promise.resolve({ checkInId: "check-in-one" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      result: "inactive_goal",
    });
    expect(markPending).not.toHaveBeenCalled();
  });

  it("delivers an active goal task normally", async () => {
    findById.mockResolvedValue({
      id: "check-in-one",
      context: { goalId: "goal-one" },
    });
    isDeliverable.mockResolvedValue(true);
    markPending.mockResolvedValue({
      duplicate: false,
      checkIn: { status: "PENDING" },
    });

    const response = await POST(request(), {
      params: Promise.resolve({ checkInId: "check-in-one" }),
    });

    expect(response.status).toBe(200);
    expect(markPending).toHaveBeenCalledWith({
      checkInId: "check-in-one",
      taskName: "task-one",
    });
  });
});
