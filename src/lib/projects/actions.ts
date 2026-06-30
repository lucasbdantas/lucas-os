"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/supabase/require-session";

const projectStatusValues = [
  "active",
  "waiting",
  "completed",
  "paused",
  "canceled",
] as const;

const projectTypeValues = [
  "deadline",
  "ongoing",
  "seasonal",
  "learning",
  "administrative",
] as const;

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable());

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value === "" ? null : value));

const projectFieldsSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do projeto.").max(160),
  description: optionalText(4000),
  domainId: z.string().uuid("Escolha um domínio."),
  status: z.enum(projectStatusValues),
  type: z.enum(projectTypeValues),
  targetDate: optionalDate,
  startDate: optionalDate,
  cadenceExpected: optionalText(120),
  successDefinition: optionalText(4000),
  failureMode: optionalText(4000),
  returnTo: z.string().optional(),
});

const createProjectSchema = projectFieldsSchema;

const updateProjectSchema = projectFieldsSchema.extend({
  projectId: z.string().uuid(),
});

const projectStatusSchema = z.object({
  projectId: z.string().uuid(),
  status: z.enum(projectStatusValues),
  returnTo: z.string().optional(),
});

const createMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1, "Informe o título da milestone.").max(180),
  dueDate: optionalDate,
  weight: z.coerce.number().int().min(1).max(100).default(1),
  returnTo: z.string().optional(),
});

const milestoneActionSchema = z.object({
  milestoneId: z.string().uuid(),
  status: z.enum(["done", "canceled"]),
  returnTo: z.string().optional(),
});

type DomainIdentity = {
  id: string;
  name: string;
  active: boolean;
  is_system: boolean;
};

type ProjectIdentity = {
  id: string;
  domain_id: string;
};

function getReturnTo(value: string | undefined, fallback = "/projects") {
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
  if (message.toLowerCase().includes("duplicate")) {
    return "Já existe um projeto com esse nome nesse domínio.";
  }

  return message;
}

function revalidateProjectViews() {
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/today");
}

async function validateProjectDomain(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  userId: string,
  domainId: string,
  options?: { allowInactiveCurrentDomainId?: string },
) {
  const { data, error } = await supabase
    .from("domains")
    .select("id,name,active,is_system")
    .eq("id", domainId)
    .eq("user_id", userId)
    .maybeSingle<DomainIdentity>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Domínio inválido.");
  }

  const isInbox = data.is_system && data.name === "Inbox";
  const isCurrentInactiveDomain =
    options?.allowInactiveCurrentDomainId === data.id;

  if (!data.active && !isInbox && !isCurrentInactiveDomain) {
    throw new Error("Escolha um domínio ativo ou use Inbox.");
  }

  return data;
}

async function getProjectIdentity(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  userId: string,
  projectId: string,
) {
  const { data, error } = await supabase
    .from("projects")
    .select("id,domain_id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle<ProjectIdentity>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Projeto não encontrado ou sem permissão.");
  }

  return data;
}

async function assertProjectCanMoveDomain(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  userId: string,
  projectId: string,
) {
  const { count, error } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "Este projeto já tem tasks associadas. Para evitar inconsistência, o domínio não pode ser alterado agora.",
    );
  }
}

export async function createProject(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/projects"));
  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    domainId: formData.get("domainId") ?? "",
    status: formData.get("status") ?? "active",
    type: formData.get("type") ?? "deadline",
    targetDate: formData.get("targetDate") ?? "",
    startDate: formData.get("startDate") ?? "",
    cadenceExpected: formData.get("cadenceExpected") ?? "",
    successDefinition: formData.get("successDefinition") ?? "",
    failureMode: formData.get("failureMode") ?? "",
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Projeto inválido.",
    );
  }

  const { supabase, user } = await requireSession();

  try {
    await validateProjectDomain(supabase, user.id, parsed.data.domainId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao validar domínio.";
    redirectWithError(returnTo, message);
  }

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    domain_id: parsed.data.domainId,
    name: parsed.data.name,
    description: parsed.data.description,
    status: parsed.data.status,
    type: parsed.data.type,
    target_date: parsed.data.targetDate,
    start_date: parsed.data.startDate,
    cadence_expected: parsed.data.cadenceExpected,
    success_definition: parsed.data.successDefinition,
    failure_mode: parsed.data.failureMode,
    completed_at:
      parsed.data.status === "completed" ? new Date().toISOString() : null,
  });

  if (error) {
    redirectWithError(returnTo, getFriendlySupabaseError(error.message));
  }

  revalidateProjectViews();
  redirect(returnTo);
}

