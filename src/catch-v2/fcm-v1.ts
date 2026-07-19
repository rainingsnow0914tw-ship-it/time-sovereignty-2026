import { GoogleAuth } from "google-auth-library";

import { CatchPushDataSchema, type CatchPushData } from "./push";

const FIREBASE_MESSAGING_SCOPE =
  "https://www.googleapis.com/auth/firebase.messaging";

export interface FcmAccessTokenProvider {
  getAccessToken(): Promise<string>;
}

export type CatchFcmDeliveryResult =
  | { kind: "DELIVERED"; providerMessageName: string | null }
  | { kind: "INVALID_TOKEN" };

export class FcmDeliveryError extends Error {
  constructor(
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(`FCM delivery failed with status ${status}.`);
    this.name = "FcmDeliveryError";
  }
}

export function createGoogleFcmAccessTokenProvider(): FcmAccessTokenProvider {
  const auth = new GoogleAuth({ scopes: [FIREBASE_MESSAGING_SCOPE] });
  return {
    async getAccessToken() {
      const client = await auth.getClient();
      const result = await client.getAccessToken();
      if (!result.token) throw new Error("FCM access token is unavailable.");
      return result.token;
    },
  };
}

export async function sendFcmDataMessage(
  input: {
    projectId: string;
    deviceToken: string;
    data: CatchPushData;
  },
  dependencies: {
    tokenProvider?: FcmAccessTokenProvider;
    fetcher?: typeof fetch;
  } = {},
): Promise<CatchFcmDeliveryResult> {
  const projectId = input.projectId.trim();
  const deviceToken = input.deviceToken.trim();
  if (!projectId || !deviceToken) {
    throw new Error("FCM project and device token are required.");
  }

  const data = CatchPushDataSchema.parse(input.data);
  const tokenProvider =
    dependencies.tokenProvider ?? createGoogleFcmAccessTokenProvider();
  const fetcher = dependencies.fetcher ?? fetch;
  const accessToken = await tokenProvider.getAccessToken();

  // Deliberately one HTTP attempt. Durable Cloud Tasks owns outer retries.
  const response = await fetcher(
    `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          data,
          android: { priority: "high" },
        },
      }),
    },
  );

  if (response.ok) {
    const body = (await response.json().catch(() => null)) as {
      name?: unknown;
    } | null;
    return {
      kind: "DELIVERED",
      providerMessageName:
        typeof body?.name === "string" ? body.name.slice(0, 1_000) : null,
    };
  }

  if (response.status === 404) {
    return { kind: "INVALID_TOKEN" };
  }

  throw new FcmDeliveryError(
    response.status,
    response.status === 429 || response.status >= 500,
  );
}
