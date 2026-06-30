"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/supabase/require-session";
import {
  getNextOccurrenceDate,
  type RecurrenceType,
} from "@/lib/tasks/recurrence";

const taskPriorityValues = ["low", "medium", "high", "critical"] as const;
const taskEnergyValues = ["low", "medium", "high"] as const;
const taskStatusValues = [
  "todo",
  "doing",
  "waiting",
  "done",
  "canceled",
] as const;
const taskRecurrenceTypeValues = ["none", "daily", "weekly", "monthly"] as const;
const openTaskStatuses = ["todo", "doing", "waiting"] as const;

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

const recurrenceIntervalSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? 1 : Number(value)))
  .pipe(z.number().int().min(1).max(365));

const taskFieldsSchema = z.object({
  title: z.string().trim().min(1, "Informe um título.").max(220),
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
  recurrenceType: z.enum(taskRecurrenceTypeValues).default("none"),
  recurrenceInterval: recurrenceIntervalSchema,
  recurrenceAnchorDate: optionalDate,
  recurrenceEndDate: optionalDate,
  returnTo: z.string().optional(),
});

const createTaskSchema = taskFieldsSchema.extend({
  domainId: optionalUuid,
});

const updateTaskSchema = taskFieldsSchema.extend({
  taskId: z.string().uuid(),
  domainId: z.string().uuid("Escolha um domínio válido."),
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

type RecurringTaskSnapshot = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  due_date: string | null;
  due_time: string | null;
  priority: string;
  energy_required: string | null;
  context: string | null;
  domain_id: string;
  project_id: string | null;
  source: string;
  completed_at: string | null;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_anchor_date: string | null;
  recurrence_end_date: string | null;
  recurrence_parent_id: string | null;
};

type NextOccurrenceStatus =
  | "created"
  | "duplicate"
  | "missing_due_date"
  | "none"
  | "past_end_date";

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
    throw new Error("Domínio Inbox não encontrado. Rode o seed inicial.");
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
    throw new Error("Domínio inválido.");
  }

  const isInbox = data.is_system && data.name === "Inbox";

  if (!data.active && !isInbox) {
    throw new Error("Escolha um domínio ativo ou use Inbox.");
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
    throw new Error("Projeto inválido.");
  }

  if (data.domain_id !== domainId) {
    throw new Error("O projeto escolhido não pertence ao domínio selecionado.");
  }

  return data;
}

function normalizeRecurrenceFields(data: {
  dueDate: string | null;
  recurrenceAnchorDate: string | null;
  recurrenceEndDate: string | null;
  recurrenceInterval: number;
  recurrenceType: RecurrenceType;
}) {
  if (data.recurrenceType === "none") {
    return {
      recurrenceAnchorDate: null,
      recurrenceEndDate: null,
      recurrenceInterval: 1,
      recurrenceType: "none" as const,
    };
  }

  return {
    recurrenceAnchorDate: data.recurrenceAnchorDate ?? data.dueDate,
    recurrenceEndDate: data.recurrenceEndDate,
    recurrenceInterval: data.recurrenceInterval,
    recurrenceType: data.recurrenceType,
  };
}

function revalidateTaskViews() {
  revalidatePath("/tasks");
  revalidatePath("/inbox");
  revalidatePath("/projects");
  revalidatePath("/today");
  revalidatePath("/review");
}

async function maybeCreateNextOccurrence(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  userId: string,
  task: RecurringTaskSnapshot,
): Promise<NextOccurrenceStatus> {
  const nextOccurrence = getNextOccurrenceDate({
    dueDate: task.due_date,
    recurrenceEndDate: task.recurrence_end_date,
    recurrenceInterval: task.recurrence_interval,
    recurrenceType: task.recurrence_type,
  });

  if (!nextOccurrence.shouldCreate) {
    return nextOccurrence.reason;
  }

  const recurrenceParentId = task.recurrence_parent_id ?? task.id;
  const { data: existingTask, error: existingTaskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("recurrence_parent_id", recurrenceParentId)
    .eq("due_date", nextOccurrence.nextDueDate)
    .in("status", openTaskStatuses)
    .maybeSingle<{ id: string }>();

  if (existingTaskError) {
    throw new Error(existingTaskError.message);
  }

  if (existingTask) {
    return "duplicate";
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    domain_id: task.domain_id,
    project_id: task.project_id,
    title: task.title,
    notes: task.notes,
    status: "todo",
    due_date: nextOccurrence.nextDueDate,
    due_time: task.due_time,
    priority: task.priority,
    energy_required: task.energy_required,
    context: task.context,
    source: task.source,
    recurrence_type: task.recurrence_type,
    recurrence_interval: task.recurrence_interval,
    recurrence_anchor_date: task.recurrence_anchor_date ?? task.due_date,
    recurrence_end_date: task.recurrence_end_date,
    recurrence_parent_id: recurrenceParentId,
  });

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return "duplicate";
    }

    throw new Error(error.message);
  }

  return "created";
}

