"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/supabase/require-session";

const taskPriorityValues = ["low", "medium", "high", "critical"] as const;
const taskEnergyValues = ["low", "medium", "high"] as const;

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

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Informe um título.").max(220),
  notes: optionalText(4000),
  domainId: optionalUuid,
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

const taskActionSchema = z.object({
  taskId: z.string().uuid(),
  returnTo: z.string().optional(),
});

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
) {
  const { data, error } = await supabase
    .from("domains")
    .select("id")
    .eq("name", "Inbox")
    .eq("is_system", true)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Domínio Inbox não encontrado. Rode o seed inicial.");
  }

  return data.id;
}

function revalidateTaskViews() {
  revalidatePath("/tasks");
  revalidatePath("/inbox");
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
    redirectWithError(returnTo, parsed.error.issues[0]?.message ?? "Tarefa inválida.");
  }

  const { supabase, user } = await requireSession();

  let domainId = parsed.data.domainId;

  try {
    domainId = domainId ?? (await getInboxDomainId(supabase));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao localizar Inbox.";
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
    redirectWithError(returnTo, "Tarefa inválida.");
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
