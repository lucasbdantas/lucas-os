"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  generateCaptureToken,
  getCaptureTokenPrefix,
  hashCaptureToken,
} from "@/lib/capture-tokens/tokens";
import { requireSession } from "@/lib/supabase/require-session";

export type CaptureTokenActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  token?: string;
};

const createCaptureTokenSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome para o token.").max(120),
});

const revokeCaptureTokenSchema = z.object({
  tokenId: z.string().uuid(),
});

export async function createCaptureToken(
  _previousState: CaptureTokenActionState,
  formData: FormData,
): Promise<CaptureTokenActionState> {
  const parsed = createCaptureTokenSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Token invalido.",
    };
  }

  const { supabase, user } = await requireSession();
  const token = generateCaptureToken();
  const tokenHash = hashCaptureToken(token);
  const tokenPrefix = getCaptureTokenPrefix(token);

  const { error } = await supabase.from("capture_tokens").insert({
    user_id: user.id,
    name: parsed.data.name,
    token_hash: tokenHash,
    token_prefix: tokenPrefix,
  });

  if (error) {
    return {
      status: "error",
      message: "Nao foi possivel criar o token de captura.",
    };
  }

  revalidatePath("/settings");

  return {
    status: "success",
    message: "Token criado. Copie agora; ele nao sera exibido novamente.",
    token,
  };
}

export async function revokeCaptureToken(formData: FormData) {
  const parsed = revokeCaptureTokenSchema.safeParse({
    tokenId: formData.get("tokenId"),
  });

  if (!parsed.success) {
    return;
  }

  const { supabase, user } = await requireSession();

  await supabase
    .from("capture_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.tokenId)
    .eq("user_id", user.id)
    .is("revoked_at", null);

  revalidatePath("/settings");
}
