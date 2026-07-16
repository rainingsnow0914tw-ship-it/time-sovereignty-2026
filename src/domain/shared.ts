import { z } from "zod";

export const EntityIdSchema = z.string().trim().min(1).max(128);
export const IsoDateTimeSchema = z.string().datetime({ offset: true });

export const MemorySourceTypeSchema = z.enum([
  "CONFIRMED_BY_USER",
  "OBSERVED_PATTERN",
  "AI_HYPOTHESIS",
  "EXTERNAL_SOURCE",
]);

export type MemorySourceType = z.infer<typeof MemorySourceTypeSchema>;

export function toIsoDateTime(value: Date): string {
  return value.toISOString();
}
