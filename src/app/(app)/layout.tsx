import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getAppPreferencesForUser } from "@/lib/app-settings/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OperationalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

  const [notificationCountResult, preferences] = await Promise.all([
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", "task_reminder")
      .eq("status", "unread"),
    getAppPreferencesForUser(supabase, user.id),
  ]);

  return (
    <AppShell
      appearance={preferences.appearance}
      notificationCount={notificationCountResult.count ?? 0}
      userEmail={user.email}
    >
      {children}
    </AppShell>
  );
}
