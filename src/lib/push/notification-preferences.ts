import {
  defaultAppPreferences,
  supportedTimezones,
  type SupportedTimezone,
} from "../app-settings/preferences";

export const NOTIFICATION_PREFERENCES_KEY = "notification_preferences_v1";

export const defaultReminderOffsets = ["none", "0", "15", "60", "1440"] as const;

export type NotificationPreferences = {
  defaultReminderOffset: (typeof defaultReminderOffsets)[number];
  pushEnabled: boolean;
  pushOnWeekends: boolean;
  quietHoursEnabled: boolean;
  quietHoursEnd: string;
  quietHoursStart: string;
  timezone: SupportedTimezone;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  defaultReminderOffset: "none",
  pushEnabled: true,
  pushOnWeekends: true,
  quietHoursEnabled: false,
  quietHoursEnd: "07:00",
  quietHoursStart: "22:00",
  timezone: defaultAppPreferences.timezone,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function parseNotificationPreferences(value: unknown): NotificationPreferences {
  if (!isRecord(value)) return defaultNotificationPreferences;

  const timezone = supportedTimezones.includes(value.timezone as SupportedTimezone)
    ? (value.timezone as SupportedTimezone)
    : defaultNotificationPreferences.timezone;
  const defaultReminderOffset = defaultReminderOffsets.includes(
    value.defaultReminderOffset as NotificationPreferences["defaultReminderOffset"],
  )
    ? (value.defaultReminderOffset as NotificationPreferences["defaultReminderOffset"])
    : defaultNotificationPreferences.defaultReminderOffset;

  return {
    defaultReminderOffset,
    pushEnabled:
      typeof value.pushEnabled === "boolean"
        ? value.pushEnabled
        : defaultNotificationPreferences.pushEnabled,
    pushOnWeekends:
      typeof value.pushOnWeekends === "boolean"
        ? value.pushOnWeekends
        : defaultNotificationPreferences.pushOnWeekends,
    quietHoursEnabled:
      typeof value.quietHoursEnabled === "boolean"
        ? value.quietHoursEnabled
        : defaultNotificationPreferences.quietHoursEnabled,
    quietHoursEnd: isTime(value.quietHoursEnd)
      ? value.quietHoursEnd
      : defaultNotificationPreferences.quietHoursEnd,
    quietHoursStart: isTime(value.quietHoursStart)
      ? value.quietHoursStart
      : defaultNotificationPreferences.quietHoursStart,
    timezone,
  };
}

export function parseNotificationPreferencesForm(formData: FormData) {
  return parseNotificationPreferences({
    defaultReminderOffset: formData.get("defaultReminderOffset"),
    pushEnabled: formData.get("pushEnabled") === "on",
    pushOnWeekends: formData.get("pushOnWeekends") === "on",
    quietHoursEnabled: formData.get("quietHoursEnabled") === "on",
    quietHoursEnd: formData.get("quietHoursEnd"),
    quietHoursStart: formData.get("quietHoursStart"),
    timezone: formData.get("timezone"),
  });
}

export function isInsideQuietHours(
  time: string,
  start: string,
  end: string,
) {
  const currentMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export type NotificationDeliveryBlockReason =
  | "push_disabled"
  | "quiet_hours"
  | "weekend_disabled";

export function getNotificationDeliveryBlockReason(
  preferences: NotificationPreferences,
  now = new Date(),
): NotificationDeliveryBlockReason | null {
  if (!preferences.pushEnabled) return "push_disabled";

  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone: preferences.timezone,
    weekday: "short",
  }).formatToParts(now);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const weekday = values.get("weekday");

  if (!preferences.pushOnWeekends && (weekday === "Sat" || weekday === "Sun")) {
    return "weekend_disabled";
  }

  const time = `${values.get("hour")}:${values.get("minute")}`;
  if (
    preferences.quietHoursEnabled &&
    isInsideQuietHours(
      time,
      preferences.quietHoursStart,
      preferences.quietHoursEnd,
    )
  ) {
    return "quiet_hours";
  }

  return null;
}
