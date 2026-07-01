import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveSharedTextForUser } from "@/lib/share-target/actions";
import {
  encodeSharedTextForCookie,
  normalizeShareTargetInput,
} from "@/lib/share-target/share-target";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const pendingShareCookieName = "lucas_os_pending_share";

function redirectToShareError(reason: string): never {
  redirect(`/share?error=${encodeURIComponent(reason)}`);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const normalized = normalizeShareTargetInput({
    text: formData.get("text"),
    title: formData.get("title"),
    url: formData.get("url"),
  });

  if (!normalized.ok) {
    redirectToShareError(normalized.reason);
  }

  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await saveSharedTextForUser(supabase, user.id, normalized.rawText);
      redirect("/share/saved");
    }
  }

  const cookieStore = await cookies();

  cookieStore.set(pendingShareCookieName, encodeSharedTextForCookie(normalized.rawText), {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/login?returnTo=/share/consume");
}