export async function updateProject(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/projects"));
  const parsed = updateProjectSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    domainId: formData.get("domainId") ?? "",
    status: formData.get("status") ?? "active",
    type: formData.get("type") ?? "deadline",
    targetDate: formData.get("targetDate") ?? "",
    startDate: formData.get("startDate") ?? "",
    cadenceExpected: formData.get("cadenceExpected") ?? "",
    successDefinition: formData.get("successDefinition") ?? "",
    failureMode: formData.get("failureMode") ?? "",
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Projeto inválido.",
    );
  }

  const { supabase, user } = await requireSession();

  try {
    const currentProject = await getProjectIdentity(
      supabase,
      user.id,
      parsed.data.projectId,
    );
    await validateProjectDomain(supabase, user.id, parsed.data.domainId, {
      allowInactiveCurrentDomainId: currentProject.domain_id,
    });

    if (currentProject.domain_id !== parsed.data.domainId) {
      await assertProjectCanMoveDomain(
        supabase,
        user.id,
        parsed.data.projectId,
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao validar projeto.";
    redirectWithError(returnTo, message);
  }

  const { error } = await supabase
    .from("projects")
    .update({
      domain_id: parsed.data.domainId,
      name: parsed.data.name,
      description: parsed.data.description,
      status: parsed.data.status,
      type: parsed.data.type,
      target_date: parsed.data.targetDate,
      start_date: parsed.data.startDate,
      cadence_expected: parsed.data.cadenceExpected,
      success_definition: parsed.data.successDefinition,
      failure_mode: parsed.data.failureMode,
      completed_at:
        parsed.data.status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.projectId)
    .eq("user_id", user.id);

  if (error) {
    redirectWithError(returnTo, getFriendlySupabaseError(error.message));
  }

  revalidateProjectViews();
  redirect(returnTo);
}

export async function updateProjectStatus(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/projects"));
  const parsed = projectStatusSchema.safeParse({
    projectId: formData.get("projectId"),
    status: formData.get("status"),
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "Projeto inválido.");
  }

  const { supabase, user } = await requireSession();
  const { error } = await supabase
    .from("projects")
    .update({
      status: parsed.data.status,
      completed_at:
        parsed.data.status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.projectId)
    .eq("user_id", user.id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidateProjectViews();
  redirect(returnTo);
}

export async function createMilestone(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/projects"));
  const parsed = createMilestoneSchema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title"),
    dueDate: formData.get("dueDate") ?? "",
    weight: formData.get("weight") ?? "1",
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Milestone inválida.",
    );
  }

  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("milestones").insert({
    user_id: user.id,
    project_id: parsed.data.projectId,
    title: parsed.data.title,
    due_date: parsed.data.dueDate,
    weight: parsed.data.weight,
    status: "todo",
  });

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidateProjectViews();
  redirect(returnTo);
}

export async function updateMilestoneStatus(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/projects"));
  const parsed = milestoneActionSchema.safeParse({
    milestoneId: formData.get("milestoneId"),
    status: formData.get("status"),
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "Milestone inválida.");
  }

  const { supabase, user } = await requireSession();
  const { error } = await supabase
    .from("milestones")
    .update({
      status: parsed.data.status,
      completed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.milestoneId)
    .eq("user_id", user.id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidateProjectViews();
  redirect(returnTo);
}
