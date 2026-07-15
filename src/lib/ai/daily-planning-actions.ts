"use server";

import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getOpenAIClient } from "@/lib/ai/openai";
import {
  aiDailyPlanSchema,
  buildDailyPlanSourceSnapshot,
  buildDailyPlanningPayload,
  dailyPlanFeedbackRatings,
  dailyPlanFeedbackTargetTypes,
  getDailyPlanningErrorMessage,
  parseAIDailyPlan,
  resolveAIDailyPlan,
  toPersistedDailyPlanValue,
  type DailyPlanFeedbackRating,
  type DailyPlanningContext,
  type DailyPlanningState,
} from "@/lib/ai/daily-planning";
import {
  dailyPlanningTablesUnavailableMessage,
  dailyPlanningTablesUnavailableReason,
  getDailyPlanById,
  getDailyPlanningPersistenceAvailability,
  getRecentDailyPlanFeedbackSummary,
  isDailyPlanningTablesUnavailable,
  persistDailyPlan,
} from "@/lib/ai/daily-plan-repository";
import { addDays, toDateOnlyInTimezone } from "@/lib/app-settings/preferences";
import { getAppPreferencesForUser } from "@/lib/app-settings/server";
import { getGoogleCalendarAgendaForUser } from "@/lib/integrations/google/calendar";
import { getCalendarLanePreferencesForUser } from "@/lib/integrations/google/calendar-lane-settings";
import { splitCalendarEventsByLane } from "@/lib/integrations/google/calendar-lanes";
import { getGmailActionInboxForUser } from "@/lib/integrations/google/gmail";
import { normalizeGmailInboxFilters } from "@/lib/integrations/google/gmail-filters";
import { requireSession } from "@/lib/supabase/require-session";

const model = process.env.OPENAI_MODEL ?? "gpt-4.1-nano";
const openTaskStatuses = ["todo", "doing", "waiting"];

const dailyPlanFeedbackInputSchema = z.object({
  dailyPlanId: z.string().uuid(),
  planGeneration: z.coerce.number().int().min(1),
  rating: z.enum(dailyPlanFeedbackRatings),
  targetIndex: z.coerce.number().int().min(0),
  targetType: z.enum(dailyPlanFeedbackTargetTypes),
});

export type DailyPlanFeedbackState = {
  message?: string;
  ok?: boolean;
  rating?: DailyPlanFeedbackRating;
  reason?: typeof dailyPlanningTablesUnavailableReason;
  status: "idle" | "saved" | "error";
};

export const initialDailyPlanFeedbackState: DailyPlanFeedbackState = {
  status: "idle",
};

type TaskContextRow = {
  id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
  priority: string;
  domain_id: string;
  project_id: string | null;
};

type ProjectContextRow = {
  id: string;
  name: string;
  domain_id: string;
  target_date: string | null;
};

function getDateOnly(timezone: Parameters<typeof toDateOnlyInTimezone>[0], date: Date) {
  return toDateOnlyInTimezone(timezone, date);
}

