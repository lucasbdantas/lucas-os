"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAppPreferencesForUser } from "@/lib/app-settings/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function loginError(message: string): never {
  redirect(`/login?error=${encodeURIComponent(message)}`);
}

function getSafeAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email ou senha inválidos.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirme seu email no Supabase Auth antes de entrar.";
  }

  if (normalized.includes("email rate limit exceeded")) {
    return "Muitas tentativas de email. Aguarde um pouco e tente novamente.";
  }

  if (normalized.includes("signup disabled")) {
    return "Cadastro desativado no Supabase Auth.";
  }

  return `Supabase Auth: ${message}`;
}

export async function loginWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    loginError("Informe email e senha.");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    loginError("Supabase não está configurado.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    loginError(getSafeAuthErrorMessage(error.message));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const preferredHome = user
    ? (await getAppPreferencesForUser(supabase, user.id)).preferredHome
    : "/today";

  revalidatePath("/", "layout");
  redirect(preferredHome);
}

export async function logout() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
