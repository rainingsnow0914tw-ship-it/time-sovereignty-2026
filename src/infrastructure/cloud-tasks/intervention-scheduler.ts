import { CloudTasksClient, protos } from "@google-cloud/tasks";

import { InterventionSchema, type Intervention } from "../../domain/interventions/schemas";
import type { CloudConfig } from "../gcp/config";

type CreateTaskRequest = protos.google.cloud.tasks.v2.ICreateTaskRequest;
type Task = protos.google.cloud.tasks.v2.ITask;

export interface CloudTasksClientLike {
  queuePath(projectId: string, location: string, queue: string): string;
  createTask(request: CreateTaskRequest): Promise<[Task, unknown, unknown]>;
}

export interface ScheduledInterventionTask {
  taskName: string;
  callbackUrl: string;
  scheduledFor: string;
}

function taskIdFor(intervention: Intervention): string {
  const safeId = intervention.id.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 120);
  const scheduledMillis = new Date(intervention.scheduledFor).getTime();
  return `${safeId}-${scheduledMillis}`;
}

export function buildInterventionTaskRequest(
  rawIntervention: Intervention,
  config: CloudConfig,
  queuePath: string,
): CreateTaskRequest {
  const intervention = InterventionSchema.parse(rawIntervention);
  if (intervention.state !== "SCHEDULED") {
    throw new Error(
      `Only SCHEDULED interventions can create tasks; received ${intervention.state}.`,
    );
  }

  const callbackUrl = new URL(
    `/api/tasks/interventions/${encodeURIComponent(intervention.id)}`,
    config.tasksCallbackBaseUrl,
  ).toString();
  const payload = Buffer.from(
    JSON.stringify({ interventionId: intervention.id }),
    "utf8",
  ).toString("base64");

  return {
    parent: queuePath,
    task: {
      name: `${queuePath}/tasks/${taskIdFor(intervention)}`,
      scheduleTime: {
        seconds: Math.floor(new Date(intervention.scheduledFor).getTime() / 1_000),
      },
      dispatchDeadline: { seconds: 30 },
      httpRequest: {
        httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
        url: callbackUrl,
        headers: { "Content-Type": "application/json" },
        body: payload,
        oidcToken: {
          serviceAccountEmail: config.tasksServiceAccountEmail,
          audience: config.tasksOidcAudience,
        },
      },
    },
  };
}

export function createInterventionScheduler(
  config: CloudConfig,
  client: CloudTasksClientLike = new CloudTasksClient(),
): {
  schedule(intervention: Intervention): Promise<ScheduledInterventionTask>;
} {
  return {
    async schedule(intervention) {
      const queuePath = client.queuePath(
        config.projectId,
        config.tasksLocation,
        config.tasksQueue,
      );
      const request = buildInterventionTaskRequest(intervention, config, queuePath);
      const [task] = await client.createTask(request);
      const taskName = task.name;
      const callbackUrl = request.task?.httpRequest?.url;

      if (!taskName || !callbackUrl) {
        throw new Error("Cloud Tasks did not return the created task identity.");
      }

      return {
        taskName,
        callbackUrl,
        scheduledFor: intervention.scheduledFor,
      };
    },
  };
}
