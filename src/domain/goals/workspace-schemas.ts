import { z } from "zod";

import { AgentRunTraceSchema } from "../agents/schemas";
import { EntityIdSchema, IsoDateTimeSchema } from "../shared";
import {
  ActionSchema,
  GoalPlanSchema,
  GoalSchema,
  ProgressFormatSchema,
  QuietHoursSchema,
  StrategyOutcomeSchema,
  SupportAgreementSchema,
} from "./schemas";

export const LocalClockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/u);

export const GoalWorkspaceStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
]);

export const GoalScheduleModeSchema = z.enum([
  "DAILY",
  "WEEKDAYS",
  "WEEKLY",
  "AI_LED",
]);

export const GoalScheduleSlotSchema = z
  .object({
    id: EntityIdSchema,
    localTime: LocalClockTimeSchema,
    label: z.string().trim().min(1).max(120).nullable(),
  })
  .strict();

export const GoalSchedulePolicySchema = z
  .object({
    version: z.literal(1),
    mode: GoalScheduleModeSchema,
    timezone: z.string().trim().min(1).max(120),
    slots: z.array(GoalScheduleSlotSchema).min(1).max(8),
    weekdays: z.array(z.number().int().min(0).max(6)).max(7),
    quietHours: QuietHoursSchema,
    targetEndAt: IsoDateTimeSchema.nullable(),
    nextOccurrenceAt: IsoDateTimeSchema.nullable(),
  })
  .strict()
  .superRefine((schedule, context) => {
    const times = schedule.slots.map((slot) => slot.localTime);
    if (new Set(times).size !== times.length) {
      context.addIssue({
        code: "custom",
        path: ["slots"],
        message: "A goal schedule cannot contain duplicate local times.",
      });
    }
    if (
      schedule.mode === "WEEKLY" &&
      schedule.weekdays.length !== 1
    ) {
      context.addIssue({
        code: "custom",
        path: ["weekdays"],
        message: "A weekly schedule requires exactly one weekday.",
      });
    }
    if (
      schedule.targetEndAt &&
      schedule.nextOccurrenceAt &&
      new Date(schedule.nextOccurrenceAt).getTime() >=
        new Date(schedule.targetEndAt).getTime()
    ) {
      context.addIssue({
        code: "custom",
        path: ["nextOccurrenceAt"],
        message: "The next occurrence must happen before the goal end time.",
      });
    }
  });

export const GoalAssumptionDispositionSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "EDITED",
]);

export const GoalPlanAssumptionSchema = z
  .object({
    id: EntityIdSchema,
    statement: z.string().trim().min(1).max(700),
    disposition: GoalAssumptionDispositionSchema,
    userNote: z.string().trim().min(1).max(1_000).nullable(),
  })
  .strict();

export const GoalPlanRevisionSourceSchema = z.enum([
  "GOAL_ARCHITECT",
  "USER_CORRECTION",
  "MANUAL_EDIT",
]);

export const GoalPlanRevisionSchema = z
  .object({
    version: z.literal(1),
    id: EntityIdSchema,
    sessionId: EntityIdSchema,
    goalId: EntityIdSchema,
    ordinal: z.number().int().positive(),
    source: GoalPlanRevisionSourceSchema,
    plan: GoalPlanSchema,
    assumptions: z.array(GoalPlanAssumptionSchema).max(12),
    feedbackSummary: z.string().trim().min(1).max(2_000).nullable(),
    trace: AgentRunTraceSchema.nullable(),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export const GoalWorkspaceSchema = z
  .object({
    version: z.literal(1),
    id: EntityIdSchema,
    sessionId: EntityIdSchema,
    status: GoalWorkspaceStatusSchema,
    goal: GoalSchema,
    action: ActionSchema,
    supportAgreement: SupportAgreementSchema,
    currentPlanRevisionId: EntityIdSchema,
    schedule: GoalSchedulePolicySchema,
    nextCheckInId: EntityIdSchema.nullable(),
    nextTaskName: z.string().trim().min(1).max(1_000).nullable(),
    lastAttendanceAt: IsoDateTimeSchema.nullable(),
    revision: z.number().int().positive(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .strict()
  .superRefine((workspace, context) => {
    if (
      workspace.goal.id !== workspace.id ||
      workspace.action.goalId !== workspace.id ||
      workspace.supportAgreement.goalId !== workspace.id
    ) {
      context.addIssue({
        code: "custom",
        path: ["id"],
        message: "Goal, action, agreement, and workspace identities must match.",
      });
    }
    if (
      workspace.status !== "ACTIVE" &&
      (workspace.nextCheckInId || workspace.nextTaskName)
    ) {
      context.addIssue({
        code: "custom",
        path: ["nextCheckInId"],
        message: "Paused or terminal goals cannot retain an active check-in.",
      });
    }
  });

export const GoalAttendanceStatusSchema = z.enum([
  "COMPLETED",
  "PARTIAL",
  "BLOCKED",
  "RESCHEDULED",
  "REST",
  "MISSED",
  "CANCELLED",
]);

export const GoalAttendanceEntrySchema = z
  .object({
    version: z.literal(1),
    id: EntityIdSchema,
    sessionId: EntityIdSchema,
    goalId: EntityIdSchema,
    checkInId: EntityIdSchema.nullable(),
    scheduledFor: IsoDateTimeSchema,
    recordedAt: IsoDateTimeSchema,
    status: GoalAttendanceStatusSchema,
    evidenceKinds: z.array(ProgressFormatSchema).max(3),
    summary: z.string().trim().min(1).max(2_000),
    selectedStrategy: StrategyOutcomeSchema.nullable(),
    countsTowardGoal: z.boolean(),
  })
  .strict();

export const GoalDeletionTombstoneSchema = z
  .object({
    version: z.literal(1),
    goalId: EntityIdSchema,
    sessionId: EntityIdSchema,
    invalidatedCheckInId: EntityIdSchema.nullable(),
    invalidatedTaskName: z.string().trim().min(1).max(1_000).nullable(),
    deletedAt: IsoDateTimeSchema,
  })
  .strict();

export type GoalWorkspaceStatus = z.infer<
  typeof GoalWorkspaceStatusSchema
>;
export type GoalScheduleMode = z.infer<typeof GoalScheduleModeSchema>;
export type GoalScheduleSlot = z.infer<typeof GoalScheduleSlotSchema>;
export type GoalSchedulePolicy = z.infer<typeof GoalSchedulePolicySchema>;
export type GoalPlanAssumption = z.infer<typeof GoalPlanAssumptionSchema>;
export type GoalPlanRevision = z.infer<typeof GoalPlanRevisionSchema>;
export type GoalWorkspace = z.infer<typeof GoalWorkspaceSchema>;
export type GoalAttendanceStatus = z.infer<
  typeof GoalAttendanceStatusSchema
>;
export type GoalAttendanceEntry = z.infer<typeof GoalAttendanceEntrySchema>;
export type GoalDeletionTombstone = z.infer<
  typeof GoalDeletionTombstoneSchema
>;
