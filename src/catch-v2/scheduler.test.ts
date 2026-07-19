import { describe, expect, it } from "vitest";

import type { CloudConfig } from "../infrastructure/gcp/config";
import { buildCatchEscalationTaskRequest } from "./scheduler";

const config: CloudConfig = {
  projectId: "project-one",
  firestoreDatabaseId: "(default)",
  tasksLocation: "asia-east1",
  tasksQueue: "intervention-due",
  tasksCallbackBaseUrl: "https://v2-private.example",
  tasksOidcAudience: "https://service.example",
  tasksServiceAccountEmail: "tasks@example.iam.gserviceaccount.com",
  callbackLeaseSeconds: 60,
};

describe("catch escalation Cloud Task", () => {
  it("creates a stable OIDC callback for one event level", () => {
    const request = buildCatchEscalationTaskRequest({
      eventId: "event-one",
      level: 4,
      scheduledFor: new Date("2026-07-19T12:00:15.000Z"),
      config,
      queuePath: "projects/p/locations/l/queues/q",
    });
    expect(request.task).toMatchObject({
      name: "projects/p/locations/l/queues/q/tasks/catch-event-one-level-4",
      httpRequest: {
        url: "https://v2-private.example/api/tasks/catch-v2/events/event-one/levels/4",
        oidcToken: {
          audience: "https://service.example",
          serviceAccountEmail: "tasks@example.iam.gserviceaccount.com",
        },
      },
    });
  });
});
