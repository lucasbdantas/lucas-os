"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/supabase/require-session";

const notificationActionSchema = z.object({
  notificationId: z.string().uuid(),
  returnTo: z.string().optional(),
});

function getReturnTo(value: string | undefined, fallback = "/notifications") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

async function updateNotificationStatus(
  formData: FormData,
  status: "read" | "dismissed",
) {
  const returnTo = getReturnTo(
    String(formData.get("returnTo") ?? "/notifications"),
  );
  const parsed = notificationActionSchema.safeParse({
    notificationId: formData.get("notificationId"),
    returnTo,
  });

  if (!parsed.success) {
    redirect(returnTo);
  }

  const { supabase, user } = await requireSession();
  const { error } = await supabase
    .from("notifications")
    .update({ status })
    .eq("id", parsed.data.notificationId)
    .eq("user_id", user.id)
    .eq("type", "task_reminder");

  if (error) {
    const separator = returnTo.includes("?") ? "&" : "?";
    redirect(`${returnTo}${separator}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/notifications");
  revalidatePath("/today");
  redirect(returnTo);
}

export async function markNotificationRead(formData: FormData) {
  await updateNotificationStatus(formData, "read");
}

export async function dismissNotification(formData: FormData) {
  await updateNotificationStatus(formData, "dismissed");
}
