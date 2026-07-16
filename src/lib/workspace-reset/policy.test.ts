import { describe, expect, it } from "vitest";
import {
  DAILY_PLANNING_APP_SETTING_KEY,
  WORKSPACE_RESET_CONFIRMATION,
  countCompatibilityDailyPlans,
  isValidWorkspaceResetConfirmation,
  isWorkspaceResetDailyTableUnavailable,
  partitionWorkspaceAppSettings,
  preservedWorkspaceData,
  shouldDeleteWorkspaceAppSetting,
  workspaceResetDeletionSteps,
} from "./policy";

describe("workspace reset policy", () => {
  it("mantém uma seleção explícita e ordenada do que apagar", () => {
    expect(workspaceResetDeletionSteps.map((step) => step.table)).toEqual([
      "daily_plan_feedback",
      "daily_plans",
      "push_notification_deliveries",
      "milestones",
      "tasks",
      "projects",
      "pending_captures",
      "notifications",
    ]);
    expect(workspaceResetDeletionSteps.map((step) => step.table)).not.toContain(
      "connected_accounts",
    );
  });

  it("rejeita confirmação inválida", () => {
    expect(isValidWorkspaceResetConfirmation("limpar meu workspace")).toBe(false);
    expect(isValidWorkspaceResetConfirmation(" LIMPAR MEU WORKSPACE ")).toBe(false);
    expect(isValidWorkspaceResetConfirmation(null)).toBe(false);
  });

  it("aceita apenas a confirmação exata", () => {
    expect(isValidWorkspaceResetConfirmation(WORKSPACE_RESET_CONFIRMATION)).toBe(
      true,
    );
  });

  it("só degrada para indisponibilidade em erro real de tabela/schema", () => {
    expect(
      isWorkspaceResetDailyTableUnavailable({
        code: "PGRST205",
        message: "Could not find the table public.daily_plans in the schema cache",
      }),
    ).toBe(true);
    expect(
      isWorkspaceResetDailyTableUnavailable({
        code: "42501",
        message: "permission denied for table daily_plans",
      }),
    ).toBe(false);
  });

  it("preserva configurações e remove somente o fallback diário", () => {
    const partition = partitionWorkspaceAppSettings([
      { key: "app_preferences", value: { theme: "dark" } },
      { key: "notification_preferences_v1", value: { pushEnabled: true } },
      { key: DAILY_PLANNING_APP_SETTING_KEY, value: { plans: [{ id: "p1" }] } },
    ]);

    expect(partition.removed.map((row) => row.key)).toEqual([
      DAILY_PLANNING_APP_SETTING_KEY,
    ]);
    expect(partition.preserved.map((row) => row.key)).toEqual([
      "app_preferences",
      "notification_preferences_v1",
    ]);
    expect(shouldDeleteWorkspaceAppSetting("app_preferences")).toBe(false);
    expect(preservedWorkspaceData).toContain("Preferências do app, tema e timezone");
  });

  it("conta planos no app_settings sem alterar o valor", () => {
    const value = { plans: [{ id: "p1" }, { id: "p2" }], version: 1 };
    expect(countCompatibilityDailyPlans(value)).toBe(2);
    expect(value.plans).toHaveLength(2);
  });
});
