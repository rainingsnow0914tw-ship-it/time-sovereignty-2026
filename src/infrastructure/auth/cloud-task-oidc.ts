export class CloudTaskAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CloudTaskAuthenticationError";
  }
}

interface VerifiedTokenPayload {
  aud?: string | string[];
  email?: string;
  email_verified?: boolean;
}

export interface IdTokenVerifier {
  verifyIdToken(options: {
    idToken: string;
    audience: string;
  }): Promise<{ getPayload(): VerifiedTokenPayload | undefined }>;
}

function readBearerToken(authorization: string | null): string {
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) {
    throw new CloudTaskAuthenticationError("Missing bearer token.");
  }
  return match[1];
}

export async function verifyCloudTaskOidc(options: {
  authorization: string | null;
  expectedAudience: string;
  expectedServiceAccountEmail: string;
  verifier: IdTokenVerifier;
}): Promise<{ email: string }> {
  const idToken = readBearerToken(options.authorization);
  let payload: VerifiedTokenPayload | undefined;

  try {
    const ticket = await options.verifier.verifyIdToken({
      idToken,
      audience: options.expectedAudience,
    });
    payload = ticket.getPayload();
  } catch {
    throw new CloudTaskAuthenticationError("OIDC token verification failed.");
  }

  if (!payload?.email || payload.email_verified !== true) {
    throw new CloudTaskAuthenticationError(
      "OIDC token does not contain a verified email.",
    );
  }

  if (payload.email !== options.expectedServiceAccountEmail) {
    throw new CloudTaskAuthenticationError(
      "OIDC token service account is not authorized.",
    );
  }

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(options.expectedAudience)) {
    throw new CloudTaskAuthenticationError("OIDC token audience is invalid.");
  }

  return { email: payload.email };
}
