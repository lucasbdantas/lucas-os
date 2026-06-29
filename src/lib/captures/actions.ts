"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/supabase/require-session";

const captureSourceValues = [
  "manual",
  "web",
  "ios_shortcut",
  "android_shortcut",
  "voice",
  "email",
  "webhook",
] as const;

const captureStatusValues = ["resolved", "dismissed", "expired"] as const;

const createPendingCaptureSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(1, "Digite algo antes de salvar a captura.")
    .max(12000, "A captura ficou longa demais para esta etapa."),
  source: z.enum(captureSourceValues).default("manual"),
  returnTo: z.string().optional(),
});

const updatePendingCaptureStatusSchema = z.object({
  captureId: z.string().uuid(),
  status: z.enum(captureStatusValues),
  returnTo: z.string().optional(),
});

function getReturnTo(value: string | undefined, fallback = "/capture") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function redirectWithError(returnTo: string, message: string): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}error=${encodeURIComponent(message)}`);
}

function revalidateCaptureViews() {
  revalidatePath("/capture");
  revalidatePath("/today");
}

export async function createPendingCapture(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/capture"));
  const parsed = createPendingCaptureSchema.safeParse({
    rawText: formData.get("rawText"),
    source: formData.get("source") ?? "manual",
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Captura invalida.",
    );
  }

  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("pending_captures").insert({
    user_id: user.id,
    raw_text: parsed.data.rawText,
    source: parsed.data.source,
    status: "pending",
  });

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidateCaptureViews();
  redirect(returnTo);
}

export async function updatePendingCaptureStatus(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/capture"));
  const parsed = updatePendingCaptureStatusSchema.safeParse({
    captureId: formData.get("captureId"),
    status: formData.get("status"),
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "Captura invalida.");
  }

  const now = new Date().toISOString();
  const timestampFields = {
    resolved_at: parsed.data.status === "resolved" ? now : null,
    dismissed_at: parsed.data.status === "dismissed" ? now : null,
    expired_at: parsed.data.status === "expired" ? now : null,
  };

  const { supabase, user } = await requireSession();
  const { error } = await supabase
    .from("pending_captures")
    .update({
      status: parsed.data.status,
      ...timestampFields,
    })
    .eq("id", parsed.data.captureId)
    .eq("user_id", user.id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidateCaptureViews();
  redirect(returnTo);
}
