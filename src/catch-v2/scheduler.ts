import { CloudTasksClient, protos } from "@google-cloud/tasks";

import type { CloudConfig } from "../infrastructure/gcp/config";
import type { CatchLevel } from "./schemas";

type CreateTaskRequest = protos.google.cloud.tasks.v2.ICreateTaskRequest;

export interface CatchTasksClientLike {
  queuePath(projectId: string, location: string, queue: string): string;
  createTask(request: CreateTaskRequest): Promise<[protos.google.cloud.tasks.v2.ITask, unknown, unknown]>;
}

export function buildCatchEscalationTaskRequest(options: {
  eventId: string;
  level: CatchLevel;
  scheduledFor: Date;
  config: CloudConfig;
  queuePath: string;
}): CreateTaskRequest {
  const { eventId, level, scheduledFor, config, queuePath } = options;
  const safeEvent = eventId.replace(/[^A-Za-z0-9_-]/gu, "-").slice(0, 380);
  const callbackUrl = new URL(
    `/api/tasks/catch-v2/events/${encodeURIComponent(eventId)}/levels/${level}`,
    config.tasksCallbackBaseUrl,
  ).toString();
  return {
    parent: queuePath,
    task: {
      name: `${queuePath}/tasks/catch-${safeEvent}-level-${level}`,
      scheduleTime: { seconds: Math.floor(scheduledFor.getTime() / 1_000) },
      dispatchDeadline: { seconds: 60 },
      httpRequest: {
        httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
        url: callbackUrl,
        headers: { "Content-Type": "application/json" },
        body: Buffer.from(JSON.stringify({ eventId, level }), "utf8").toString(
          "base64",
        ),
        oidcToken: {
          serviceAccountEmail: config.tasksServiceAccountEmail,
          audience: config.tasksOidcAudience,
        },
      },
    },
  };
}

export function createCatchEscalationScheduler(
  config: CloudConfig,
  client: CatchTasksClientLike = new CloudTasksClient(),
): {
  schedule(input: {
    eventId: string;
    level: CatchLevel;
    scheduledFor: Date;
  }): Promise<{ taskName: string; alreadyExisted: boolean }>;
} {
  return {
    async schedule({ eventId, level, scheduledFor }) {
      const queuePath = client.queuePath(
        config.projectId,
        config.tasksLocation,
        config.tasksQueue,
      );
      const request = buildCatchEscalationTaskRequest({
        eventId,
        level,
        scheduledFor,
        config,
        queuePath,
      });
      const expectedName = request.task?.name;
      if (!expectedName) throw new Error("Catch escalation task has no identity.");
      try {
        const [task] = await client.createTask(request);
        return { taskName: task.name ?? expectedName, alreadyExisted: false };
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          (error as { code?: unknown }).code === 6
        ) {
          return { taskName: expectedName, alreadyExisted: true };
        }
        throw error;
      }
    },
  };
}
