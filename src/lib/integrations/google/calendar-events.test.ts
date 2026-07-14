import { describe, expect, test } from "vitest";
import { googleCalendarReadonlyScope } from "./connected-account";
import {
  getGoogleTokenExpiryIso,
  hasGoogleCalendarReadonlyScope,
  normalizeGoogleCalendarEvent,
  shouldRefreshGoogleToken,
  sortGoogleCalendarEvents,
} from "./calendar-events";

describe("google calendar event helpers", () => {
  test("detects calendar readonly scope", () => {
    expect(hasGoogleCalendarReadonlyScope(["openid", googleCalendarReadonlyScope])).toBe(
      true,
    );
    expect(hasGoogleCalendarReadonlyScope(["openid", "email"])).toBe(false);
  });

  test("normalizes timed events", () => {
    const event = normalizeGoogleCalendarEvent({
      accountEmail: "lucas@example.com",
      accountId: "account-1",
      calendar: { id: "primary", summary: "Lucas" },
      event: {
        id: "event-1",
        location: "FEEC",
        start: { dateTime: "2026-07-01T15:00:00-03:00" },
        summary: "Reuniao",
      },
    });

    expect(event).toMatchObject({
      accountEmail: "lucas@example.com",
      calendarSummary: "Lucas",
      isAllDay: false,
      location: "FEEC",
      start: "2026-07-01T15:00:00-03:00",
      title: "Reuniao",
    });
  });

  test("normalizes all-day events", () => {
    const event = normalizeGoogleCalendarEvent({
      accountEmail: "lucas@example.com",
      accountId: "account-1",
      calendar: { id: "primary" },
      event: {
        id: "event-1",
        start: { date: "2026-07-01" },
      },
    });

    expect(event).toMatchObject({
      calendarSummary: "Calendario sem nome",
      isAllDay: true,
      start: "2026-07-01",
      title: "Sem titulo",
    });
  });

  test("skips cancelled events", () => {
    expect(
      normalizeGoogleCalendarEvent({
        accountEmail: "lucas@example.com",
        accountId: "account-1",
        calendar: { id: "primary" },
        event: {
          id: "event-1",
          start: { date: "2026-07-01" },
          status: "cancelled",
        },
      }),
    ).toBeNull();
  });

  test("detects tokens that should be refreshed", () => {
    const now = new Date("2026-07-01T12:00:00.000Z");

    expect(shouldRefreshGoogleToken("2026-07-01T12:00:30.000Z", now)).toBe(
      true,
    );
    expect(shouldRefreshGoogleToken("2026-07-01T12:10:00.000Z", now)).toBe(
      false,
    );
  });

  test("computes refreshed token expiry", () => {
    expect(
      getGoogleTokenExpiryIso(3600, new Date("2026-07-01T12:00:00.000Z")),
    ).toBe("2026-07-01T13:00:00.000Z");
  });

  test("sorts events by start", () => {
    const sorted = sortGoogleCalendarEvents([
      {
        accountEmail: "lucas@example.com",
        accountId: "account-1",
        calendarId: "primary",
        calendarSummary: "Lucas",
        end: null,
        htmlLink: null,
        id: "2",
        isAllDay: false,
        location: null,
        sortKey: "2026-07-02T10:00:00-03:00",
        start: "2026-07-02T10:00:00-03:00",
        title: "Segundo",
      },
      {
        accountEmail: "lucas@example.com",
        accountId: "account-1",
        calendarId: "primary",
        calendarSummary: "Lucas",
        end: null,
        htmlLink: null,
        id: "1",
        isAllDay: false,
        location: null,
        sortKey: "2026-07-01T10:00:00-03:00",
        start: "2026-07-01T10:00:00-03:00",
        title: "Primeiro",
      },
    ]);

    expect(sorted.map((event) => event.title)).toEqual(["Primeiro", "Segundo"]);
  });
});
