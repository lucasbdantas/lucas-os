import {
  APP_PREFERENCES_KEY,
  defaultAppPreferences,
  parseAppPreferences,
  type AppPreferences,
} from "@/lib/app-settings/preferences";
import { requireSession } from "@/lib/supabase/require-session";

type AppSettingRow = {
  value: unknown;
};

export async function getAppPreferencesForUser(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  userId: string,
): Promise<AppPreferences> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("user_id", userId)
    .eq("key", APP_PREFERENCES_KEY)
    .maybeSingle<AppSettingRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? parseAppPreferences(data.value) : defaultAppPreferences;
}
