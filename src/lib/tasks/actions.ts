"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/supabase/require-session";

const taskPriorityValues = ["low", "medium", "high", "critical"] as const;
const taskEnergyValues = ["low", "medium", "high"] as const;
const taskStatusValues = [
  "todo",
  "doing",
  "waiting",
  "done",
  "canceled",
] as const;

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.string().uuid().nullable());

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value === "" ? null : value));

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable());

const optionalTime = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .pipe(z.string().regex(/^\d{2}:\d{2}$/).nullable());

const taskFieldsSchema = z.object({
  title: z.string().trim().min(1, "Informe um titulo.").max(220),
  notes: optionalText(4000),
  projectId: optionalUuid,
  dueDate: optionalDate,
  dueTime: optionalTime,
  priority: z.enum(taskPriorityValues).default("medium"),
  energyRequired: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.enum(taskEnergyValues).nullable()),
  context: optionalText(80),
  returnTo: z.string().optional(),
});

const createTaskSchema = taskFieldsSchema.extend({
  domainId: optionalUuid,
});

const updateTaskSchema = taskFieldsSchema.extend({
  taskId: z.string().uuid(),
  domainId: z.string().uuid("Escolha um dominio valido."),
  status: z.enum(taskStatusValues),
});

const taskActionSchema = z.object({
  taskId: z.string().uuid(),
  returnTo: z.string().optional(),
});

type DomainIdentity = {
  id: string;
  name: string;
  is_system: boolean;
  active: boolean;
};

type ProjectIdentity = {
  id: string;
  domain_id: string;
};

type TaskIdentity = {
  id: string;
  completed_at: string | null;
};

function getReturnTo(value: string | undefined, fallback = "/tasks") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function redirectWithError(returnTo: string, message: string): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}error=${encodeURIComponent(message)}`);
}

async function getInboxDomainId(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  userId: string,
) {
  const { data, error } = await supabase
    .from("domains")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "Inbox")
    .eq("is_system", true)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Dominio Inbox nao encontrado. Rode o seed inicial.");
  }

  return data.id;
}

async function validateDomain(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  userId: string,
  domainId: string,
) {
  const { data, error } = await supabase
    .from("domains")
    .select("id,name,is_system,active")
    .eq("id", domainId)
    .eq("user_id", userId)
    .maybeSingle<DomainIdentity>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Dominio invalido.");
  }

  const isInbox = data.is_system && data.name === "Inbox";

  if (!data.active && !isInbox) {
    throw new Error("Escolha um dominio ativo ou use Inbox.");
  }

  return data;
}

async function validateProject(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  userId: string,
  projectId: string,
  domainId: string,
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
    throw new Error("Projeto invalido.");
  }

  if (data.domain_id !== domainId) {
    throw new Error("O projeto escolhido nao pertence ao dominio selecionado.");
  }

  return data;
}

function revalidateTaskViews() {
  revalidatePath("/tasks");
  revalidatePath("/inbox");
  revalidatePath("/projects");
  revalidatePath("/today");
}

export async function createTask(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/tasks"));
  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    notes: formData.get("notes") ?? "",
    domainId: formData.get("domainId") ?? "",
    projectId: formData.get("projectId") ?? "",
    dueDate: formData.get("dueDate") ?? "",
    dueTime: formData.get("dueTime") ?? "",
    priority: formData.get("priority") ?? "medium",
    energyRequired: formData.get("energyRequired") ?? "",
    context: formData.get("context") ?? "",
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Tarefa invalida.",
    );
  }

  const { supabase, user } = await requireSession();

  let domainId: string;

  try {
    domainId = parsed.data.domainId ?? (await getInboxDomainId(supabase, user.id));
    await validateDomain(supabase, user.id, domainId);

    if (parsed.data.projectId) {
      await validateProject(
        supabase,
        user.id,
        parsed.data.projectId,
        domainId,
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao validar tarefa.";
    redirectWithError(returnTo, message);
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    domain_id: domainId,
    project_id: parsed.data.projectId,
    title: parsed.data.title,
    notes: parsed.data.notes,
    due_date: parsed.data.dueDate,
    due_time: parsed.data.dueTime,
    priority: parsed.data.priority,
    energy_required: parsed.data.energyRequired,
    context: parsed.data.context,
    status: "todo",
    source: "manual",
  });

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidateTaskViews();
  redirect(returnTo);
}

export async function updateTask(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/tasks"));
  const parsed = updateTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    title: formData.get("title"),
    notes: formData.get("notes") ?? "",
    domainId: formData.get("domainId") ?? "",
    projectId: formData.get("projectId") ?? "",
    dueDate: formData.get("dueDate") ?? "",
    dueTime: formData.get("dueTime") ?? "",
    priority: formData.get("priority") ?? "medium",
    energyRequired: formData.get("energyRequired") ?? "",
    context: formData.get("context") ?? "",
    status: formData.get("status") ?? "todo",
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Tarefa invalida.",
    );
  }

  const { supabase, user } = await requireSession();

  try {
    await validateDomain(supabase, user.id, parsed.data.domainId);

    if (parsed.data.projectId) {
      await validateProject(
        supabase,
        user.id,
        parsed.data.projectId,
        parsed.data.domainId,
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao validar tarefa.";
    redirectWithError(returnTo, message);
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id,completed_at")
    .eq("id", parsed.data.taskId)
    .eq("user_id", user.id)
    .maybeSingle<TaskIdentity>();

  if (taskError) {
    redirectWithError(returnTo, taskError.message);
  }

  if (!task) {
    redirectWithError(returnTo, "Tarefa nao encontrada.");
  }

  const isClosedStatus =
    parsed.data.status === "done" || parsed.data.status === "canceled";
  const completedAt = isClosedStatus
    ? (task.completed_at ?? new Date().toISOString())
    : null;

  const { error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      notes: parsed.data.notes,
      domain_id: parsed.data.domainId,
      project_id: parsed.data.projectId,
      due_date: parsed.data.dueDate,
      due_time: parsed.data.dueTime,
      priority: parsed.data.priority,
      energy_required: parsed.data.energyRequired,
      context: parsed.data.context,
      status: parsed.data.status,
      completed_at: completedAt,
    })
    .eq("id", parsed.data.taskId)
    .eq("user_id", user.id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidateTaskViews();
  redirect(returnTo);
}

export async function completeTask(formData: FormData) {
  await updateTaskStatus(formData, "done");
}

export async function cancelTask(formData: FormData) {
  await updateTaskStatus(formData, "canceled");
}

async function updateTaskStatus(formData: FormData, status: "done" | "canceled") {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/tasks"));
  const parsed = taskActionSchema.safeParse({
    taskId: formData.get("taskId"),
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "Tarefa invalida.");
  }

  const { supabase, user } = await requireSession();
  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.taskId)
    .eq("user_id", user.id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidateTaskViews();
  redirect(returnTo);
}
