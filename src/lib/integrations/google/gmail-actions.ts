"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AICapturePreviewState } from "@/lib/captures/ai-preview";
import { buildAIPreviewForEmail } from "@/lib/captures/ai-preview-server";
import { buildGmailPendingCaptureText } from "@/lib/integrations/google/gmail-messages";
import { getGmailActionInboxForUser } from "@/lib/integrations/google/gmail";
import { normalizeGmailInboxFilters } from "@/lib/integrations/google/gmail-filters";
import { requireSession } from "@/lib/supabase/require-session";

const gmailCaptureSchema = z.object({
  accountEmail: z.string().trim().email().max(320),
  date: z
    .string()
    .trim()
    .max(80)
    .transform((value) => (value === "" ? null : value)),
  from: z.string().trim().min(1).max(500),
  gmailUrl: z.string().trim().url().max(2000),
  returnTo: z.string().optional(),
  snippet: z
    .string()
    .trim()
    .max(1000)
    .transform((value) => (value === "" ? null : value)),
  subject: z.string().trim().min(1).max(500),
});

function getReturnTo(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/inbox";
  }

  return value;
}

function redirectWithParam(returnTo: string, key: "error" | "notice", message: string): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}${key}=${encodeURIComponent(message)}`);
}

export async function sendGmailMessageToCapture(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/inbox"));
  const parsed = gmailCaptureSchema.safeParse({
    accountEmail: formData.get("accountEmail"),
    date: formData.get("date") ?? "",
    from: formData.get("from"),
    gmailUrl: formData.get("gmailUrl"),
    returnTo,
    snippet: formData.get("snippet") ?? "",
    subject: formData.get("subject"),
  });

  if (!parsed.success) {
    redirectWithParam(returnTo, "error", "Email invalido para captura.");
  }

  const { supabase, user } = await requireSession();
  const rawText = buildGmailPendingCaptureText(parsed.data);
  const { error } = await supabase.from("pending_captures").insert({
    raw_text: rawText,
    source: "email",
    status: "pending",
    user_id: user.id,
  });

  if (error) {
    redirectWithParam(returnTo, "error", error.message);
  }

  revalidatePath("/capture");
  revalidatePath("/inbox");
  revalidatePath("/today");

  redirectWithParam(returnTo, "notice", "Email enviado para Capture.");
}

export async function previewGmailMessageWithAI(
  _previousState: AICapturePreviewState,
  formData: FormData,
): Promise<AICapturePreviewState> {
  const accountId = String(formData.get("accountId") ?? "");
  const messageId = String(formData.get("messageId") ?? "");

  if (!accountId || !messageId) {
    return { status: "error", message: "Email invalido para sugestao." };
  }

  const { supabase, user } = await requireSession();
  const inbox = await getGmailActionInboxForUser({
    filters: normalizeGmailInboxFilters({}),
    maxResultsPerAccount: 30,
    supabase,
    userId: user.id,
  });
  const message = inbox.messages.find(
    (item) => item.accountId === accountId && item.id === messageId,
  );

  if (!message) {
    return {
      status: "error",
      message: "Email nao encontrado ou indisponivel para sugestao.",
    };
  }

  return buildAIPreviewForEmail(supabase, message);
}
