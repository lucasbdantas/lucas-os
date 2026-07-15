import type { SupportedTimezone } from "@/lib/app-settings/preferences";

export function getPushTestSchedule(
  timezone: SupportedTimezone,
  now = new Date(),
  delayMinutes = 2,
) {
  const target = new Date(now.getTime() + delayMinutes * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(target);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));

  return {
    dueDate: `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`,
    dueTime: `${valueByType.get("hour")}:${valueByType.get("minute")}`,
  };
}
