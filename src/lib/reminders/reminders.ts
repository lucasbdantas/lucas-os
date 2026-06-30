import type { SupportedTimezone } from "@/lib/app-settings/preferences";

export const reminderOffsetValues = [0, 15, 60, 1440] as const;

export type ReminderOffset = (typeof reminderOffsetValues)[number];

export type ReminderPayload = {
  due_at: string;
  offset_minutes: ReminderOffset;
  reminder_at: string;
  task_id: string;
  timezone: SupportedTimezone;
};

export type ReminderNotificationInput = {
  dueDate: string | null;
  dueTime: string | null;
  offsets: number[];
  taskId: string;
  taskTitle: string;
  timezone: SupportedTimezone;
};

export type ReminderNotificationDraft = {
  body: string;
  payload: ReminderPayload;
  sourceRef: string;
  sourceUrl: string;
  title: string;
};

function isReminderOffset(value: number): value is ReminderOffset {
  return reminderOffsetValues.includes(value as ReminderOffset);
}

export function normalizeReminderOffsets(values: unknown[]): ReminderOffset[] {
  const offsets = values
    .map((value) => Number(value))
    .filter(
      (value): value is ReminderOffset =>
        Number.isInteger(value) && isReminderOffset(value),
    );

  return Array.from(new Set(offsets)).sort((first, second) => first - second);
}

function getTimeZoneOffsetMs(timezone: SupportedTimezone, date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(date);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(valueByType.get("year")),
    Number(valueByType.get("month")) - 1,
    Number(valueByType.get("day")),
    Number(valueByType.get("hour")),
    Number(valueByType.get("minute")),
    Number(valueByType.get("second")),
  );

  return asUtc - date.getTime();
}

export function getDueDateTimeIso(
  dueDate: string | null | undefined,
  dueTime: string | null | undefined,
  timezone: SupportedTimezone,
) {
  if (!dueDate || !dueTime) {
    return null;
  }

  const [year, month, day] = dueDate.split("-").map(Number);
  const [hour, minute] = dueTime.slice(0, 5).split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const firstOffset = getTimeZoneOffsetMs(timezone, new Date(utcGuess));
  const firstUtc = utcGuess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(timezone, new Date(firstUtc));
  const finalUtc = utcGuess - secondOffset;

  return new Date(finalUtc).toISOString();
}

export function getReminderDateTimeIso(
  dueDate: string | null | undefined,
  dueTime: string | null | undefined,
  offsetMinutes: ReminderOffset,
  timezone: SupportedTimezone,
) {
  const dueAt = getDueDateTimeIso(dueDate, dueTime, timezone);

  if (!dueAt) {
    return null;
  }

  return new Date(
    new Date(dueAt).getTime() - offsetMinutes * 60 * 1000,
  ).toISOString();
}

function getReminderTitle(offset: ReminderOffset) {
  if (offset === 0) return "Lembrete: agora";
  if (offset === 15) return "Lembrete: 15 minutos antes";
  if (offset === 60) return "Lembrete: 1 hora antes";

  return "Lembrete: 1 dia antes";
}

export function buildReminderNotifications({
  dueDate,
  dueTime,
  offsets,
  taskId,
  taskTitle,
  timezone,
}: ReminderNotificationInput): ReminderNotificationDraft[] {
  const dueAt = getDueDateTimeIso(dueDate, dueTime, timezone);

  if (!dueAt) {
    return [];
  }

  return normalizeReminderOffsets(offsets).map((offset) => ({
    body: `Task: ${taskTitle}`,
    payload: {
      due_at: dueAt,
      offset_minutes: offset,
      reminder_at: getReminderDateTimeIso(dueDate, dueTime, offset, timezone)!,
      task_id: taskId,
      timezone,
    },
    sourceRef: taskId,
    sourceUrl: `/tasks?edit=${taskId}#edit-task`,
    title: getReminderTitle(offset),
  }));
}

export function parseReminderPayload(value: unknown): ReminderPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const payload = value as Record<string, unknown>;

  if (
    typeof payload.task_id !== "string" ||
    typeof payload.due_at !== "string" ||
    typeof payload.reminder_at !== "string" ||
    typeof payload.timezone !== "string" ||
    typeof payload.offset_minutes !== "number" ||
    !isReminderOffset(payload.offset_minutes)
  ) {
    return null;
  }

  return payload as ReminderPayload;
}

export function isReminderOverdue(
  reminderAt: string,
  now = new Date().toISOString(),
) {
  return reminderAt < now;
}
