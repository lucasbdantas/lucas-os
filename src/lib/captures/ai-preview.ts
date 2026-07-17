import { z } from "zod";

export const aiCaptureSuggestionSchema = z.object({
  kind: z.enum(["task", "none"]),
  confidence: z.number().min(0).max(1),
  title: z.string().nullable(),
  notes: z.string().nullable(),
  domain_name: z.string().nullable(),
  project_name: z.string().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  due_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  priority: z.enum(["low", "medium", "high", "critical"]).nullable(),
  reminder_offsets: z
    .array(z.number().int().min(0).max(10080))
    .max(4)
    .nullable()
    .optional(),
  reason: z.string().max(240),
});

export type AICaptureSuggestion = z.infer<typeof aiCaptureSuggestionSchema>;

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
    reminderOffsets: number[];
    confidence: number;
    reason: string;
  };
};

export type AICapturePreviewDomain = {
  id: string;
  name: string;
};

export type AICapturePreviewProject = {
  id: string;
  name: string;
  domainId: string;
};

export function validateAICaptureSuggestion(value: unknown):
  | {
      ok: true;
      suggestion: AICaptureSuggestion;
    }
  | {
      ok: false;
      state: AICapturePreviewState;
    } {
  const parsed = aiCaptureSuggestionSchema.safeParse(value);

  if (!parsed.success) {
    return {
      ok: false,
      state: {
        message: "A IA nao retornou uma sugestao estruturada valida.",
        status: "error",
      },
    };
  }

  return { ok: true, suggestion: parsed.data };
}

export function buildAICapturePreviewState(
  suggestion: AICaptureSuggestion,
  context: {
    domains: AICapturePreviewDomain[];
    projects: AICapturePreviewProject[];
  },
): AICapturePreviewState {
  if (suggestion.kind !== "task") {
    return {
      message:
        suggestion.reason || "A IA nao identificou uma task clara. Salve como pending.",
      status: "none",
    };
  }

  if (suggestion.confidence < 0.75) {
    return {
      message:
        suggestion.reason ||
        "A IA ficou com baixa confianca. Salve como pending.",
      status: "low_confidence",
    };
  }

  const title = suggestion.title?.trim();

  if (!title) {
    return {
      message: "A IA nao retornou titulo suficiente. Salve como pending.",
      status: "none",
    };
  }

  const suggestedDomain = suggestion.domain_name
    ? context.domains.find((item) => item.name === suggestion.domain_name)
    : null;

  if (suggestion.domain_name && !suggestedDomain) {
    return {
      message:
        "A IA sugeriu um dominio que nao existe no contexto. Salve como pending.",
      status: "low_confidence",
    };
  }

  const project = suggestion.project_name
    ? context.projects.find((item) => item.name === suggestion.project_name)
    : null;

  if (suggestion.project_name && !project) {
    return {
      message:
        "A IA sugeriu um projeto que nao existe no contexto. Salve como pending.",
      status: "low_confidence",
    };
  }

  if (project && suggestedDomain && project.domainId !== suggestedDomain.id) {
    return {
      message:
        "A IA sugeriu projeto e dominio inconsistentes. Salve como pending.",
      status: "low_confidence",
    };
  }

  const domain =
    suggestedDomain ??
    (project
      ? context.domains.find((item) => item.id === project.domainId) ?? null
      : null);

  return {
    preview: {
      domainId: domain?.id ?? null,
      dueDate: suggestion.due_date,
      dueTime: suggestion.due_time,
      confidence: suggestion.confidence,
      notes: suggestion.notes?.trim() || null,
      priority: suggestion.priority ?? "medium",
      projectId: project?.id ?? null,
      reminderOffsets: suggestion.reminder_offsets ?? [],
      reason: suggestion.reason,
      title: title.slice(0, 220),
    },
    status: "task",
  };
}
