"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/supabase/require-session";

export type QuickCaptureState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const quickCaptureSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(1, "Digite algo antes de salvar.")
    .max(12000, "A captura ficou longa demais para esta etapa."),
});

export async function createQuickCapture(
  _previousState: QuickCaptureState,
  formData: FormData,
): Promise<QuickCaptureState> {
  const parsed = quickCaptureSchema.safeParse({
    rawText: formData.get("rawText"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Captura invalida.",
    };
  }

  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("pending_captures").insert({
    user_id: user.id,
    raw_text: parsed.data.rawText,
    source: "web",
    status: "pending",
  });

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel salvar a captura.",
    };
  }

  revalidatePath("/capture");
  revalidatePath("/today");
  revalidatePath("/quick-capture");

  return {
    status: "success",
    message: "Captura salva. Voce pode organizar depois em Captura.",
  };
}
