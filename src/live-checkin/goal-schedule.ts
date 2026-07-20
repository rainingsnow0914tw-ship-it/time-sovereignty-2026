import type { GoalSchedulePolicy } from "../domain/goals/workspace-schemas";

// Pure schedule arithmetic. This stays free of Firestore, Cloud Tasks, and any
// other side effect so that both the goal loop and the initial workspace
// builder can compute the same next occurrence from the user's own slots.

function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      read("weekday"),
    ),
  };
}

function localDateTimeToUtc(options: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timezone: string;
}) {
  const desired = Date.UTC(
    options.year,
    options.month - 1,
    options.day,
    options.hour,
    options.minute,
  );
  let candidate = new Date(desired);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const actual = zonedParts(candidate, options.timezone);
    const represented = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    candidate = new Date(candidate.getTime() + desired - represented);
  }
  return candidate;
}

function clockMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function isQuiet(localTime: string, schedule: GoalSchedulePolicy) {
  const value = clockMinutes(localTime);
  const start = clockMinutes(schedule.quietHours.start);
  const end = clockMinutes(schedule.quietHours.end);
  if (start === end) return false;
  return start < end
    ? value >= start && value < end
    : value >= start || value < end;
}

function allowedWeekday(schedule: GoalSchedulePolicy, weekday: number) {
  if (schedule.mode === "WEEKDAYS") return weekday >= 1 && weekday <= 5;
  if (schedule.mode === "WEEKLY") return schedule.weekdays.includes(weekday);
  return true;
}

function withinGoalWindow(candidate: Date, schedule: GoalSchedulePolicy) {
  return (
    !schedule.targetEndAt ||
    candidate.getTime() < new Date(schedule.targetEndAt).getTime()
  );
}

export function nextGoalOccurrence(options: {
  schedule: GoalSchedulePolicy;
  after: Date;
  preferredAt?: string | null;
}): string | null {
  const { schedule, after } = options;
  if (options.preferredAt) {
    const preferred = new Date(options.preferredAt);
    const local = zonedParts(preferred, schedule.timezone);
    const localTime = `${String(local.hour).padStart(2, "0")}:${String(
      local.minute,
    ).padStart(2, "0")}`;
    if (
      preferred.getTime() > after.getTime() + 2_000 &&
      withinGoalWindow(preferred, schedule) &&
      !isQuiet(localTime, schedule)
    ) {
      return preferred.toISOString();
    }
  }

  const localAfter = zonedParts(after, schedule.timezone);
  const baseDate = new Date(
    Date.UTC(localAfter.year, localAfter.month - 1, localAfter.day),
  );
  const slots = [...schedule.slots].sort((left, right) =>
    left.localTime.localeCompare(right.localTime),
  );
  for (let dayOffset = 0; dayOffset <= 14; dayOffset += 1) {
    const localDay = new Date(baseDate);
    localDay.setUTCDate(localDay.getUTCDate() + dayOffset);
    const weekday = localDay.getUTCDay();
    if (!allowedWeekday(schedule, weekday)) continue;
    for (const slot of slots) {
      if (isQuiet(slot.localTime, schedule)) continue;
      const [hour, minute] = slot.localTime.split(":").map(Number);
      const candidate = localDateTimeToUtc({
        year: localDay.getUTCFullYear(),
        month: localDay.getUTCMonth() + 1,
        day: localDay.getUTCDate(),
        hour,
        minute,
        timezone: schedule.timezone,
      });
      if (candidate.getTime() <= after.getTime() + 2_000) continue;
      if (!withinGoalWindow(candidate, schedule)) return null;
      return candidate.toISOString();
    }
  }
  return null;
}
