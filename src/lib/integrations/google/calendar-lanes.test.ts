import { describe, expect, test } from "vitest";
import {
  getCalendarLane,
  getCalendarPreferenceKey,
  normalizeCalendarLaneForm,
  parseCalendarLanePreferences,
  splitCalendarEventsByLane,
} from "./calendar-lanes";

describe("calendar lanes", () => {
  test("uses primary as default for ordinary calendars", () => {
    expect(
      getCalendarLane({}, {
        accountId: "account-1",
        calendarId: "primary",
        calendarSummary: "Lucas",
      }),
    ).toBe("primary");
  });

  test("suggests context for safe public-interest hints", () => {
    expect(
      getCalendarLane({}, {
        accountId: "account-1",
        calendarId: "f1",
        calendarSummary: "Formula 1",
      }),
    ).toBe("context");
  });

  test("preference overrides heuristic", () => {
    const source = {
      accountId: "account-1",
      calendarId: "feriados",
      calendarSummary: "Feriados no Brasil",
    };

    expect(
      getCalendarLane(
        {
          [getCalendarPreferenceKey(source)]: "hidden",
        },
        source,
      ),
    ).toBe("hidden");
  });

  test("parses only valid preference values", () => {
    expect(
      parseCalendarLanePreferences({
        a: "primary",
        b: "context",
        c: "hidden",
        d: "delete",
      }),
    ).toEqual({
      a: "primary",
      b: "context",
      c: "hidden",
    });
  });

  test("normalizes form values", () => {
    const formData = new FormData();
    formData.append("calendarKey", "account-1::primary");
    formData.append("lane:account-1::primary", "context");
    formData.append("calendarKey", "account-1::bad");
    formData.append("lane:account-1::bad", "invalid");

    expect(normalizeCalendarLaneForm(formData)).toEqual({
      "account-1::primary": "context",
    });
  });

  test("splits events by lane and keeps hidden out of visible lanes", () => {
    const events = [
      {
        accountId: "account-1",
        calendarId: "primary",
        calendarSummary: "Lucas",
        title: "Aula",
      },
      {
        accountId: "account-1",
        calendarId: "f1",
        calendarSummary: "Formula 1",
        title: "Treino livre",
      },
      {
        accountId: "account-1",
        calendarId: "holidays",
        calendarSummary: "Holidays",
        title: "Feriado",
      },
    ];

    const lanes = splitCalendarEventsByLane(events, {
      "account-1::holidays": "hidden",
    });

    expect(lanes.primary.map((event) => event.title)).toEqual(["Aula"]);
    expect(lanes.context.map((event) => event.title)).toEqual(["Treino livre"]);
    expect(lanes.hidden.map((event) => event.title)).toEqual(["Feriado"]);
  });
});
