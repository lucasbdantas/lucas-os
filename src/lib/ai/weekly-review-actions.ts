"use server";

import { zodTextFormat } from "openai/helpers/zod";
import { getRecentDailyPlanFeedbackSummary } from "@/lib/ai/daily-plan-repository";
import { getOpenAIClient } from "@/lib/ai/openai";
import {
  aiWeeklyReviewSchema,
  buildWeeklyReviewPayload,
  parseAIWeeklyReview,
  type WeeklyReviewAIState,
  type WeeklyReviewContext,
} from "@/lib/ai/weekly-review";
import { addDays, toDateOnlyInTimezone } from "@/lib/app-settings/preferences";
import { getAppPreferencesForUser } from "@/lib/app-settings/server";
import { getGoogleCalendarAgendaForUser } from "@/lib/integrations/google/calendar";
import { requireSession } from "@/lib/supabase/require-session";

const model = process.env.OPENAI_MODEL ?? "gpt-4.1-nano";
const openTaskStatuses = ["todo", "doing", "waiting"];

type ReviewTaskRow = {
  completed_at: string | null;
  due_date: string | null;
  priority: string;
  project_id: string | null;
  title: string;
  updated_at: string;
};

async function buildWeeklyReviewContext(): Promise<WeeklyReviewContext> {
  const { supabase, user } = await requireSession();
  const preferences = await getAppPreferencesForUser(supabase, user.id);
  const now = new Date();
  const today = toDateOnlyInTimezone(preferences.timezone, now);
  const nextWeek = toDateOnlyInTimezone(preferences.timezone, addDays(now, 7));
  const weekAgo = addDays(now, -7).toISOString();

  const [completed, open, projects, captures, feedback] = await Promise.all([
    supabase
      .from("tasks")
      .select("title,due_date,priority,project_id,completed_at,updated_at")
      .eq("user_id", user.id)
      .eq("status", "done")
      .gte("updated_at", weekAgo)
      .order("updated_at", { ascending: false })
      .limit(30)
      .returns<ReviewTaskRow[]>(),
    supabase
      .from("tasks")
      .select("title,due_date,priority,project_id,completed_at,updated_at")
      .eq("user_id", user.id)
      .in("status", openTaskStatuses)
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(60)
      .returns<ReviewTaskRow[]>(),
    supabase
      .from("projects")
      .select("id,name,target_date")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(30)
      .returns<Array<{ id: string; name: string; target_date: string | null }>>(),
    supabase
      .from("pending_captures")
      .select("raw_text,source")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("captured_at", { ascending: false })
      .limit(10)
      .returns<Array<{ raw_text: string; source: string }>>(),
    getRecentDailyPlanFeedbackSummary(supabase, user.id).catch(() => []),
  ]);

  for (const result of [completed, open, projects, captures]) {
    if (result.error) throw new Error(result.error.message);
  }

  const openProjectIds = new Set(
    (open.data ?? [])
      .map((task) => task.project_id)
      .filter((id): id is string => Boolean(id)),
  );
  const calendar = await getGoogleCalendarAgendaForUser({
    supabase,
    timeMin: now.toISOString(),
    timeMax: addDays(now, 7).toISOString(),
    userId: user.id,
  }).catch(() => ({ events: [] }));

  return {
    agenda: calendar.events.slice(0, 15).map((event) => ({
      start: event.start,
      title: event.title,
    })),
    completedTasks: (completed.data ?? []).map((task) => ({
      completedAt: task.completed_at ?? task.updated_at,
      title: task.title,
    })),
    dailyPlanningFeedback: feedback.map(
      (item) => `${item.target_type}:${item.rating} (${item.count})`,
    ),
    overdueTasks: (open.data ?? [])
      .filter((task) => task.due_date && task.due_date < today)
      .map((task) => ({
        dueDate: task.due_date,
        priority: task.priority,
        title: task.title,
      })),
    pendingCaptures: (captures.data ?? []).map((capture) => ({
      source: capture.source,
      text: capture.raw_text,
    })),
    projectsWithoutNextAction: (projects.data ?? [])
      .filter((project) => !openProjectIds.has(project.id))
      .map((project) => ({ name: project.name, targetDate: project.target_date })),
    upcomingTasks: (open.data ?? [])
      .filter(
        (task) =>
          task.due_date && task.due_date >= today && task.due_date <= nextWeek,
      )
      .map((task) => ({
        dueDate: task.due_date,
        priority: task.priority,
        title: task.title,
      })),
  };
}

export async function generateWeeklyReview(
  _previousState: WeeklyReviewAIState,
  _formData: FormData,
): Promise<WeeklyReviewAIState> {
  void _previousState;
  void _formData;
  const client = getOpenAIClient();

  if (!client) {
    return {
      message: "OpenAI não está configurada. A revisão manual continua disponível.",
      status: "error",
    };
  }

  try {
    const context = await buildWeeklyReviewContext();
    const response = await client.responses.parse({
      model,
      instructions: [
        "Create a concise weekly review from the supplied summarized context.",
        "Never execute actions or claim that tasks, email, calendar, captures, or projects were changed.",
        "Use only the supplied facts and do not invent identifiers.",
        "Write every user-facing field in Brazilian Portuguese.",
        "Keep recommendations calm, concrete, and explicitly optional.",
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(buildWeeklyReviewPayload(context)),
            },
          ],
        },
      ],
      text: { format: zodTextFormat(aiWeeklyReviewSchema, "weekly_review") },
    });
    const parsed = parseAIWeeklyReview(response.output_parsed);

    if (!parsed.ok) {
      return {
        message: "A IA retornou uma revisão inválida. Nada foi alterado.",
        status: "error",
      };
    }

    return { review: parsed.review, status: "ready" };
  } catch {
    return {
      message: "Não foi possível gerar a revisão agora. Nada foi alterado.",
      status: "error",
    };
  }
}
