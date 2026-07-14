"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { APP_THEME_COOKIE } from "@/lib/app-settings/preferences";
import { getAppPreferencesForUser } from "@/lib/app-settings/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeReturnTo(value: FormDataEntryValue | string | null) {
  const returnTo = String(value ?? "").trim();

  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return null;
  }

  return returnTo;
}

function loginError(message: string, returnTo: string | null): never {
  const params = new URLSearchParams({ error: message });

  if (returnTo) {
    params.set("returnTo", returnTo);
  }

  redirect(`/login?${params.toString()}`);
}

function getSafeAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email ou senha invalidos.";
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
  const returnTo = getSafeReturnTo(formData.get("returnTo"));

  if (!email || !password) {
    loginError("Informe email e senha.", returnTo);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    loginError("Supabase nao esta configurado.", returnTo);
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    loginError(getSafeAuthErrorMessage(error.message), returnTo);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const preferences = user
    ? await getAppPreferencesForUser(supabase, user.id)
    : null;

  if (preferences) {
    const cookieStore = await cookies();
    cookieStore.set(APP_THEME_COOKIE, preferences.appearance, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  revalidatePath("/", "layout");
  redirect(returnTo ?? preferences?.preferredHome ?? "/today");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
