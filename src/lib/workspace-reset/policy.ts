export const WORKSPACE_RESET_CONFIRMATION = "LIMPAR MEU WORKSPACE";
export const DAILY_PLANNING_APP_SETTING_KEY = "daily_planning_v2";

export const workspaceResetDeletionSteps = [
  { key: "contentNotes", label: "Notas da Biblioteca", table: "content_notes" },
  { key: "contentItems", label: "Conteúdos da Biblioteca", table: "content_items" },
  { key: "dailyPlanFeedback", label: "Feedback de planos", table: "daily_plan_feedback" },
  { key: "dailyPlans", label: "Planos diários", table: "daily_plans" },
  { key: "pushDeliveries", label: "Histórico de entregas push", table: "push_notification_deliveries" },
  { key: "milestones", label: "Milestones", table: "milestones" },
  { key: "tasks", label: "Tasks", table: "tasks" },
  { key: "projects", label: "Projetos", table: "projects" },
  { key: "pendingCaptures", label: "Capturas pendentes", table: "pending_captures" },
  { key: "notifications", label: "Notificações", table: "notifications" },
] as const;

export type WorkspaceResetCountKey =
  | (typeof workspaceResetDeletionSteps)[number]["key"]
  | "compatibilityDailyPlans";

export type WorkspaceResetCounts = Record<WorkspaceResetCountKey, number>;

export const preservedWorkspaceData = [
  "Usuário e autenticação Supabase",
  "Domínios, incluindo Inbox",
  "Preferências do app, tema e timezone",
  "Preferências de notificações e quiet hours",
  "Contas Google e tokens criptografados",
  "Dispositivos push registrados",
  "Tokens de captura externa",
  "Variáveis de ambiente e secrets",
] as const;

export function isValidWorkspaceResetConfirmation(value: unknown) {
  return value === WORKSPACE_RESET_CONFIRMATION;
}

export function isWorkspaceResetDailyTableUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const record = error as {
    code?: unknown;
    details?: unknown;
    hint?: unknown;
    message?: unknown;
  };
  const code = typeof record.code === "string" ? record.code.toUpperCase() : "";
  const message = [record.message, record.details, record.hint]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();
  const referencesDailyPlanning =
    message.includes("daily_plans") || message.includes("daily_plan_feedback");

  return (
    code === "PGRST205" ||
    code === "42P01" ||
    (referencesDailyPlanning &&
      (message.includes("could not find the table") ||
        message.includes("schema cache")))
  );
}

export function shouldDeleteWorkspaceAppSetting(key: string) {
  return key === DAILY_PLANNING_APP_SETTING_KEY;
}

export function partitionWorkspaceAppSettings(
  rows: Array<{ key: string; value: unknown }>,
) {
  return {
    preserved: rows.filter((row) => !shouldDeleteWorkspaceAppSetting(row.key)),
    removed: rows.filter((row) => shouldDeleteWorkspaceAppSetting(row.key)),
  };
}

export function countCompatibilityDailyPlans(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  const plans = (value as Record<string, unknown>).plans;
  return Array.isArray(plans) ? plans.length : 0;
}

export function getWorkspaceResetTotal(counts: WorkspaceResetCounts) {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}
