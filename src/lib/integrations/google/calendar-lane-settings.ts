import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CALENDAR_LANE_PREFERENCES_KEY,
  parseCalendarLanePreferences,
  type CalendarLanePreferences,
} from "@/lib/integrations/google/calendar-lanes";

type CalendarLaneSettingRow = {
  value: unknown;
};

export async function getCalendarLanePreferencesForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<CalendarLanePreferences> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("user_id", userId)
    .eq("key", CALENDAR_LANE_PREFERENCES_KEY)
    .maybeSingle<CalendarLaneSettingRow>();

  if (error) {
    throw new Error(error.message);
  }

  return parseCalendarLanePreferences(data?.value);
}
