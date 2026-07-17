import { describe, expect, it } from "vitest";

import type { CloudConfig } from "../infrastructure/gcp/config";
import { LiveCheckInDocumentSchema } from "./schemas";
import {
  buildLiveCheckInTaskRequest,
  createLiveCheckInScheduler,
  type LiveCloudTasksClientLike,
} from "./scheduler";
import { taskIdentityMatches } from "./firestore-repository";

const config: CloudConfig = {
  projectId: "time-sovereignty-2026",
  firestoreDatabaseId: "(default)",
  tasksLocation: "asia-east1",
  tasksQueue: "time-sovereignty-checkins",
  tasksServiceAccountEmail:
    "time-sovereignty-tasks@time-sovereignty-2026.iam.gserviceaccount.com",
  tasksOidcAudience: "https://time-sovereignty.example",
  tasksCallbackBaseUrl: "https://preview.time-sovereignty.example",
  callbackLeaseSeconds: 60,
};

const checkIn = LiveCheckInDocumentSchema.parse({
  version: 1,
  id: "live-proof",
  sessionId: "session-proof",
  status: "SCHEDULED",
  message: "What is true right now?",
  context: {
    goal: "Ship the demo",
    motivation: "Protect the work",
    targetWindow: "Tonight",
    currentAction: "Record the vertical path",
    minimumAction: "Open the PWA",
    preferredTone: "Warm and direct",
  },
  scheduledFor: "2026-07-17T12:00:00.000Z",
  taskName: null,
  pendingAt: null,
  replyId: null,
  replyFingerprint: null,
  attemptCount: 0,
  leaseToken: null,
  leaseExpiresAt: null,
  recovery: null,
  decision: null,
  traceRunIds: [],
  confirmedAt: null,
  confirmationId: null,
  nextCheckInId: null,
  nextTaskName: null,
  errorName: null,
  createdAt: "2026-07-17T11:59:00.000Z",
  updatedAt: "2026-07-17T11:59:00.000Z",
});

describe("live check-in scheduler", () => {
  it("accepts the Cloud Tasks header as either a full name or task id", () => {
    const full =
      "projects/p/locations/asia-east1/queues/q/tasks/live-live-proof";
    expect(taskIdentityMatches(full, full)).toBe(true);
    expect(taskIdentityMatches(full, "live-live-proof")).toBe(true);
    expect(taskIdentityMatches(full, "another-task")).toBe(false);
  });

  it("targets the preview callback with the existing OIDC identity", () => {
    const queue = "projects/p/locations/asia-east1/queues/q";
    const request = buildLiveCheckInTaskRequest(checkIn, config, queue);
    expect(request.task?.name).toBe(`${queue}/tasks/live-live-proof`);
    expect(request.task?.httpRequest?.url).toBe(
      "https://preview.time-sovereignty.example/api/tasks/live-checkins/live-proof",
    );
    expect(request.task?.httpRequest?.oidcToken).toEqual({
      serviceAccountEmail: config.tasksServiceAccountEmail,
      audience: config.tasksOidcAudience,
    });
  });

  it("turns Cloud Tasks ALREADY_EXISTS into an idempotent success", async () => {
    const client: LiveCloudTasksClientLike = {
      queuePath: () => "projects/p/locations/asia-east1/queues/q",
      createTask: async () => {
        throw Object.assign(new Error("already exists"), { code: 6 });
      },
    };
    const result = await createLiveCheckInScheduler(config, client).schedule(checkIn);
    expect(result.alreadyExisted).toBe(true);
    expect(result.taskName).toContain("/tasks/live-live-proof");
  });
});
