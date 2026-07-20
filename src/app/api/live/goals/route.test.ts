import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMockGoalArchitectResult,
  defaultSupportAgreementDraft,
} from "@/features/onboarding/model";
import { createLiveGoalWorkspaceRepository } from "@/live-checkin/goal-workspace-repository";
import { authenticateLiveRequest } from "@/live-checkin/route-helpers";
import { assertAllowedOrigin } from "@/live-checkin/session-auth";
import { createConfirmedOnboardingRecord } from "@/repositories/local-onboarding-repository";

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

import { GET, POST } from "./route";

const create = vi.fn();
const list = vi.fn();

async function saveRequest() {
  const now = () => new Date("2026-07-20T00:00:00.000Z");
  const answers = {
    goal: "每天練習英語口說",
    targetWindow: "一個月",
    motivation: "我想用英語學習 AI",
  };
  const generated = await createMockGoalArchitectResult(answers, now);
  const record = createConfirmedOnboardingRecord({
    answers,
    plan: generated.output,
    agentTrace: generated.trace,
    support: {
      ...defaultSupportAgreementDraft,
      checkInFrequency: "DAILY",
      preferredCheckInTime: "21:00",
      timezone: "Asia/Macau",
    },
    now,
    idFactory: (prefix) => `${prefix}-english`,
  });
  return new NextRequest("https://preview.example/api/live/goals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://preview.example",
    },
    body: JSON.stringify({
      requestId: "save-english",
      record,
      scheduleTimes: ["09:00", "15:00", "21:00"],
    }),
  });
}

describe("/api/live/goals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticateLiveRequest).mockResolvedValue({
      config: { allowedOrigins: ["https://preview.example"], cloud: {} },
      session: {
        id: "short-lived-session",
        ownerId: "private-single-device",
      },
    } as Awaited<ReturnType<typeof authenticateLiveRequest>>);
    vi.mocked(createLiveGoalWorkspaceRepository).mockReturnValue({
      create,
      list,
    } as unknown as ReturnType<typeof createLiveGoalWorkspaceRepository>);
  });

  it("injects the stable authenticated owner when saving a confirmed goal", async () => {
    create.mockImplementation(async ({ workspace }) => ({
      workspace,
      duplicate: false,
    }));

    const response = await POST(await saveRequest());

    expect(response.status).toBe(200);
    expect(assertAllowedOrigin).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: expect.objectContaining({
          ownerId: "private-single-device",
          schedule: expect.objectContaining({ slots: expect.any(Array) }),
        }),
        planRevision: expect.objectContaining({
          ownerId: "private-single-device",
        }),
      }),
    );
    const payload = await response.json();
    expect(payload.workspace.schedule.slots).toHaveLength(3);
  });

  it("lists only workspaces belonging to the authenticated owner", async () => {
    list.mockResolvedValue([]);
    const response = await GET(
      new NextRequest("https://preview.example/api/live/goals", {
        headers: { Origin: "https://preview.example" },
      }),
    );

    expect(response.status).toBe(200);
    expect(list).toHaveBeenCalledWith("private-single-device");
    await expect(response.json()).resolves.toEqual({ ok: true, goals: [] });
  });
});
