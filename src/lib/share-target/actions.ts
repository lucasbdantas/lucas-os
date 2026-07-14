"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/supabase/require-session";

function revalidateShareViews() {
  revalidatePath("/capture");
  revalidatePath("/today");
  revalidatePath("/share");
}

export async function createPendingCaptureFromShare(formData: FormData) {
  const rawText = String(formData.get("rawText") ?? "").trim();

  if (!rawText) {
    redirect("/share?error=empty");
  }

  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("pending_captures").insert({
    raw_text: rawText,
    source: "web",
    status: "pending",
    user_id: user.id,
  });

  if (error) {
    redirect(`/share?error=${encodeURIComponent("save_failed")}`);
  }

  revalidateShareViews();
  redirect("/share/saved");
}

export async function saveSharedTextForUser(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  userId: string,
  rawText: string,
) {
  const { error } = await supabase.from("pending_captures").insert({
    raw_text: rawText,
    source: "web",
    status: "pending",
    user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateShareViews();
}
