import { describe, expect, it } from "vitest";

import {
  LIVE_PRIVATE_OWNER_ID,
  LiveDeviceSessionSchema,
} from "./schemas";

describe("live schema backward compatibility", () => {
  it("upgrades the legacy phone session without retaining its obsolete goal index", () => {
    const session = LiveDeviceSessionSchema.parse({
      version: 1,
      id: "f7322b54-6338-4565-8f93-cb3271996c72",
      deviceLabel: "Android PWA",
      expiresAt: "2026-07-22T10:03:20.905Z",
      activeCheckInId: "follow-live-1784499276418-0d6572b0",
      lastConfirmedCheckInId: "live-1784499276418-0d6572b0",
      goalStates: {
        "legacy-goal": { activeCheckInId: "legacy-check-in" },
      },
      createdAt: "2026-07-18T10:03:21.531Z",
      revokedAt: null,
      updatedAt: "2026-07-19T22:34:08.099Z",
    });

    expect(session.ownerId).toBe(LIVE_PRIVATE_OWNER_ID);
    expect(session).not.toHaveProperty("goalStates");
    expect(session.activeCheckInId).toBe("follow-live-1784499276418-0d6572b0");
  });
});
