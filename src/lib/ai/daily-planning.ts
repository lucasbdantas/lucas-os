import { z } from "zod";
import { sanitizeTextForAI } from "./suggestions";

const planItemSchema = z.object({
  ref: z.string().trim().max(20).nullable(),
  title: z.string().trim().min(1).max(220),
  reason: z.string().trim().max(300),
});

const triageItemSchema = z.object({
  kind: z.enum(["capture", "email"]),
  ref: z.string().trim().max(20).nullable(),
  title: z.string().trim().min(1).max(220),
  reason: z.string().trim().max(300),
});

export const aiDailyPlanSchema = z.object({
  summary: z.string().trim().min(1).max(600),
  priorities: z.array(planItemSchema).max(3),
  frictions: z.array(z.string().trim().min(1).max(300)).max(5),
  rescheduling_suggestions: z.array(planItemSchema).max(5),
  triage_suggestions: z.array(triageItemSchema).max(5),
  next_steps: z.array(z.string().trim().min(1).max(300)).max(5),
});

export type AIDailyPlanSuggestion = z.infer<typeof aiDailyPlanSchema>;

type PlanningTask = {
  id: string;
  ref: string;
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: string;
  domain: string;
  project: string | null;
};

export type DailyPlanningContext = {
  today: string;
  timezone: string;
  overdueTasks: PlanningTask[];
  todayTasks: PlanningTask[];
  upcomingTasks: PlanningTask[];
  calendarEvents: Array<{
    ref: string;
    title: string;
    start: string;
    account: string;
    calendar: string;
    lane: "primary" | "context";
  }>;
  pendingCaptures: Array<{
    ref: string;
    text: string;
    source: string;
  }>;
  emails: Array<{
    ref: string;
    subject: string;
    from: string;
    snippet: string | null;
    account: string;
  }>;
  projectsWithoutNextAction: Array<{
    ref: string;
    name: string;
    domain: string;
    targetDate: string | null;
  }>;
};

export type ResolvedDailyPlan = {
  summary: string;
  priorities: Array<AIDailyPlanSuggestion["priorities"][number] & { href?: string }>;
  frictions: string[];
  reschedulingSuggestions: Array<
    AIDailyPlanSuggestion["rescheduling_suggestions"][number] & { href?: string }
  >;
  triageSuggestions: Array<
    AIDailyPlanSuggestion["triage_suggestions"][number] & { href?: string }
  >;
  nextSteps: string[];
};

export const dailyPlanFeedbackTargetTypes = [
  "priority",
  "risk",
  "reschedule",
  "triage",
  "next_step",
] as const;

export const dailyPlanFeedbackRatings = [
  "useful",
  "not_useful",
  "wrong",
  "done",
  "ignored",
] as const;

export type DailyPlanFeedbackTargetType =
  (typeof dailyPlanFeedbackTargetTypes)[number];
export type DailyPlanFeedbackRating = (typeof dailyPlanFeedbackRatings)[number];

export type StoredDailyPlan = {
  id: string;
  planDate: string;
  timezone: string;
  generatedAt: string;
  generation: number;
  model: string;
  plan: ResolvedDailyPlan;
  feedback: Partial<Record<string, DailyPlanFeedbackRating>>;
};

export type DailyPlanHistoryItem = Pick<
  StoredDailyPlan,
  "id" | "planDate" | "timezone" | "generatedAt" | "generation"
> & {
  summary: string;
};

export type DailyPlanningState = {
  status: "idle" | "ready" | "error";
  message?: string;
  ok?: boolean;
  plan?: StoredDailyPlan;
  persistenceMode?: "tables" | "compatibility";
  reason?:
    | "daily_planning_tables_unavailable"
    | "daily_planning_persistence_unavailable";
};

export const initialDailyPlanningState: DailyPlanningState = { status: "idle" };

