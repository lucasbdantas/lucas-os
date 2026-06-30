export const recurrenceTypes = ["none", "daily", "weekly", "monthly"] as const;

export type RecurrenceType = (typeof recurrenceTypes)[number];

export type NextOccurrenceInput = {
  dueDate: string | null | undefined;
  recurrenceEndDate?: string | null;
  recurrenceInterval: number;
  recurrenceType: RecurrenceType;
};

export type NextOccurrenceResult =
  | { shouldCreate: true; nextDueDate: string }
  | { reason: "none" | "missing_due_date" | "past_end_date"; shouldCreate: false };

const daysByRecurrenceType = {
  daily: 1,
  weekly: 7,
} as const;

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaysInUtcMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function addMonths(date: Date, months: number) {
  const targetMonthIndex = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12;
  const targetDay = Math.min(
    date.getUTCDate(),
    getDaysInUtcMonth(targetYear, normalizedMonthIndex),
  );

  return new Date(Date.UTC(targetYear, normalizedMonthIndex, targetDay));
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

export function getNextOccurrenceDate({
  dueDate,
  recurrenceEndDate,
  recurrenceInterval,
  recurrenceType,
}: NextOccurrenceInput): NextOccurrenceResult {
  if (recurrenceType === "none") {
    return { reason: "none", shouldCreate: false };
  }

  if (!dueDate) {
    return { reason: "missing_due_date", shouldCreate: false };
  }

  const safeInterval = Math.max(1, Math.trunc(recurrenceInterval));
  const currentDueDate = parseDateOnly(dueDate);
  const nextDate =
    recurrenceType === "monthly"
      ? addMonths(currentDueDate, safeInterval)
      : addDays(currentDueDate, daysByRecurrenceType[recurrenceType] * safeInterval);
  const nextDueDate = formatDateOnly(nextDate);

  if (recurrenceEndDate && nextDueDate > recurrenceEndDate) {
    return { reason: "past_end_date", shouldCreate: false };
  }

  return { nextDueDate, shouldCreate: true };
}

export function hasOpenDuplicateOccurrence(
  openOccurrenceDueDates: Array<string | null | undefined>,
  nextDueDate: string,
) {
  return openOccurrenceDueDates.includes(nextDueDate);
}

export function getRecurrenceLabel(recurrenceType: RecurrenceType) {
  if (recurrenceType === "daily") return "Recorrente: diária";
  if (recurrenceType === "weekly") return "Recorrente: semanal";
  if (recurrenceType === "monthly") return "Recorrente: mensal";

  return null;
}
