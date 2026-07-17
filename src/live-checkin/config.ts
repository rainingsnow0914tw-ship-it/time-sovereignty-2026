import { z } from "zod";

import { readCloudConfig, type CloudConfig } from "../infrastructure/gcp/config";

const LiveConfigSchema = z
  .object({
    enabled: z.literal(true),
    pairingSecret: z.string().min(32),
    sessionSecret: z.string().min(32),
    sessionHours: z.number().int().min(1).max(24),
    allowedOrigins: z.array(z.string().url()).min(1).max(8),
  })
  .strict();

export type LiveCheckInConfig = z.infer<typeof LiveConfigSchema> & {
  cloud: CloudConfig;
};

export function isLiveCheckInEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return env.LIVE_CHECKIN_ENABLED === "true";
}

export function readLiveCheckInConfig(
  env: NodeJS.ProcessEnv = process.env,
): LiveCheckInConfig {
  if (!isLiveCheckInEnabled(env)) {
    throw new LiveCheckInDisabledError();
  }

  const live = LiveConfigSchema.parse({
    enabled: true,
    pairingSecret: env.LIVE_CHECKIN_PAIRING_SECRET,
    sessionSecret: env.LIVE_CHECKIN_SESSION_SECRET,
    sessionHours: Number(env.LIVE_CHECKIN_SESSION_HOURS ?? "12"),
    allowedOrigins: (env.LIVE_CHECKIN_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  });

  return { ...live, cloud: readCloudConfig(env) };
}

export class LiveCheckInDisabledError extends Error {
  constructor() {
    super("Live check-in is disabled.");
    this.name = "LiveCheckInDisabledError";
  }
}