export type DailyPlanFeedbackState = {
  message?: string;
  ok?: boolean;
  rating?: DailyPlanFeedbackRating;
  reason?:
    | "daily_planning_tables_unavailable"
    | "daily_planning_persistence_unavailable";
  status: "idle" | "saved" | "error";
};

export const initialDailyPlanFeedbackState: DailyPlanFeedbackState = {
  status: "idle",
};

type PersistedDailyPlanValue = {
  summary: unknown;
  priorities: unknown;
  risks: unknown;
  reschedule_suggestions: unknown;
  triage_suggestions: unknown;
  next_steps: unknown;
};

export function getDailyPlanFeedbackKey(
  targetType: DailyPlanFeedbackTargetType,
  targetIndex: number,
) {
  return `${targetType}:${targetIndex}`;
}

export function buildDailyPlanningPayload(context: DailyPlanningContext) {
  const compactTask = (task: DailyPlanningContext["overdueTasks"][number]) => ({
    ref: task.ref,
    title: sanitizeTextForAI(task.title, 220),
    due_date: task.dueDate,
    due_time: task.dueTime,
    priority: sanitizeTextForAI(task.priority, 30),
    domain: sanitizeTextForAI(task.domain, 160),
    project: task.project ? sanitizeTextForAI(task.project, 200) : null,
  });

  return {
    today: context.today,
    timezone: context.timezone,
    overdue_tasks: context.overdueTasks.slice(0, 10).map(compactTask),
    today_tasks: context.todayTasks.slice(0, 10).map(compactTask),
    upcoming_tasks: context.upcomingTasks.slice(0, 10).map(compactTask),
    calendar_events: context.calendarEvents.slice(0, 10).map((event) => ({
      ref: event.ref,
      title: sanitizeTextForAI(event.title, 220),
      start: event.start,
      account: sanitizeTextForAI(event.account, 160),
      calendar: sanitizeTextForAI(event.calendar, 160),
      lane: event.lane,
    })),
    pending_captures: context.pendingCaptures.slice(0, 10).map((capture) => ({
      ref: capture.ref,
      text: sanitizeTextForAI(capture.text, 500),
      source: sanitizeTextForAI(capture.source, 40),
    })),
    emails: context.emails.slice(0, 10).map((email) => ({
      ref: email.ref,
      subject: sanitizeTextForAI(email.subject, 220),
      from: sanitizeTextForAI(email.from, 220),
      snippet: email.snippet ? sanitizeTextForAI(email.snippet, 500) : null,
      account: sanitizeTextForAI(email.account, 160),
    })),
    projects_without_next_action: context.projectsWithoutNextAction
      .slice(0, 10)
      .map((project) => ({
        ref: project.ref,
        name: sanitizeTextForAI(project.name, 220),
        domain: sanitizeTextForAI(project.domain, 160),
        target_date: project.targetDate,
      })),
  };
}

export function buildDailyPlanSourceSnapshot(context: DailyPlanningContext) {
  const payload = buildDailyPlanningPayload(context);

  // The snapshot is intentionally the same bounded, sanitized summary sent to AI.
  // It contains opaque refs rather than database IDs and never includes full emails.
  return payload;
}

export function parseAIDailyPlan(value: unknown) {
  const parsed = aiDailyPlanSchema.safeParse(value);

  if (!parsed.success) {
    return {
      ok: false as const,
      message: "A IA nao retornou um plano estruturado valido.",
    };
  }

  return { ok: true as const, plan: parsed.data };
}

function getRefHref(context: DailyPlanningContext, ref: string | null) {
  if (!ref) return undefined;

  const task = [
    ...context.overdueTasks,
    ...context.todayTasks,
    ...context.upcomingTasks,
  ].find((item) => item.ref === ref);

  return task
    ? `/tasks?edit=${encodeURIComponent(task.id)}#edit-task`
    : undefined;
}

