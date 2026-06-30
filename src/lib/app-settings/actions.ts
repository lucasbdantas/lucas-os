"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  APP_PREFERENCES_KEY,
  parseAppPreferencesForm,
} from "@/lib/app-settings/preferences";
import { requireSession } from "@/lib/supabase/require-session";

export async function updateAppPreferences(formData: FormData) {
  const preferences = parseAppPreferencesForm({
    preferredHome: formData.get("preferredHome"),
    showProjectsWithoutNextAction: formData.get(
      "showProjectsWithoutNextAction",
    ),
    timezone: formData.get("timezone"),
    todayDensity: formData.get("todayDensity"),
  });

  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: APP_PREFERENCES_KEY,
      user_id: user.id,
      value: preferences,
    },
    { onConflict: "user_id,key" },
  );

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/today");
  revalidatePath("/review");

  redirect("/settings?settings=saved");
}
