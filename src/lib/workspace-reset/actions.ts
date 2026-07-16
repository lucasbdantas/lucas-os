"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/supabase/require-session";
import {
  DAILY_PLANNING_APP_SETTING_KEY,
  isValidWorkspaceResetConfirmation,
  isWorkspaceResetDailyTableUnavailable,
  workspaceResetDeletionSteps,
} from "@/lib/workspace-reset/policy";

export type WorkspaceResetState = {
  message: string;
  status: "idle" | "error" | "success";
};

export async function resetWorkspace(
  _previousState: WorkspaceResetState,
  formData: FormData,
): Promise<WorkspaceResetState> {
  void _previousState;

  if (!isValidWorkspaceResetConfirmation(formData.get("confirmation"))) {
    return {
      message: "A confirmação não corresponde ao texto solicitado.",
      status: "error",
    };
  }

  const { supabase, user } = await requireSession();
  let skippedUnavailableDailyTables = false;

  for (const step of workspaceResetDeletionSteps) {
    const { error } = await supabase
      .from(step.table)
      .delete()
      .eq("user_id", user.id);

    if (error) {
      const isDailyStep =
        step.table === "daily_plan_feedback" || step.table === "daily_plans";

      if (isDailyStep && isWorkspaceResetDailyTableUnavailable(error)) {
        skippedUnavailableDailyTables = true;
        continue;
      }

      return {
        message: `Não foi possível limpar ${step.label}. Etapas anteriores podem ter sido concluídas; atualize a página antes de tentar novamente.`,
        status: "error",
      };
    }
  }

  const { error: compatibilityError } = await supabase
    .from("app_settings")
    .delete()
    .eq("user_id", user.id)
    .eq("key", DAILY_PLANNING_APP_SETTING_KEY);

  if (compatibilityError) {
    return {
      message:
        "Os dados operacionais foram limpos, mas não foi possível remover o histórico compatível de planos.",
      status: "error",
    };
  }

  for (const path of [
    "/today",
    "/planning",
    "/review",
    "/capture",
    "/inbox",
    "/tasks",
    "/projects",
    "/notifications",
    "/settings/data",
  ]) {
    revalidatePath(path);
  }

  return {
    message: skippedUnavailableDailyTables
      ? "Workspace limpo. As tabelas dedicadas de planejamento estavam indisponíveis, e o histórico compatível foi removido."
      : "Workspace limpo com sucesso. Configurações, integrações e preferências foram preservadas.",
    status: "success",
  };
}
