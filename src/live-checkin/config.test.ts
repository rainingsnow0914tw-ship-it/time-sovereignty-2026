import { describe, expect, it } from "vitest";

import { readLiveCheckInConfig } from "./config";

function environment(sessionHours: string): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    LIVE_CHECKIN_ENABLED: "true",
    LIVE_CHECKIN_PAIRING_SECRET: "p".repeat(32),
    LIVE_CHECKIN_SESSION_SECRET: "s".repeat(32),
    LIVE_CHECKIN_SESSION_HOURS: sessionHours,
    LIVE_CHECKIN_ALLOWED_ORIGINS: "https://preview.example",
    GCP_PROJECT_ID: "time-sovereignty-test",
    FIRESTORE_DATABASE_ID: "(default)",
    CLOUD_TASKS_LOCATION: "asia-east1",
    CLOUD_TASKS_QUEUE: "check-ins",
    CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL:
      "tasks@time-sovereignty-test.iam.gserviceaccount.com",
    CLOUD_TASKS_OIDC_AUDIENCE: "https://stable.example",
    CLOUD_TASKS_CALLBACK_BASE_URL: "https://preview.example",
    TASK_CALLBACK_LEASE_SECONDS: "60",
  };
}

describe("live check-in configuration", () => {
  it("allows a bounded multi-day private session", () => {
    expect(readLiveCheckInConfig(environment("96")).sessionHours).toBe(96);
  });

  it("rejects a session longer than seven days", () => {
    expect(() => readLiveCheckInConfig(environment("169"))).toThrow();
  });
});