async function buildDailyPlanningContext(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  userId: string,
): Promise<DailyPlanningContext> {
  const preferences = await getAppPreferencesForUser(supabase, userId);
  const now = new Date();
  const today = getDateOnly(preferences.timezone, now);
  const tomorrow = getDateOnly(preferences.timezone, addDays(now, 1));
  const nextSevenDays = getDateOnly(
    preferences.timezone,
    addDays(now, 7),
  );
  const calendarTimeMin = new Date(`${today}T00:00:00.000Z`).toISOString();
  const calendarTimeMax = new Date(
    `${nextSevenDays}T23:59:59.999Z`,
  ).toISOString();

  const [tasksResult, projectRowsResult, openProjectTasksResult, capturesResult, domainsResult] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id,title,due_date,due_time,priority,domain_id,project_id")
        .in("status", openTaskStatuses)
        .not("due_date", "is", null)
        .lte("due_date", nextSevenDays)
        .order("due_date", { ascending: true })
        .order("due_time", { ascending: true, nullsFirst: false })
        .limit(40)
        .returns<TaskContextRow[]>(),
      supabase
        .from("projects")
        .select("id,name,domain_id,target_date")
        .in("status", ["active", "waiting"])
        .order("target_date", { ascending: true, nullsFirst: false })
        .limit(30)
        .returns<ProjectContextRow[]>(),
      supabase
        .from("tasks")
        .select("project_id")
        .in("status", openTaskStatuses)
        .not("project_id", "is", null)
        .limit(100)
        .returns<Array<{ project_id: string | null }>>(),
      supabase
        .from("pending_captures")
        .select("id,raw_text,source")
        .eq("status", "pending")
        .order("captured_at", { ascending: false })
        .limit(10)
        .returns<Array<{ id: string; raw_text: string; source: string }>>(),
      supabase.from("domains").select("id,name").returns<Array<{ id: string; name: string }>>(),
    ]);

  for (const result of [
    tasksResult,
    projectRowsResult,
    openProjectTasksResult,
    capturesResult,
    domainsResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const tasksData = tasksResult.data ?? [];
  const projectRows = projectRowsResult.data ?? [];
  const openProjectTasks = openProjectTasksResult.data ?? [];
  const captures = capturesResult.data ?? [];
  const domains = domainsResult.data ?? [];

  const [calendarResult, lanePreferencesResult, gmailResult] = await Promise.all([
    getGoogleCalendarAgendaForUser({
      supabase,
      timeMax: calendarTimeMax,
      timeMin: calendarTimeMin,
      userId,
    }).catch(() => ({ connectedAccountCount: 0, events: [], reconnectAccountEmails: [], warnings: [] })),
    getCalendarLanePreferencesForUser(supabase, userId).catch(() => ({})),
    getGmailActionInboxForUser({
      filters: normalizeGmailInboxFilters({}),
      maxResultsPerAccount: 10,
      supabase,
      userId,
    }).catch(() => ({ accounts: [], availableLabels: [], connectedAccountCount: 0, messages: [], reconnectAccountEmails: [], warnings: [] })),
  ]);

  const domainNames = new Map(domains.map((domain) => [domain.id, domain.name]));
  const projectNames = new Map(projectRows.map((project) => [project.id, project.name]));
  const tasks = tasksData.map((task, index) => ({
    id: task.id,
    title: task.title,
    dueDate: task.due_date,
    dueTime: task.due_time,
    priority: task.priority,
    domain: domainNames.get(task.domain_id) ?? "Sem dominio",
    project: task.project_id ? projectNames.get(task.project_id) ?? null : null,
    ref: `t${index + 1}`,
  }));
  const projectIdsWithOpenTasks = new Set(
    openProjectTasks
      .map((item) => item.project_id)
      .filter((value): value is string => Boolean(value)),
  );
  const projectsWithoutNextAction = projectRows
    .filter((project) => !projectIdsWithOpenTasks.has(project.id))
    .slice(0, 10)
    .map((project, index) => ({
      domain: domainNames.get(project.domain_id) ?? "Sem dominio",
      name: project.name,
      ref: `p${index + 1}`,
      targetDate: project.target_date,
    }));
  const calendarLanes = splitCalendarEventsByLane(
    calendarResult.events,
    lanePreferencesResult,
  );
  const calendarEvents = [...calendarLanes.primary, ...calendarLanes.context]
    .slice(0, 10)
    .map((event, index) => ({
      account: event.accountEmail,
      calendar: event.calendarSummary,
      lane: calendarLanes.primary.includes(event) ? ("primary" as const) : ("context" as const),
      ref: `cal${index + 1}`,
      start: event.start,
      title: event.title,
    }));

  return {
    calendarEvents,
    emails: gmailResult.messages.slice(0, 10).map((message, index) => ({
      account: message.accountEmail,
      from: message.from,
      ref: `e${index + 1}`,
      snippet: message.snippet,
      subject: message.subject,
    })),
    overdueTasks: tasks.filter(
      (task) => task.dueDate !== null && task.dueDate < today,
    ),
    pendingCaptures: captures.map((capture, index) => ({
      ref: `c${index + 1}`,
      source: capture.source,
      text: capture.raw_text,
    })),
    projectsWithoutNextAction,
    timezone: preferences.timezone,
    today,
    todayTasks: tasks.filter((task) => task.dueDate === today),
    upcomingTasks: tasks.filter(
      (task) => task.dueDate !== null && task.dueDate >= tomorrow,
    ),
  };
}

export async function generateDailyPlan(
  _previousState: DailyPlanningState,
  _formData: FormData,
): Promise<DailyPlanningState> {
  void _previousState;
  void _formData;
  const { supabase, user } = await requireSession();
  const client = getOpenAIClient();

  if (!client) {
    return {
      message: getDailyPlanningErrorMessage("missing_openai"),
      status: "error",
    };
  }

  try {
    const availability = await getDailyPlanningPersistenceAvailability(supabase);

    if (!availability.available) {
      return {
        message: dailyPlanningTablesUnavailableMessage,
        ok: false,
        reason: dailyPlanningTablesUnavailableReason,
        status: "error",
      };
    }

    const context = await buildDailyPlanningContext(supabase, user.id);
    const feedbackSummary = await getRecentDailyPlanFeedbackSummary(
      supabase,
      user.id,
    );
    const response = await client.responses.parse({
      model,
      instructions: [
        "You create a concise personal daily briefing from the supplied context.",
        "Never execute actions, modify tasks, email, calendar, captures, or notifications.",
        "Return only the requested structured plan.",
        "Use only refs that exist in the input. If unsure, omit the ref.",
        "Priorities must contain at most three concrete items.",
        "Rescheduling suggestions are suggestions only; do not imply an action was completed.",
        "Triage suggestions must use kind capture or email and should only identify likely actions.",
        "Write every user-facing field in Brazilian Portuguese.",
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                context: buildDailyPlanningPayload(context),
                feedback_summary: feedbackSummary,
              }),
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(aiDailyPlanSchema, "daily_plan"),
      },
    });
    const parsed = parseAIDailyPlan(response.output_parsed);

    if (!parsed.ok) {
      return {
        message: getDailyPlanningErrorMessage("invalid_plan"),
        status: "error",
      };
    }

    const resolvedPlan = resolveAIDailyPlan(parsed.plan, context);
    const persistedValue = toPersistedDailyPlanValue(resolvedPlan);
    const savedPlan = await persistDailyPlan(supabase, user.id, {
      model,
      plan: {
        nextSteps: persistedValue.next_steps,
        priorities: persistedValue.priorities,
        rescheduleSuggestions: persistedValue.reschedule_suggestions,
        risks: persistedValue.risks,
        summary: persistedValue.summary as string,
        triageSuggestions: persistedValue.triage_suggestions,
      },
      planDate: context.today,
      sourceSnapshot: buildDailyPlanSourceSnapshot(context),
      timezone: context.timezone,
    });

    if (!savedPlan.ok) {
      return {
        message: savedPlan.message,
        ok: false,
        reason: savedPlan.reason,
        status: "error",
      };
    }

    revalidatePath("/today");
    revalidatePath("/planning");
    return {
      ok: true,
      plan: savedPlan.plan,
      status: "ready",
    };
  } catch {
    return {
      message: getDailyPlanningErrorMessage("unknown"),
      status: "error",
    };
  }
}

