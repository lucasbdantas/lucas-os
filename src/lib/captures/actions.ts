"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseCaptureWithAI } from "@/lib/captures/ai-parser";
import { requireSession } from "@/lib/supabase/require-session";

const captureSourceValues = [
  "manual",
  "web",
  "ios_shortcut",
  "android_shortcut",
  "voice",
  "email",
  "webhook",
] as const;

const captureStatusValues = ["resolved", "dismissed", "expired"] as const;
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

const createPendingCaptureSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(1, "Digite algo antes de salvar a captura.")
    .max(12000, "A captura ficou longa demais para esta etapa."),
  source: z.enum(captureSourceValues).default("manual"),
  returnTo: z.string().optional(),
});

const updatePendingCaptureStatusSchema = z.object({
  captureId: z.string().uuid(),
  status: z.enum(captureStatusValues),
  returnTo: z.string().optional(),
});

const createTaskFromCaptureSchema = z.object({
  captureId: z.string().uuid(),
  title: z.string().trim().min(1, "Informe um titulo.").max(220),
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

const createTaskFromSmartCaptureSchema = createTaskFromCaptureSchema.omit({
  captureId: true,
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

export type AICapturePreviewState = {
  status: "idle" | "error" | "low_confidence" | "none" | "task";
  message?: string;
  preview?: {
    title: string;
    notes: string | null;
    domainId: string | null;
    projectId: string | null;
    dueDate: string | null;
    dueTime: string | null;
    priority: "low" | "medium" | "high" | "critical";
    reason: string;
  };
};

function getReturnTo(value: string | undefined, fallback = "/capture") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function redirectWithError(returnTo: string, message: string): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}error=${encodeURIComponent(message)}`);
}

function revalidateCaptureViews() {
  revalidatePath("/capture");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/inbox");
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

function toSaoPauloDateOnly(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).formatToParts(date);

  const valueByType = new Map(parts.map((part) => [part.type, part.value]));

  return `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`;
}

export async function createPendingCapture(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/capture"));
  const parsed = createPendingCaptureSchema.safeParse({
    rawText: formData.get("rawText"),
    source: formData.get("source") ?? "manual",
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Captura invalida.",
    );
  }

  const { supabase, user } = await requireSession();
  const { error } = await supabase.from("pending_captures").insert({
    user_id: user.id,
    raw_text: parsed.data.rawText,
    source: parsed.data.source,
    status: "pending",
  });

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidateCaptureViews();
  redirect(returnTo);
}

export async function updatePendingCaptureStatus(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/capture"));
  const parsed = updatePendingCaptureStatusSchema.safeParse({
    captureId: formData.get("captureId"),
    status: formData.get("status"),
    returnTo,
  });

  if (!parsed.success) {
    redirectWithError(returnTo, "Captura invalida.");
  }

  const now = new Date().toISOString();
  const timestampFields = {
    resolved_at: parsed.data.status === "resolved" ? now : null,
    dismissed_at: parsed.data.status === "dismissed" ? now : null,
    expired_at: parsed.data.status === "expired" ? now : null,
  };

  const { supabase, user } = await requireSession();
  const { data, error } = await supabase
    .from("pending_captures")
    .update({
      status: parsed.data.status,
      ...timestampFields,
    })
    .eq("id", parsed.data.captureId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  if (!data) {
    redirectWithError(returnTo, "Captura ja foi triada.");
  }

  revalidateCaptureViews();
  redirect(returnTo);
}

export async function createTaskFromPendingCapture(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/capture"));
  const parsed = createTaskFromCaptureSchema.safeParse({
    captureId: formData.get("captureId"),
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

  let domainId = parsed.data.domainId;

  try {
    domainId = domainId ?? (await getInboxDomainId(supabase, user.id));
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
      error instanceof Error ? error.message : "Erro ao validar destino.";
    redirectWithError(returnTo, message);
  }

  const now = new Date().toISOString();
  const { data: claimedCapture, error: claimError } = await supabase
    .from("pending_captures")
    .update({
      status: "resolved",
      resolved_at: now,
      dismissed_at: null,
      expired_at: null,
      parsed_intent: { manual_resolution: "task_pending" },
    })
    .eq("id", parsed.data.captureId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .select("id,raw_text")
    .maybeSingle<{ id: string; raw_text: string }>();

  if (claimError) {
    redirectWithError(returnTo, claimError.message);
  }

  if (!claimedCapture) {
    redirectWithError(returnTo, "Captura ja foi triada.");
  }

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
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
      source: "import",
    })
    .select("id")
    .single<{ id: string }>();

  if (taskError) {
    await supabase
      .from("pending_captures")
      .update({
        status: "pending",
        resolved_at: null,
        parsed_intent: {},
      })
      .eq("id", claimedCapture.id)
      .eq("user_id", user.id);

    redirectWithError(returnTo, taskError.message);
  }

  const { error: auditError } = await supabase
    .from("pending_captures")
    .update({
      parsed_intent: {
        manual_resolution: "task",
        task_id: task.id,
      },
    })
    .eq("id", claimedCapture.id)
    .eq("user_id", user.id);

  if (auditError) {
    redirectWithError(
      returnTo,
      `Tarefa criada, mas a auditoria da captura falhou: ${auditError.message}`,
    );
  }

  revalidateCaptureViews();
  redirect(returnTo);
}

export async function createTaskFromSmartCapture(formData: FormData) {
  const returnTo = getReturnTo(String(formData.get("returnTo") ?? "/capture"));
  const parsed = createTaskFromSmartCaptureSchema.safeParse({
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

  let domainId = parsed.data.domainId;

  try {
    domainId = domainId ?? (await getInboxDomainId(supabase, user.id));
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
      error instanceof Error ? error.message : "Erro ao validar destino.";
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

  revalidateCaptureViews();
  redirect(returnTo);
}

export async function previewCaptureWithAI(
  _previousState: AICapturePreviewState,
  formData: FormData,
): Promise<AICapturePreviewState> {
  const rawText = String(formData.get("rawText") ?? "").trim();

  if (!rawText) {
    return {
      status: "error",
      message: "Digite algo antes de pedir preview com IA.",
    };
  }

  const { supabase } = await requireSession();

  const [domainsResult, projectsResult] = await Promise.all([
    supabase
      .from("domains")
      .select("id,name,is_system,active")
      .order("name", { ascending: true })
      .returns<Array<DomainIdentity>>(),
    supabase
      .from("projects")
      .select("id,name,domain_id")
      .in("status", ["active", "waiting"])
      .order("name", { ascending: true })
      .returns<Array<{ id: string; name: string; domain_id: string }>>(),
  ]);

  if (domainsResult.error) {
    return { status: "error", message: domainsResult.error.message };
  }

  if (projectsResult.error) {
    return { status: "error", message: projectsResult.error.message };
  }

  const selectableDomains = domainsResult.data.filter(
    (domain) => domain.active || (domain.is_system && domain.name === "Inbox"),
  );
  const domainByName = new Map(
    selectableDomains.map((domain) => [domain.name, domain]),
  );
  const domainNameById = new Map(
    domainsResult.data.map((domain) => [domain.id, domain.name]),
  );
  const projects = projectsResult.data
    .map((project) => ({
      ...project,
      domainName: domainNameById.get(project.domain_id),
    }))
    .filter(
      (project): project is typeof project & { domainName: string } =>
        Boolean(project.domainName),
    );
  const projectByName = new Map(projects.map((project) => [project.name, project]));

  const aiResult = await parseCaptureWithAI({
    currentDate: toSaoPauloDateOnly(),
    domains: selectableDomains.map((domain) => ({ name: domain.name })),
    projects: projects.map((project) => ({
      domainName: project.domainName,
      name: project.name,
    })),
    rawText,
    timezone: "America/Sao_Paulo",
  });

  if (!aiResult.ok) {
    return { status: "error", message: aiResult.reason };
  }

  const { suggestion } = aiResult;

  if (suggestion.kind !== "task") {
    return {
      status: "none",
      message:
        suggestion.reason || "A IA nao identificou uma task clara. Salve como pending.",
    };
  }

  if (suggestion.confidence < 0.75) {
    return {
      status: "low_confidence",
      message:
        suggestion.reason ||
        "A IA ficou com baixa confianca. Salve como pending.",
    };
  }

  const title = suggestion.title?.trim();

  if (!title) {
    return {
      status: "none",
      message: "A IA nao retornou titulo suficiente. Salve como pending.",
    };
  }

  const domain = suggestion.domain_name
    ? domainByName.get(suggestion.domain_name)
    : null;

  if (suggestion.domain_name && !domain) {
    return {
      status: "low_confidence",
      message:
        "A IA sugeriu um dominio que nao existe no contexto. Salve como pending.",
    };
  }

  const project = suggestion.project_name
    ? projectByName.get(suggestion.project_name)
    : null;

  if (suggestion.project_name && !project) {
    return {
      status: "low_confidence",
      message:
        "A IA sugeriu um projeto que nao existe no contexto. Salve como pending.",
    };
  }

  if (project && domain && project.domain_id !== domain.id) {
    return {
      status: "low_confidence",
      message:
        "A IA sugeriu projeto e dominio inconsistentes. Salve como pending.",
    };
  }

  return {
    preview: {
      domainId: domain?.id ?? null,
      dueDate: suggestion.due_date ?? null,
      dueTime: suggestion.due_time ?? null,
      notes: suggestion.notes?.trim() || null,
      priority: suggestion.priority ?? "medium",
      projectId: project?.id ?? null,
      reason: suggestion.reason,
      title: title.slice(0, 220),
    },
    status: "task",
  };
}
