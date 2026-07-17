import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultNotificationPreferences,
  NOTIFICATION_PREFERENCES_KEY,
  parseNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/push/notification-preferences";

export async function getNotificationPreferencesForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("user_id", userId)
    .eq("key", NOTIFICATION_PREFERENCES_KEY)
    .maybeSingle<{ value: unknown }>();

  if (error) throw new Error(error.message);
  return data
    ? parseNotificationPreferences(data.value)
    : defaultNotificationPreferences;
}
