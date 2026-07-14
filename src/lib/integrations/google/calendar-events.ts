import { googleCalendarReadonlyScope } from "./connected-account";

export type GoogleCalendarEventDate = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

export type GoogleCalendarApiEvent = {
  end?: GoogleCalendarEventDate;
  htmlLink?: string;
  id: string;
  location?: string;
  start?: GoogleCalendarEventDate;
  status?: string;
  summary?: string;
};

export type GoogleCalendarApiCalendar = {
  id: string;
  primary?: boolean;
  summary?: string;
};

export type NormalizedGoogleCalendarEvent = {
  accountEmail: string;
  accountId: string;
  calendarId: string;
  calendarSummary: string;
  end: string | null;
  htmlLink: string | null;
  id: string;
  isAllDay: boolean;
  location: string | null;
  sortKey: string;
  start: string;
  title: string;
};

export function hasGoogleCalendarReadonlyScope(scopes: unknown) {
  return (
    Array.isArray(scopes) &&
    scopes.some((scope) => scope === googleCalendarReadonlyScope)
  );
}

export function shouldRefreshGoogleToken(
  expiresAt: string | null | undefined,
  now = new Date(),
) {
  if (!expiresAt) {
    return false;
  }

  const expiresAtDate = new Date(expiresAt);

  if (Number.isNaN(expiresAtDate.getTime())) {
    return false;
  }

  return expiresAtDate.getTime() <= now.getTime() + 60_000;
}

export function getGoogleTokenExpiryIso(
  expiresIn: number | undefined,
  now = new Date(),
) {
  if (typeof expiresIn !== "number" || expiresIn <= 0) {
    return null;
  }

  return new Date(now.getTime() + expiresIn * 1000).toISOString();
}

export function normalizeGoogleCalendarEvent(input: {
  accountEmail: string;
  accountId: string;
  calendar: GoogleCalendarApiCalendar;
  event: GoogleCalendarApiEvent;
}): NormalizedGoogleCalendarEvent | null {
  if (input.event.status === "cancelled") {
    return null;
  }

  const startValue = input.event.start?.dateTime ?? input.event.start?.date;

  if (!startValue) {
    return null;
  }

  const endValue = input.event.end?.dateTime ?? input.event.end?.date ?? null;
  const isAllDay = Boolean(input.event.start?.date);

  return {
    accountEmail: input.accountEmail,
    accountId: input.accountId,
    calendarId: input.calendar.id,
    calendarSummary: input.calendar.summary || "Calendario sem nome",
    end: endValue,
    htmlLink: input.event.htmlLink || null,
    id: `${input.calendar.id}:${input.event.id}`,
    isAllDay,
    location: input.event.location?.trim() || null,
    sortKey: startValue,
    start: startValue,
    title: input.event.summary?.trim() || "Sem titulo",
  };
}

export function sortGoogleCalendarEvents(
  events: NormalizedGoogleCalendarEvent[],
) {
  return [...events].sort((first, second) =>
    first.sortKey.localeCompare(second.sortKey),
  );
}
