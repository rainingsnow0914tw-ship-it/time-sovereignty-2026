import { z } from "zod";

import { EntityIdSchema, IsoDateTimeSchema } from "../domain/shared";

export const CatchNativePairRequestSchema = z
  .object({
    pairingTicket: z.string().min(32).max(500),
    deviceLabel: z.string().trim().min(1).max(120),
    fcmToken: z.string().trim().min(32).max(4_096),
    locale: z.enum(["zh-TW", "en"]),
    notificationConsent: z.literal(true),
    fullScreenConsent: z.boolean(),
  })
  .strict();

export const CatchPairingTicketDocumentSchema = z
  .object({
    version: z.literal(1),
    ticketHash: z.string().regex(/^[a-f0-9]{64}$/u),
    sessionId: EntityIdSchema,
    expiresAt: IsoDateTimeSchema,
    deviceExpiresAt: IsoDateTimeSchema,
    claimedAt: IsoDateTimeSchema.nullable(),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export const CatchPairingTicketResponseSchema = z
  .object({
    ok: z.literal(true),
    pairingTicket: z.string().min(32).max(500),
    expiresAt: IsoDateTimeSchema,
  })
  .strict();

export const CatchDeviceDocumentSchema = z
  .object({
    version: z.literal(1),
    id: EntityIdSchema,
    sessionId: EntityIdSchema,
    deviceLabel: z.string().trim().min(1).max(120),
    locale: z.enum(["zh-TW", "en"]),
    fcmToken: z.string().trim().min(32).max(4_096),
    fcmTokenFingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
    credentialHash: z.string().regex(/^[a-f0-9]{64}$/u),
    notificationConsentAt: IsoDateTimeSchema,
    fullScreenConsentAt: IsoDateTimeSchema.nullable(),
    expiresAt: IsoDateTimeSchema,
    revokedAt: IsoDateTimeSchema.nullable(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .strict();

export const CatchNativePairResponseSchema = z
  .object({
    ok: z.literal(true),
    deviceId: EntityIdSchema,
    credential: z.string().min(32).max(500),
    expiresAt: IsoDateTimeSchema,
    fullScreenEnabled: z.boolean(),
  })
  .strict();

export type CatchNativePairRequest = z.infer<
  typeof CatchNativePairRequestSchema
>;
export type CatchDeviceDocument = z.infer<typeof CatchDeviceDocumentSchema>;
export type CatchPairingTicketDocument = z.infer<
  typeof CatchPairingTicketDocumentSchema
>;
