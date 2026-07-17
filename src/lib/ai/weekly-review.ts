import { z } from "zod";

const textItem = z.string().trim().min(1).max(500);

export const aiWeeklyReviewSchema = z.object({
  summary: textItem,
  wins: z.array(textItem).max(5),
  pending: z.array(textItem).max(7),
  bottlenecks: z.array(textItem).max(5),
  recommendations: z.array(textItem).max(7),
  projectsNeedingNextAction: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(180),
        reason: textItem,
      }),
    )
    .max(7),
});

export type AIWeeklyReview = z.infer<typeof aiWeeklyReviewSchema>;

export type WeeklyReviewContext = {
  agenda: Array<{ start: string; title: string }>;
  completedTasks: Array<{ completedAt: string | null; title: string }>;
  dailyPlanningFeedback: string[];
  overdueTasks: Array<{ dueDate: string | null; priority: string; title: string }>;
  pendingCaptures: Array<{ source: string; text: string }>;
  projectsWithoutNextAction: Array<{ name: string; targetDate: string | null }>;
  upcomingTasks: Array<{ dueDate: string | null; priority: string; title: string }>;
};

function sanitizeText(value: string, maxLength = 240) {
  return value
    .replace(/https?:\/\/\S+/gi, "[link]")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function buildWeeklyReviewPayload(context: WeeklyReviewContext) {
  return {
    agenda: context.agenda.slice(0, 15).map((event) => ({
      start: event.start,
      title: sanitizeText(event.title, 160),
    })),
    completed_tasks: context.completedTasks.slice(0, 30).map((task) => ({
      completed_at: task.completedAt,
      title: sanitizeText(task.title, 180),
    })),
    daily_planning_feedback: context.dailyPlanningFeedback
      .slice(0, 10)
      .map((item) => sanitizeText(item, 180)),
    overdue_tasks: context.overdueTasks.slice(0, 20).map((task) => ({
      due_date: task.dueDate,
      priority: task.priority,
      title: sanitizeText(task.title, 180),
    })),
    pending_captures: context.pendingCaptures.slice(0, 10).map((capture) => ({
      source: capture.source,
      text: sanitizeText(capture.text),
    })),
    projects_without_next_action: context.projectsWithoutNextAction
      .slice(0, 10)
      .map((project) => ({
        name: sanitizeText(project.name, 160),
        target_date: project.targetDate,
      })),
    upcoming_tasks: context.upcomingTasks.slice(0, 20).map((task) => ({
      due_date: task.dueDate,
      priority: task.priority,
      title: sanitizeText(task.title, 180),
    })),
  };
}

export function parseAIWeeklyReview(value: unknown) {
  const result = aiWeeklyReviewSchema.safeParse(value);
  return result.success
    ? ({ ok: true, review: result.data } as const)
    : ({ ok: false } as const);
}

export type WeeklyReviewAIState =
  | { status: "idle" }
  | { message: string; status: "error" }
  | { review: AIWeeklyReview; status: "ready" };

export const initialWeeklyReviewAIState: WeeklyReviewAIState = {
  status: "idle",
};
