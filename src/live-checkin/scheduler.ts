import { CloudTasksClient, protos } from "@google-cloud/tasks";

import type { CloudConfig } from "../infrastructure/gcp/config";
import type { LiveCheckInDocument } from "./schemas";

type CreateTaskRequest = protos.google.cloud.tasks.v2.ICreateTaskRequest;
type Task = protos.google.cloud.tasks.v2.ITask;

export interface LiveCloudTasksClientLike {
  queuePath(projectId: string, location: string, queue: string): string;
  createTask(request: CreateTaskRequest): Promise<[Task, unknown, unknown]>;
}

export interface ScheduledLiveCheckInTask {
  taskName: string;
  callbackUrl: string;
  scheduledFor: string;
  alreadyExisted: boolean;
}

export function buildLiveCheckInTaskRequest(
  checkIn: LiveCheckInDocument,
  config: CloudConfig,
  queuePath: string,
): CreateTaskRequest {
  if (checkIn.status !== "SCHEDULED") {
    throw new Error(`Live check-in cannot be scheduled from ${checkIn.status}.`);
  }
  const taskId = `live-${checkIn.id.replace(/[^A-Za-z0-9_-]/gu, "-")}`.slice(
    0,
    500,
  );
  const callbackUrl = new URL(
    `/api/tasks/live-checkins/${encodeURIComponent(checkIn.id)}`,
    config.tasksCallbackBaseUrl,
  ).toString();
  return {
    parent: queuePath,
    task: {
      name: `${queuePath}/tasks/${taskId}`,
      scheduleTime: {
        seconds: Math.floor(new Date(checkIn.scheduledFor).getTime() / 1_000),
      },
      dispatchDeadline: { seconds: 30 },
      httpRequest: {
        httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
        url: callbackUrl,
        headers: { "Content-Type": "application/json" },
        body: Buffer.from(
          JSON.stringify({ checkInId: checkIn.id }),
          "utf8",
        ).toString("base64"),
        oidcToken: {
          serviceAccountEmail: config.tasksServiceAccountEmail,
          audience: config.tasksOidcAudience,
        },
      },
    },
  };
}

export function createLiveCheckInScheduler(
  config: CloudConfig,
  client: LiveCloudTasksClientLike = new CloudTasksClient(),
): {
  schedule(checkIn: LiveCheckInDocument): Promise<ScheduledLiveCheckInTask>;
} {
  return {
    async schedule(checkIn) {
      const queuePath = client.queuePath(
        config.projectId,
        config.tasksLocation,
        config.tasksQueue,
      );
      const request = buildLiveCheckInTaskRequest(checkIn, config, queuePath);
      const expectedTaskName = request.task?.name;
      const callbackUrl = request.task?.httpRequest?.url;
      if (!expectedTaskName || !callbackUrl) {
        throw new Error("Live Cloud Task request has no identity or callback URL.");
      }
      try {
        const [task] = await client.createTask(request);
        return {
          taskName: task.name ?? expectedTaskName,
          callbackUrl,
          scheduledFor: checkIn.scheduledFor,
          alreadyExisted: false,
        };
      } catch (error) {
        if (!isAlreadyExists(error)) throw error;
        return {
          taskName: expectedTaskName,
          callbackUrl,
          scheduledFor: checkIn.scheduledFor,
          alreadyExisted: true,
        };
      }
    },
  };
}

function isAlreadyExists(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === 6,
  );
}
