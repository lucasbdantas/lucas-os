import { redirect } from "next/navigation";
import { getAppPreferencesForUser } from "@/lib/app-settings/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const preferences = await getAppPreferencesForUser(supabase, user.id);

  redirect(preferences.preferredHome);
}