export function resolveAIDailyPlan(
  plan: AIDailyPlanSuggestion,
  context: DailyPlanningContext,
): ResolvedDailyPlan {
  const validTaskRefs = new Set(
    [...context.overdueTasks, ...context.todayTasks, ...context.upcomingTasks].map(
      (item) => item.ref,
    ),
  );
  const validCaptureRefs = new Set(context.pendingCaptures.map((item) => item.ref));
  const validEmailRefs = new Set(context.emails.map((item) => item.ref));

  return {
    summary: plan.summary,
    priorities: plan.priorities
      .filter((item) => !item.ref || validTaskRefs.has(item.ref))
      .map((item) => ({ ...item, href: getRefHref(context, item.ref) })),
    frictions: plan.frictions,
    reschedulingSuggestions: plan.rescheduling_suggestions
      .filter((item) => !item.ref || validTaskRefs.has(item.ref))
      .map((item) => ({ ...item, href: getRefHref(context, item.ref) })),
    triageSuggestions: plan.triage_suggestions
      .filter((item) =>
        item.kind === "capture"
          ? !item.ref || validCaptureRefs.has(item.ref)
          : !item.ref || validEmailRefs.has(item.ref),
      )
      .map((item) => ({
        ...item,
        href: item.kind === "capture" ? "/capture" : "/inbox",
      })),
    nextSteps: plan.next_steps,
  };
}

export function toPersistedDailyPlanValue(plan: ResolvedDailyPlan): PersistedDailyPlanValue {
  const withoutHref = <T extends { href?: string }>(item: T) => {
    const copy = { ...item };
    delete copy.href;

    return copy;
  };

  return {
    summary: plan.summary,
    priorities: plan.priorities.map(withoutHref),
    risks: plan.frictions,
    reschedule_suggestions: plan.reschedulingSuggestions.map(withoutHref),
    triage_suggestions: plan.triageSuggestions.map(withoutHref),
    next_steps: plan.nextSteps,
  };
}

export function parseStoredDailyPlan(value: PersistedDailyPlanValue) {
  const parsed = parseAIDailyPlan({
    summary: value.summary,
    priorities: value.priorities,
    frictions: value.risks,
    rescheduling_suggestions: value.reschedule_suggestions,
    triage_suggestions: value.triage_suggestions,
    next_steps: value.next_steps,
  });

  if (!parsed.ok) {
    return null;
  }

  return {
    frictions: parsed.plan.frictions,
    nextSteps: parsed.plan.next_steps,
    priorities: parsed.plan.priorities,
    reschedulingSuggestions: parsed.plan.rescheduling_suggestions,
    summary: parsed.plan.summary,
    triageSuggestions: parsed.plan.triage_suggestions,
  } satisfies ResolvedDailyPlan;
}

export function buildDailyPlanFeedbackSummary(
  feedback: Array<{
    targetType: string;
    rating: string;
  }>,
) {
  const counts = new Map<string, number>();

  for (const item of feedback.slice(0, 30)) {
    if (
      !dailyPlanFeedbackTargetTypes.includes(
        item.targetType as DailyPlanFeedbackTargetType,
      ) ||
      !dailyPlanFeedbackRatings.includes(
        item.rating as DailyPlanFeedbackRating,
      )
    ) {
      continue;
    }

    const key = `${item.targetType}:${item.rating}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([key, count]) => {
    const [target_type, rating] = key.split(":");

    return { count, rating, target_type };
  });
}

export function getDailyPlanningErrorMessage(reason: "missing_openai" | "invalid_plan" | "unknown") {
  if (reason === "missing_openai") {
    return "OpenAI nao esta configurada. O Today continua funcionando sem plano de IA.";
  }

  if (reason === "invalid_plan") {
    return "Nao foi possivel gerar um plano seguro agora. Revise o Today manualmente.";
  }

  return "Nao foi possivel gerar o plano do dia agora. Tente novamente mais tarde.";
}
