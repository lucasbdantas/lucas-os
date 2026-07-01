export const CALENDAR_LANE_PREFERENCES_KEY = "google_calendar_lanes";

export const calendarLaneValues = ["primary", "context", "hidden"] as const;

export type CalendarLane = (typeof calendarLaneValues)[number];

export type CalendarLanePreferences = Record<string, CalendarLane>;

export type CalendarLaneSource = {
  accountEmail: string;
  accountId: string;
  calendarId: string;
  calendarSummary: string;
};

export type CalendarLaneEvent = {
  accountId: string;
  calendarId: string;
  calendarSummary: string;
};

export function getCalendarPreferenceKey(
  source: Pick<CalendarLaneSource, "accountId" | "calendarId">,
) {
  return `${source.accountId}::${source.calendarId}`;
}

export function isCalendarLane(value: unknown): value is CalendarLane {
  return (
    typeof value === "string" &&
    calendarLaneValues.includes(value as CalendarLane)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseCalendarLanePreferences(
  value: unknown,
): CalendarLanePreferences {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, CalendarLane] =>
      isCalendarLane(entry[1]),
    ),
  );
}

export function getDefaultCalendarLane(
  source: Pick<CalendarLaneSource, "calendarSummary">,
): CalendarLane {
  const normalizedSummary = source.calendarSummary
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const contextHints = [
    "aniversario",
    "birthday",
    "brasileirao",
    "f1",
    "feriado",
    "formula 1",
    "holiday",
    "holidays",
  ];

  return contextHints.some((hint) => normalizedSummary.includes(hint))
    ? "context"
    : "primary";
}

export function getCalendarLane(
  preferences: CalendarLanePreferences,
  source: CalendarLaneSource | CalendarLaneEvent,
): CalendarLane {
  return (
    preferences[getCalendarPreferenceKey(source)] ??
    getDefaultCalendarLane(source)
  );
}

export function normalizeCalendarLaneForm(input: FormData) {
  const nextPreferences: CalendarLanePreferences = {};

  for (const value of input.getAll("calendarKey")) {
    const calendarKey = String(value);
    const lane = input.get(`lane:${calendarKey}`);

    if (isCalendarLane(lane)) {
      nextPreferences[calendarKey] = lane;
    }
  }

  return nextPreferences;
}

export function splitCalendarEventsByLane<T extends CalendarLaneEvent>(
  events: T[],
  preferences: CalendarLanePreferences,
) {
  return events.reduce(
    (lanes, event) => {
      const lane = getCalendarLane(preferences, event);

      if (lane === "primary") {
        lanes.primary.push(event);
      }

      if (lane === "context") {
        lanes.context.push(event);
      }

      if (lane === "hidden") {
        lanes.hidden.push(event);
      }

      return lanes;
    },
    {
      context: [] as T[],
      hidden: [] as T[],
      primary: [] as T[],
    },
  );
}
