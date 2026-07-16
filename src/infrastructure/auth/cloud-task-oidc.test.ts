import { describe, expect, it, vi } from "vitest";

import {
  CloudTaskAuthenticationError,
  verifyCloudTaskOidc,
  type IdTokenVerifier,
} from "./cloud-task-oidc";

const audience = "https://time-sovereignty.example";
const email = "time-sovereignty-tasks@example.iam.gserviceaccount.com";

function verifierWith(payload: {
  aud?: string;
  email?: string;
  email_verified?: boolean;
}): IdTokenVerifier {
  return {
    verifyIdToken: vi.fn(async () => ({ getPayload: () => payload })),
  };
}

describe("verifyCloudTaskOidc", () => {
  it("accepts the expected verified service account and audience", async () => {
    const result = await verifyCloudTaskOidc({
      authorization: "Bearer signed-token",
      expectedAudience: audience,
      expectedServiceAccountEmail: email,
      verifier: verifierWith({ aud: audience, email, email_verified: true }),
    });

    expect(result).toEqual({ email });
  });

  it("fails closed when the bearer token is missing", async () => {
    await expect(
      verifyCloudTaskOidc({
        authorization: null,
        expectedAudience: audience,
        expectedServiceAccountEmail: email,
        verifier: verifierWith({ aud: audience, email, email_verified: true }),
      }),
    ).rejects.toBeInstanceOf(CloudTaskAuthenticationError);
  });

  it("rejects a different service account even when the token is valid", async () => {
    await expect(
      verifyCloudTaskOidc({
        authorization: "Bearer signed-token",
        expectedAudience: audience,
        expectedServiceAccountEmail: email,
        verifier: verifierWith({
          aud: audience,
          email: "other@example.iam.gserviceaccount.com",
          email_verified: true,
        }),
      }),
    ).rejects.toThrow("not authorized");
  });
});
