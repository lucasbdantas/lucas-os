import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DAILY_PLANNING_APP_SETTING_KEY,
  countCompatibilityDailyPlans,
  isWorkspaceResetDailyTableUnavailable,
  type WorkspaceResetCounts,
} from "@/lib/workspace-reset/policy";

type CountResult = {
  count: number | null;
  error: { code?: string; message: string } | null;
};

export type WorkspaceResetPreview = {
  counts: WorkspaceResetCounts;
  dailyPlanningTablesAvailable: boolean;
};

function readRequiredCount(result: CountResult, label: string) {
  if (result.error) {
    throw new Error(`Não foi possível contar ${label}.`);
  }

  return result.count ?? 0;
}

function readOptionalDailyCount(result: CountResult) {
  if (!result.error) return { available: true, count: result.count ?? 0 };
  if (isWorkspaceResetDailyTableUnavailable(result.error)) {
    return { available: false, count: 0 };
  }

  throw new Error("Não foi possível contar o histórico de planejamento.");
}

export async function getWorkspaceResetPreviewForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<WorkspaceResetPreview> {
  const [
    tasks,
    projects,
    milestones,
    pendingCaptures,
    notifications,
    pushDeliveries,
    dailyPlans,
    dailyPlanFeedback,
    compatibility,
  ] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("milestones").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("pending_captures").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("push_notification_deliveries").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("daily_plans").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("daily_plan_feedback").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("app_settings")
      .select("value")
      .eq("user_id", userId)
      .eq("key", DAILY_PLANNING_APP_SETTING_KEY)
      .maybeSingle<{ value: unknown }>(),
  ]);

  if (compatibility.error) {
    throw new Error("Não foi possível conferir o histórico compatível de planos.");
  }

  const dailyPlansCount = readOptionalDailyCount(dailyPlans);
  const dailyFeedbackCount = readOptionalDailyCount(dailyPlanFeedback);

  return {
    counts: {
      compatibilityDailyPlans: countCompatibilityDailyPlans(
        compatibility.data?.value,
      ),
      dailyPlanFeedback: dailyFeedbackCount.count,
      dailyPlans: dailyPlansCount.count,
      milestones: readRequiredCount(milestones, "milestones"),
      notifications: readRequiredCount(notifications, "notificações"),
      pendingCaptures: readRequiredCount(pendingCaptures, "capturas pendentes"),
      projects: readRequiredCount(projects, "projetos"),
      pushDeliveries: readRequiredCount(pushDeliveries, "entregas push"),
      tasks: readRequiredCount(tasks, "tasks"),
    },
    dailyPlanningTablesAvailable:
      dailyPlansCount.available && dailyFeedbackCount.available,
  };
}