export async function saveDailyPlanFeedback(
  _previousState: DailyPlanFeedbackState,
  formData: FormData,
): Promise<DailyPlanFeedbackState> {
  const parsedInput = dailyPlanFeedbackInputSchema.safeParse({
    dailyPlanId: formData.get("dailyPlanId"),
    planGeneration: formData.get("planGeneration"),
    rating: formData.get("rating"),
    targetIndex: formData.get("targetIndex"),
    targetType: formData.get("targetType"),
  });

  if (!parsedInput.success) {
    return { message: "Feedback invalido. Tente novamente.", status: "error" };
  }

  try {
    const { supabase, user } = await requireSession();
    const availability = await getDailyPlanningPersistenceAvailability(supabase);

    if (!availability.available) {
      return {
        message: dailyPlanningTablesUnavailableMessage,
        ok: false,
        reason: dailyPlanningTablesUnavailableReason,
        status: "error",
      };
    }

    const plan = await getDailyPlanById(supabase, user.id, parsedInput.data.dailyPlanId);

    if (!plan || plan.generation !== parsedInput.data.planGeneration) {
      return { message: "Este plano nao esta mais disponivel para feedback.", status: "error" };
    }

    const itemCount = {
      next_step: plan.plan.nextSteps.length,
      priority: plan.plan.priorities.length,
      reschedule: plan.plan.reschedulingSuggestions.length,
      risk: plan.plan.frictions.length,
      triage: plan.plan.triageSuggestions.length,
    }[parsedInput.data.targetType];

    if (parsedInput.data.targetIndex >= itemCount) {
      return { message: "Este item nao existe mais no plano salvo.", status: "error" };
    }

    const result = await supabase
      .from("daily_plan_feedback")
      .upsert(
        {
          daily_plan_id: parsedInput.data.dailyPlanId,
          plan_generation: parsedInput.data.planGeneration,
          rating: parsedInput.data.rating,
          target_index: parsedInput.data.targetIndex,
          target_type: parsedInput.data.targetType,
          user_id: user.id,
        },
        {
          onConflict:
            "user_id,daily_plan_id,plan_generation,target_type,target_index",
        },
      );

    if (result.error) {
      if (isDailyPlanningTablesUnavailable(result.error)) {
        return {
          message: dailyPlanningTablesUnavailableMessage,
          ok: false,
          reason: dailyPlanningTablesUnavailableReason,
          status: "error",
        };
      }

      throw new Error(result.error.message);
    }

    revalidatePath("/today");
    revalidatePath("/planning");
    return { ok: true, rating: parsedInput.data.rating, status: "saved" };
  } catch {
    return {
      message: "Nao foi possivel salvar o feedback agora.",
      status: "error",
    };
  }
}
