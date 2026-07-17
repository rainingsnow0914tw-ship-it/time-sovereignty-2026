import type { z } from "zod";

import type { QuietHoursSchema } from "../domain/goals/schemas";

type QuietHours = z.infer<typeof QuietHoursSchema>;

type LocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parseClock(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function localParts(instant: Date, timeZone: string): LocalParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
}

function addLocalDays(parts: LocalParts, days: number): LocalParts {
  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days, parts.hour, parts.minute),
  );
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: parts.hour,
    minute: parts.minute,
  };
}

function localTimeToInstant(parts: LocalParts, timeZone: string): Date {
  const desired = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    0,
    0,
  );
  let candidate = desired;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const observed = localParts(new Date(candidate), timeZone);
    const observedAsUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      0,
      0,
    );
    const correction = desired - observedAsUtc;
    candidate += correction;
    if (correction === 0) break;
  }
  return new Date(candidate);
}

export function moveOutsideQuietHours(
  proposed: Date,
  quietHours: QuietHours,
): Date {
  const start = parseClock(quietHours.start);
  const end = parseClock(quietHours.end);
  if (start === end) return proposed;

  const local = localParts(proposed, quietHours.timezone);
  const minuteOfDay = local.hour * 60 + local.minute;
  const crossesMidnight = start > end;
  const inside = crossesMidnight
    ? minuteOfDay >= start || minuteOfDay < end
    : minuteOfDay >= start && minuteOfDay < end;
  if (!inside) return proposed;

  const [endHour, endMinute] = quietHours.end.split(":").map(Number);
  const endDayOffset = crossesMidnight && minuteOfDay >= start ? 1 : 0;
  const endLocal = addLocalDays(
    { ...local, hour: endHour, minute: endMinute },
    endDayOffset,
  );
  return localTimeToInstant(endLocal, quietHours.timezone);
}

export function selectLiveFollowUpTime(options: {
  proposedAt: string;
  now: Date;
  quietHours?: QuietHours;
}): string {
  const proposed = new Date(options.proposedAt).getTime();
  const now = options.now.getTime();
  const candidate = new Date(
    Number.isFinite(proposed) &&
    proposed >= now + 60_000 &&
    proposed <= now + 24 * 60 * 60 * 1_000
      ? proposed
      : now + 60 * 60 * 1_000,
  );
  const protectedTime = options.quietHours
    ? moveOutsideQuietHours(candidate, options.quietHours)
    : candidate;
  return protectedTime.toISOString();
}
