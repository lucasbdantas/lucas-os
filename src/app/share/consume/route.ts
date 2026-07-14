import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveSharedTextForUser } from "@/lib/share-target/actions";
import { decodeSharedTextFromCookie } from "@/lib/share-target/share-target";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const pendingShareCookieName = "lucas_os_pending_share";

export async function GET() {
  const cookieStore = await cookies();
  const rawText = decodeSharedTextFromCookie(
    cookieStore.get(pendingShareCookieName)?.value,
  );

  if (!rawText) {
    redirect("/share?error=empty");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/login?returnTo=/share/consume");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnTo=/share/consume");
  }

  await saveSharedTextForUser(supabase, user.id, rawText);
  cookieStore.delete(pendingShareCookieName);
  redirect("/share/saved");
}
