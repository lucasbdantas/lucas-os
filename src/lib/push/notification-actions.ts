"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  NOTIFICATION_PREFERENCES_KEY,
  parseNotificationPreferencesForm,
} from "@/lib/push/notification-preferences";
import { requireSession } from "@/lib/supabase/require-session";

export async function updateNotificationPreferences(formData: FormData) {
  const preferences = parseNotificationPreferencesForm(formData);
  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: NOTIFICATION_PREFERENCES_KEY,
      user_id: user.id,
      value: preferences,
    },
    { onConflict: "user_id,key" },
  );

  if (error) {
    redirect("/settings/notifications?error=preferences");
  }

  revalidatePath("/settings/notifications");
  redirect("/settings/notifications?saved=preferences");
}

export async function revokePushDevice(formData: FormData) {
  const deviceId = z.string().uuid().safeParse(formData.get("deviceId"));

  if (!deviceId.success) {
    redirect("/settings/notifications?error=device");
  }

  const { supabase, user } = await requireSession();
  const { error } = await supabase
    .from("push_subscriptions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", deviceId.data)
    .eq("user_id", user.id)
    .is("revoked_at", null);

  if (error) {
    redirect("/settings/notifications?error=device");
  }

  revalidatePath("/settings/notifications");
  redirect("/settings/notifications?saved=device");
}
