import { z } from "zod";

import { IsoDateTimeSchema } from "../domain/shared";
import type { CatchLevel } from "./schemas";

export const CatchPushDataSchema = z
  .object({
    kind: z.enum(["catch_message", "catch_prompt", "fake_call"]),
    event_id: z.string().trim().min(1).max(128),
    level: z.enum(["1", "2", "4"]),
    title: z.string().trim().min(1).max(120),
    message: z.string().trim().min(1).max(1_000),
    response_url: z.string().url().max(2_000),
    expires_at: IsoDateTimeSchema,
    idempotency_key: z.string().trim().min(1).max(256),
  })
  .strict();

export type CatchPushData = z.infer<typeof CatchPushDataSchema>;

export function buildCatchPushData(input: {
  eventId: string;
  level: CatchLevel;
  title: string;
  message: string;
  responseUrl: string;
  expiresAt: string;
}): CatchPushData {
  return CatchPushDataSchema.parse({
    kind: kindForLevel(input.level),
    event_id: input.eventId,
    level: String(input.level),
    title: input.title,
    message: input.message,
    response_url: input.responseUrl,
    expires_at: input.expiresAt,
    idempotency_key: `${input.eventId}:level:${input.level}`,
  });
}

function kindForLevel(level: CatchLevel): CatchPushData["kind"] {
  if (level === 1) return "catch_message";
  if (level === 2) return "catch_prompt";
  return "fake_call";
}
