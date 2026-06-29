"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/supabase/require-session";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value === "" ? null : value));

const domainColorValue = z
  .string()
  .trim()
  .max(32)
  .transform((value) => (value === "" ? null : value));

const domainIconValue = z
  .string()
  .trim()
  .max(64)
  .transform((value) => (value === "" ? null : value));

const createDomainSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do domínio.").max(120),
  description: optionalText(4000),
  color: domainColorValue,
  icon: domainIconValue,
  returnTo: z.string().optional(),
});

const updateDomainSchema = z.object({
  domainId: z.string().uuid(),
  description: optionalText(4000),
  color: domainColorValue,
  icon: domainIconValue,
  returnTo: z.string().optional(),
});

const toggleDomainSchema = z.object({
  domainId: z.string().uuid(),
  active: z.enum(["true", "false"]),
  returnTo: z.string().optional(),
});

type DomainIdentity = {
  name: string;
  is_system: boolean;
};

function getReturnTo(value: string | undefined, fallback = "/domains") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function redirectWithError(returnTo: string, message: string): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}error=${encodeURIComponent(message)}`);
}

function getFriendlySupabaseError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("duplicate") ||
    normalized.includes("domains_user_name_unique")
  ) {
    return "Já existe um domínio com esse nome.";
  }

  return message;
}

function revalidateDomainViews() {
  revalidatePath("/domains");
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/today");
}

async function getDomainIdentity(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  domainId: string,
) {
  const { data, error } = await supabase
    .from("domains")
    .select("name,is_system")
    .eq("id", domainId)
    .maybeSingle<DomainIdentity>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Domínio não encontrado.");
  }

  return data;
}

function isInbox(domain: DomainIdentity) {
  return domain.is_system && domain.name === "Inbox";
}

export async function createDomain(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/domains"));
  const parsed = createDomainSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    color: formData.get("color") ?? "",
    icon: formData.get("icon") ?? "",
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Domínio inválido.",
    );
  }

  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("domains").insert({
    user_id: user.id,
    name: parsed.data.name,
    description: parsed.data.description,
    color: parsed.data.color,
    icon: parsed.data.icon,
    is_system: false,
    active: true,
  });

  if (error) {
    redirectWithError(returnTo, getFriendlySupabaseError(error.message));
  }

  revalidateDomainViews();
  redirect(returnTo);
}

export async function updateDomainDetails(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/domains"));
  const parsed = updateDomainSchema.safeParse({
    domainId: formData.get("domainId"),
    description: formData.get("description") ?? "",
    color: formData.get("color") ?? "",
    icon: formData.get("icon") ?? "",
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "Domínio inválido.");
  }

  const { supabase, user } = await requireSession();
  const domain = await getDomainIdentity(supabase, parsed.data.domainId);

  if (isInbox(domain)) {
    redirectWithError(returnTo, "Inbox não pode ser editada nesta fase.");
  }

  const { error } = await supabase
    .from("domains")
    .update({
      description: parsed.data.description,
      color: parsed.data.color,
      icon: parsed.data.icon,
    })
    .eq("id", parsed.data.domainId)
    .eq("user_id", user.id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidateDomainViews();
  redirect(returnTo);
}

export async function setDomainActive(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/domains"));
  const parsed = toggleDomainSchema.safeParse({
    domainId: formData.get("domainId"),
    active: formData.get("active"),
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "Domínio inválido.");
  }

  const { supabase, user } = await requireSession();
  const domain = await getDomainIdentity(supabase, parsed.data.domainId);

  if (isInbox(domain)) {
    redirectWithError(returnTo, "Inbox não pode ser desativada.");
  }

  const { error } = await supabase
    .from("domains")
    .update({ active: parsed.data.active === "true" })
    .eq("id", parsed.data.domainId)
    .eq("user_id", user.id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidateDomainViews();
  redirect(returnTo);
}
