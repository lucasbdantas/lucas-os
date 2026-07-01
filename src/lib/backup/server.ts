import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildLucasOsBackupExport,
  findSensitiveKeys,
  type JsonRecord,
  type LucasOsBackupExport,
} from "@/lib/backup/export-sanitizers";

type BackupTableName =
  | "app_settings"
  | "domains"
  | "milestones"
  | "notifications"
  | "pending_captures"
  | "projects"
  | "tasks";

async function selectUserRows(
  supabase: SupabaseClient,
  table: BackupTableName,
  userId: string,
) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .returns<JsonRecord[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getBackupExportForUser(input: {
  appVersion: string;
  exportedAt?: Date;
  supabase: SupabaseClient;
  userId: string;
}): Promise<LucasOsBackupExport> {
  const exportedAt = input.exportedAt ?? new Date();
  const [
    domains,
    projects,
    milestones,
    tasks,
    pendingCaptures,
    notifications,
    appSettings,
    captureTokensResult,
    connectedAccountsResult,
  ] = await Promise.all([
    selectUserRows(input.supabase, "domains", input.userId),
    selectUserRows(input.supabase, "projects", input.userId),
    selectUserRows(input.supabase, "milestones", input.userId),
    selectUserRows(input.supabase, "tasks", input.userId),
    selectUserRows(input.supabase, "pending_captures", input.userId),
    selectUserRows(input.supabase, "notifications", input.userId),
    selectUserRows(input.supabase, "app_settings", input.userId),
    input.supabase
      .from("capture_tokens")
      .select("name,token_prefix,created_at,last_used_at,revoked_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: true })
      .returns<JsonRecord[]>(),
    input.supabase
      .from("connected_accounts")
      .select(
        "provider,account_email,display_name,scopes,status,last_sync_at,created_at,updated_at",
      )
      .eq("user_id", input.userId)
      .order("created_at", { ascending: true })
      .returns<JsonRecord[]>(),
  ]);

  if (captureTokensResult.error) {
    throw new Error(captureTokensResult.error.message);
  }

  if (connectedAccountsResult.error) {
    throw new Error(connectedAccountsResult.error.message);
  }

  const backup = buildLucasOsBackupExport({
    app_version: input.appVersion,
    data: {
      app_settings: appSettings,
      capture_tokens: captureTokensResult.data,
      connected_accounts: connectedAccountsResult.data,
      domains,
      milestones,
      notifications,
      pending_captures: pendingCaptures,
      projects,
      tasks,
    },
    exported_at: exportedAt.toISOString(),
    user_id: input.userId,
  });
  const leakedSensitiveKeys = findSensitiveKeys(backup);

  if (leakedSensitiveKeys.length > 0) {
    throw new Error("Export bloqueado por conter campos sensiveis.");
  }

  return backup;
}
