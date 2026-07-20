import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createLiveGoalWorkspaceRepository } from "@/live-checkin/goal-workspace-repository";
import { authenticateLiveRequest } from "@/live-checkin/route-helpers";
import { createLiveCheckInScheduler } from "@/live-checkin/scheduler";

vi.mock("@/live-checkin/goal-workspace-repository", () => ({
  createLiveGoalWorkspaceRepository: vi.fn(),
}));
vi.mock("@/live-checkin/route-helpers", () => ({
  authenticateLiveRequest: vi.fn(),
  liveJson: (body: unknown, init: ResponseInit = {}) =>
    Response.json(body, {
      ...init,
      headers: { "Cache-Control": "no-store", ...init.headers },
    }),
  liveErrorResponse: () =>
    Response.json({ ok: false, error: "test_failure" }, { status: 500 }),
}));
vi.mock("@/live-checkin/session-auth", () => ({
  assertAllowedOrigin: vi.fn(),
}));
vi.mock("@/live-checkin/scheduler", () => ({
  createLiveCheckInScheduler: vi.fn(),
}));

import { DELETE, GET, PATCH } from "./route";

const find = vi.fn();
const transition = vi.fn();
const remove = vi.fn();
const cancel = vi.fn();
const context = { params: Promise.resolve({ goalId: "goal-english" }) };

describe("/api/live/goals/[goalId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateLiveRequest).mockResolvedValue({
      config: { allowedOrigins: ["https://preview.example"], cloud: {} },
      session: {
        id: "replacement-session",
        ownerId: "private-single-device",
      },
    } as Awaited<ReturnType<typeof authenticateLiveRequest>>);
    vi.mocked(createLiveGoalWorkspaceRepository).mockReturnValue({
      find,
      transition,
      delete: remove,
    } as unknown as ReturnType<typeof createLiveGoalWorkspaceRepository>);
    vi.mocked(createLiveCheckInScheduler).mockReturnValue({
      cancel,
    } as unknown as ReturnType<typeof createLiveCheckInScheduler>);
  });

  it("returns 404 for an unknown goal without leaking another owner", async () => {
    find.mockResolvedValue(null);
    const response = await GET(
      new NextRequest("https://preview.example/api/live/goals/goal-english", {
        headers: { Origin: "https://preview.example" },
      }),
      context,
    );
    expect(response.status).toBe(404);
  });

  it("passes owner and optimistic revision into a pause transition", async () => {
    transition.mockResolvedValue({
      workspace: { id: "goal-english", status: "PAUSED" },
      invalidatedTaskName: "task-one",
    });
    const response = await PATCH(
      new NextRequest("https://preview.example/api/live/goals/goal-english", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://preview.example",
        },
        body: JSON.stringify({ expectedRevision: 2, status: "PAUSED" }),
      }),
      context,
    );
    expect(response.status).toBe(200);
    expect(transition).toHaveBeenCalledWith({
      ownerId: "private-single-device",
      goalId: "goal-english",
      expectedRevision: 2,
      status: "PAUSED",
    });
    expect(cancel).toHaveBeenCalledWith("task-one");
  });

  it("creates an idempotent deletion tombstone", async () => {
    remove.mockResolvedValue({
      tombstone: {
        version: 1,
        ownerId: "private-single-device",
        goalId: "goal-english",
        invalidatedCheckInId: null,
        invalidatedTaskName: null,
        deletedAt: "2026-07-20T00:00:00.000Z",
      },
      duplicate: false,
    });
    const response = await DELETE(
      new NextRequest("https://preview.example/api/live/goals/goal-english", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://preview.example",
        },
        body: JSON.stringify({ expectedRevision: 3 }),
      }),
      context,
    );
    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledWith({
      ownerId: "private-single-device",
      goalId: "goal-english",
      expectedRevision: 3,
    });
  });
});
