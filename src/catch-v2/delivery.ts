import type { CloudConfig } from "../infrastructure/gcp/config";
import type { LiveCheckInDocument } from "../live-checkin/schemas";
import { moveOutsideQuietHours } from "../live-checkin/quiet-hours";
import type { CatchV2Config } from "./config";
import { CATCH_RESPONSE_DEADLINE_SECONDS, evaluateCatchEscalation, nextEscalationLevel } from "./escalation";
import { sendFcmDataMessage, FcmDeliveryError } from "./fcm-v1";
import { createCatchDeliveryRepository } from "./firestore-delivery-repository";
import { createCatchDeviceRepository } from "./firestore-device-repository";
import { createCatchResponseRepository } from "./firestore-response-repository";
import { buildCatchPushData } from "./push";
import { createCatchEscalationScheduler } from "./scheduler";
import type { CatchLevel } from "./schemas";

export class CatchDeliveryBusyError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("Catch delivery lease is busy.");
    this.name = "CatchDeliveryBusyError";
  }
}

export function evaluateCatchDeliveryGuard(options: {
  eventId: string;
  requestedLevel: CatchLevel;
  status: LiveCheckInDocument["status"];
  quietHours: LiveCheckInDocument["context"]["quietHours"];
  fullScreenConsent: boolean;
  now: Date;
}) {
  const previousLevel = options.requestedLevel === 4 ? 2 : 1;
  const moved = options.quietHours
    ? moveOutsideQuietHours(options.now, options.quietHours)
    : options.now;
  const decision = evaluateCatchEscalation({
    eventId: options.eventId,
    level: previousLevel,
    priority: "HIGH",
    responded: !["PENDING", "FAILED"].includes(options.status),
    cancelled: false,
    supportPaused: false,
    categoryEnabled: true,
    consentValid: true,
    fullScreenConsent: options.fullScreenConsent,
    withinQuietHours: moved.getTime() !== options.now.getTime(),
    userCondition: "NORMAL",
  });
  if (
    decision.kind === "ESCALATE" &&
    options.requestedLevel > 1 &&
    decision.to !== options.requestedLevel
  ) {
    throw new Error("Catch escalation level mismatch.");
  }
  return decision;
}

export async function deliverCatchLevel(options: {
  checkIn: LiveCheckInDocument;
  level: CatchLevel;
  cloud: CloudConfig;
  v2: CatchV2Config;
  now?: () => Date;
}): Promise<{
  result: "DELIVERED" | "DUPLICATE" | "STOPPED" | "NO_DEVICE" | "INVALID_TOKEN" | "FAILED_PERMANENT";
  nextLevel: CatchLevel | null;
  stopReason?: string;
}> {
  const { checkIn, level, cloud, v2 } = options;
  const now = options.now ?? (() => new Date());
  const currentTime = now();
  const device = await createCatchDeviceRepository(cloud).findActiveBySession(
    checkIn.sessionId,
  );
  if (!device) return { result: "NO_DEVICE", nextLevel: null };
  const hasRecordedResponse = await createCatchResponseRepository(
    cloud,
  ).hasRecordedResponse(checkIn.id, checkIn.sessionId);
  if (hasRecordedResponse) {
    return {
      result: "STOPPED",
      nextLevel: null,
      stopReason: "USER_RESPONDED",
    };
  }

  const decision = evaluateCatchDeliveryGuard({
    eventId: checkIn.id,
    requestedLevel: level,
    status: checkIn.status,
    quietHours: checkIn.context.quietHours,
    fullScreenConsent: device.fullScreenConsentAt !== null,
    now: currentTime,
  });
  if (decision.kind === "STOP") {
    return { result: "STOPPED", nextLevel: null, stopReason: decision.reason };
  }

  const receipts = createCatchDeliveryRepository(cloud);
  const claim = await receipts.claim(checkIn.id, level);
  if (claim.kind === "BUSY") {
    throw new CatchDeliveryBusyError(claim.retryAfterSeconds);
  }
  let result: "DELIVERED" | "DUPLICATE" | "INVALID_TOKEN" | "FAILED_PERMANENT";
  if (claim.kind === "DUPLICATE") {
    if (claim.receipt.status === "INVALID_TOKEN") {
      return { result: "INVALID_TOKEN", nextLevel: null };
    }
    if (claim.receipt.status === "FAILED_PERMANENT") {
      return { result: "FAILED_PERMANENT", nextLevel: null };
    }
    result = "DUPLICATE";
  } else {
    const delaySeconds =
      v2.testEscalationSeconds ?? CATCH_RESPONSE_DEADLINE_SECONDS[level];
    const expiresAt = new Date(currentTime.getTime() + delaySeconds * 1_000);
    const responseUrl = new URL(
      `/api/live/native/events/${encodeURIComponent(checkIn.id)}/responses`,
      v2.responseBaseUrl,
    ).toString();
    try {
      const delivered = await sendFcmDataMessage({
        projectId: v2.firebaseProjectId,
        deviceToken: device.fcmToken,
        data: buildCatchPushData({
          eventId: checkIn.id,
          level,
          title: level === 4 ? "澄來找妳了" : "Time Sovereignty 報到",
          message: checkIn.message,
          responseUrl,
          expiresAt: expiresAt.toISOString(),
        }),
      });
      if (delivered.kind === "INVALID_TOKEN") {
        await receipts.complete({
          eventId: checkIn.id,
          level,
          leaseToken: claim.receipt.leaseToken,
          outcome: "INVALID_TOKEN",
          providerMessageName: null,
        });
        await createCatchDeviceRepository(cloud).revoke(device.id);
        return { result: "INVALID_TOKEN", nextLevel: null };
      }
      await receipts.complete({
        eventId: checkIn.id,
        level,
        leaseToken: claim.receipt.leaseToken,
        outcome: "DELIVERED",
        providerMessageName: delivered.providerMessageName,
      });
      result = "DELIVERED";
    } catch (error) {
      if (error instanceof FcmDeliveryError && !error.retryable) {
        await receipts.complete({
          eventId: checkIn.id,
          level,
          leaseToken: claim.receipt.leaseToken,
          outcome: "FAILED_PERMANENT",
          providerMessageName: null,
        });
        return { result: "FAILED_PERMANENT", nextLevel: null };
      }
      throw error;
    }
  }

  const nextLevel = nextEscalationLevel(level);
  if (nextLevel) {
    const delaySeconds =
      v2.testEscalationSeconds ?? CATCH_RESPONSE_DEADLINE_SECONDS[level];
    await createCatchEscalationScheduler(cloud).schedule({
      eventId: checkIn.id,
      level: nextLevel,
      scheduledFor: new Date(now().getTime() + delaySeconds * 1_000),
    });
  }
  return { result, nextLevel };
}
