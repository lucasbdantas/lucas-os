export const APP_PREFERENCES_KEY = "app_preferences";

export const supportedTimezones = [
  "America/Sao_Paulo",
  "UTC",
  "America/New_York",
  "Europe/London",
] as const;

export const todayDensityValues = ["compact", "comfortable"] as const;
export const preferredHomeValues = ["/today", "/quick-capture"] as const;

export type SupportedTimezone = (typeof supportedTimezones)[number];
export type TodayDensity = (typeof todayDensityValues)[number];
export type PreferredHome = (typeof preferredHomeValues)[number];

export type AppPreferences = {
  preferredHome: PreferredHome;
  showProjectsWithoutNextAction: boolean;
  timezone: SupportedTimezone;
  todayDensity: TodayDensity;
};

export const defaultAppPreferences: AppPreferences = {
  preferredHome: "/today",
  showProjectsWithoutNextAction: true,
  timezone: "America/Sao_Paulo",
  todayDensity: "comfortable",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSupportedTimezone(value: unknown): value is SupportedTimezone {
  return (
    typeof value === "string" &&
    supportedTimezones.includes(value as SupportedTimezone)
  );
}

function isTodayDensity(value: unknown): value is TodayDensity {
  return (
    typeof value === "string" && todayDensityValues.includes(value as TodayDensity)
  );
}

function isPreferredHome(value: unknown): value is PreferredHome {
  return (
    typeof value === "string" && preferredHomeValues.includes(value as PreferredHome)
  );
}

export function parseAppPreferences(value: unknown): AppPreferences {
  if (!isRecord(value)) {
    return defaultAppPreferences;
  }

  return {
    preferredHome: isPreferredHome(value.preferredHome)
      ? value.preferredHome
      : defaultAppPreferences.preferredHome,
    showProjectsWithoutNextAction:
      typeof value.showProjectsWithoutNextAction === "boolean"
        ? value.showProjectsWithoutNextAction
        : defaultAppPreferences.showProjectsWithoutNextAction,
    timezone: isSupportedTimezone(value.timezone)
      ? value.timezone
      : defaultAppPreferences.timezone,
    todayDensity: isTodayDensity(value.todayDensity)
      ? value.todayDensity
      : defaultAppPreferences.todayDensity,
  };
}

export function parseAppPreferencesForm(input: {
  preferredHome: FormDataEntryValue | null;
  showProjectsWithoutNextAction: FormDataEntryValue | null;
  timezone: FormDataEntryValue | null;
  todayDensity: FormDataEntryValue | null;
}): AppPreferences {
  const preferences = parseAppPreferences({
    preferredHome: input.preferredHome,
    showProjectsWithoutNextAction:
      input.showProjectsWithoutNextAction === "on",
    timezone: input.timezone,
    todayDensity: input.todayDensity,
  });

  return preferences;
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

export function toDateOnlyInTimezone(
  timezone: SupportedTimezone,
  date = new Date(),
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  }).formatToParts(date);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));

  return `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`;
}
