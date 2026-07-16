import { describe, expect, it } from "vitest";

import type { Intervention } from "../../domain/interventions/schemas";
import type { CloudConfig } from "../gcp/config";
import { buildInterventionTaskRequest } from "./intervention-scheduler";

const config: CloudConfig = {
  projectId: "time-sovereignty-2026",
  firestoreDatabaseId: "(default)",
  tasksLocation: "asia-east1",
  tasksQueue: "time-sovereignty-checkins",
  tasksServiceAccountEmail:
    "time-sovereignty-tasks@time-sovereignty-2026.iam.gserviceaccount.com",
  tasksOidcAudience: "https://time-sovereignty.example",
  tasksCallbackBaseUrl: "https://time-sovereignty.example",
  callbackLeaseSeconds: 60,
};

const intervention: Intervention = {
  id: "intervention-proof",
  actionId: "action-proof",
  state: "SCHEDULED",
  trigger: "NEXT_CHECK_AT",
  channel: "TEXT",
  scheduledFor: "2026-07-16T14:30:00.000Z",
  deliveryKey: "action-proof:2026-07-16T14:30:00.000Z",
  delayCount: 0,
  delayHistory: [],
  createdAt: "2026-07-16T14:20:00.000Z",
  updatedAt: "2026-07-16T14:20:00.000Z",
};

describe("buildInterventionTaskRequest", () => {
  it("creates an OIDC-authenticated one-time callback task", () => {
    const queuePath =
      "projects/time-sovereignty-2026/locations/asia-east1/queues/time-sovereignty-checkins";
    const request = buildInterventionTaskRequest(intervention, config, queuePath);

    expect(request.parent).toBe(queuePath);
    expect(request.task?.name).toContain("intervention-proof-");
    expect(request.task?.httpRequest?.url).toBe(
      "https://time-sovereignty.example/api/tasks/interventions/intervention-proof",
    );
    expect(request.task?.httpRequest?.oidcToken).toEqual({
      serviceAccountEmail: config.tasksServiceAccountEmail,
      audience: config.tasksOidcAudience,
    });
    expect(
      Buffer.from(String(request.task?.httpRequest?.body), "base64").toString(
        "utf8",
      ),
    ).toBe(JSON.stringify({ interventionId: intervention.id }));
  });

  it("refuses to schedule an intervention that is already due", () => {
    expect(() =>
      buildInterventionTaskRequest(
        { ...intervention, state: "DUE" },
        config,
        "queue-path",
      ),
    ).toThrow("Only SCHEDULED interventions");
  });
});