function getRecurringMissingDateMessage(status: NextOccurrenceStatus) {
  if (status === "missing_due_date") {
    return "Tarefa concluída, mas nenhuma próxima ocorrência foi criada porque ela não tem data.";
  }

  return null;
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
    recurrenceType: formData.get("recurrenceType") ?? "none",
    recurrenceInterval: formData.get("recurrenceInterval") ?? "1",
    recurrenceAnchorDate: formData.get("recurrenceAnchorDate") ?? "",
    recurrenceEndDate: formData.get("recurrenceEndDate") ?? "",
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Tarefa inválida.",
    );
  }

  const { supabase, user } = await requireSession();

  let domainId: string;

  try {
    domainId =
      parsed.data.domainId ?? (await getInboxDomainId(supabase, user.id));
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

  const recurrence = normalizeRecurrenceFields(parsed.data);
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
    recurrence_type: recurrence.recurrenceType,
    recurrence_interval: recurrence.recurrenceInterval,
    recurrence_anchor_date: recurrence.recurrenceAnchorDate,
    recurrence_end_date: recurrence.recurrenceEndDate,
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
    recurrenceType: formData.get("recurrenceType") ?? "none",
    recurrenceInterval: formData.get("recurrenceInterval") ?? "1",
    recurrenceAnchorDate: formData.get("recurrenceAnchorDate") ?? "",
    recurrenceEndDate: formData.get("recurrenceEndDate") ?? "",
    status: formData.get("status") ?? "todo",
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Tarefa inválida.",
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
    .select(
      "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id,source,completed_at,recurrence_type,recurrence_interval,recurrence_anchor_date,recurrence_end_date,recurrence_parent_id",
    )
    .eq("id", parsed.data.taskId)
    .eq("user_id", user.id)
    .maybeSingle<RecurringTaskSnapshot>();

  if (taskError) {
    redirectWithError(returnTo, taskError.message);
  }

  if (!task) {
    redirectWithError(returnTo, "Tarefa não encontrada.");
  }

  const isClosedStatus =
    parsed.data.status === "done" || parsed.data.status === "canceled";
  const completedAt = isClosedStatus
    ? (task.completed_at ?? new Date().toISOString())
    : null;
  const recurrence = normalizeRecurrenceFields(parsed.data);

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
      recurrence_type: recurrence.recurrenceType,
      recurrence_interval: recurrence.recurrenceInterval,
      recurrence_anchor_date: recurrence.recurrenceAnchorDate,
      recurrence_end_date: recurrence.recurrenceEndDate,
    })
    .eq("id", parsed.data.taskId)
    .eq("user_id", user.id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  let nextOccurrenceStatus: NextOccurrenceStatus = "none";

  if (parsed.data.status === "done" && task.status !== "done") {
    try {
      nextOccurrenceStatus = await maybeCreateNextOccurrence(supabase, user.id, {
        ...task,
        title: parsed.data.title,
        notes: parsed.data.notes,
        status: parsed.data.status,
        due_date: parsed.data.dueDate,
        due_time: parsed.data.dueTime,
        priority: parsed.data.priority,
        energy_required: parsed.data.energyRequired,
        context: parsed.data.context,
        domain_id: parsed.data.domainId,
        project_id: parsed.data.projectId,
        completed_at: completedAt,
        recurrence_type: recurrence.recurrenceType,
        recurrence_interval: recurrence.recurrenceInterval,
        recurrence_anchor_date: recurrence.recurrenceAnchorDate,
        recurrence_end_date: recurrence.recurrenceEndDate,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao gerar próxima ocorrência.";
      redirectWithError(returnTo, message);
    }
  }

  revalidateTaskViews();

  const missingDateMessage = getRecurringMissingDateMessage(
    nextOccurrenceStatus,
  );

  if (missingDateMessage) {
    redirectWithError(returnTo, missingDateMessage);
  }

  redirect(returnTo);
}

export async function completeTask(formData: FormData) {
  await updateTaskStatus(formData, "done");
}

export async function cancelTask(formData: FormData) {
  await updateTaskStatus(formData, "canceled");
}

async function updateTaskStatus(
  formData: FormData,
  status: "done" | "canceled",
) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/tasks"));
  const parsed = taskActionSchema.safeParse({
    taskId: formData.get("taskId"),
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "Tarefa inválida.");
  }

  const { supabase, user } = await requireSession();
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select(
      "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id,source,completed_at,recurrence_type,recurrence_interval,recurrence_anchor_date,recurrence_end_date,recurrence_parent_id",
    )
    .eq("id", parsed.data.taskId)
    .eq("user_id", user.id)
    .maybeSingle<RecurringTaskSnapshot>();

  if (taskError) {
    redirectWithError(returnTo, taskError.message);
  }

  if (!task) {
    redirectWithError(returnTo, "Tarefa não encontrada.");
  }

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

  let nextOccurrenceStatus: NextOccurrenceStatus = "none";

  if (status === "done" && task.status !== "done") {
    try {
      nextOccurrenceStatus = await maybeCreateNextOccurrence(
        supabase,
        user.id,
        task,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao gerar próxima ocorrência.";
      redirectWithError(returnTo, message);
    }
  }

  revalidateTaskViews();

  const missingDateMessage = getRecurringMissingDateMessage(
    nextOccurrenceStatus,
  );

  if (missingDateMessage) {
    redirectWithError(returnTo, missingDateMessage);
  }

  redirect(returnTo);
}
