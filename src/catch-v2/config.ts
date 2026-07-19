import { z } from "zod";

const CatchV2ConfigSchema = z
  .object({
    enabled: z.literal(true),
    firebaseProjectId: z.string().trim().min(1),
    pairingTicketMinutes: z.number().int().min(2).max(30),
    deviceHours: z.number().int().min(1).max(168),
    responseBaseUrl: z.string().url(),
    testEscalationSeconds: z.number().int().min(10).max(300).nullable(),
  })
  .strict();

export type CatchV2Config = z.infer<typeof CatchV2ConfigSchema>;

export function isCatchV2Enabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return env.CATCH_V2_ENABLED === "true";
}

export function readCatchV2Config(
  env: NodeJS.ProcessEnv = process.env,
): CatchV2Config {
  if (!isCatchV2Enabled(env)) throw new CatchV2DisabledError();
  return CatchV2ConfigSchema.parse({
    enabled: true,
    firebaseProjectId: env.CATCH_V2_FIREBASE_PROJECT_ID,
    pairingTicketMinutes: Number(env.CATCH_V2_PAIRING_TICKET_MINUTES ?? "10"),
    deviceHours: Number(env.CATCH_V2_DEVICE_HOURS ?? "72"),
    responseBaseUrl: env.CATCH_V2_RESPONSE_BASE_URL,
    testEscalationSeconds: env.CATCH_V2_TEST_ESCALATION_SECONDS
      ? Number(env.CATCH_V2_TEST_ESCALATION_SECONDS)
      : null,
  });
}

export class CatchV2DisabledError extends Error {
  constructor() {
    super("Private V2 native delivery is disabled.");
    this.name = "CatchV2DisabledError";
  }
}
