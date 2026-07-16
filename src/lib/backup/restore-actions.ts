"use server";

import {
  buildBackupRestorePreview,
  getRestoreIdentity,
  parseBackupRestoreJson,
  type BackupRestorePreview,
  type ExistingRestoreKeys,
} from "@/lib/backup/restore-preview";
import { requireSession } from "@/lib/supabase/require-session";

export type BackupRestorePreviewState = {
  message: string;
  ok: boolean;
  preview: BackupRestorePreview | null;
};

export async function previewBackupRestore(
  rawJson: string,
): Promise<BackupRestorePreviewState> {
  try {
    const backup = parseBackupRestoreJson(rawJson);
    const { supabase, user } = await requireSession();
    const [domains, projects, tasks, milestones, appSettings] =
      await Promise.all([
        supabase.from("domains").select("id,name").eq("user_id", user.id),
        supabase
          .from("projects")
          .select("id,name,domain_id")
          .eq("user_id", user.id),
        supabase.from("tasks").select("id").eq("user_id", user.id),
        supabase.from("milestones").select("id").eq("user_id", user.id),
        supabase.from("app_settings").select("key").eq("user_id", user.id),
      ]);
    const firstError = [domains, projects, tasks, milestones, appSettings].find(
      (result) => result.error,
    )?.error;

    if (firstError) {
      return {
        message: "Não foi possível comparar o backup com os dados atuais.",
        ok: false,
        preview: null,
      };
    }

    const existing: ExistingRestoreKeys = {
      app_settings: new Set(
        (appSettings.data ?? [])
          .map((row) => getRestoreIdentity("app_settings", row))
          .filter((value): value is string => Boolean(value)),
      ),
      domains: new Set(
        (domains.data ?? [])
          .flatMap((row) => [
            getRestoreIdentity("domains", row),
            row.name
              ? `name:${row.name.toLocaleLowerCase("pt-BR")}`
              : null,
          ])
          .filter((value): value is string => Boolean(value)),
      ),
      milestones: new Set(
        (milestones.data ?? [])
          .map((row) => getRestoreIdentity("milestones", row))
          .filter((value): value is string => Boolean(value)),
      ),
      projects: new Set(
        (projects.data ?? [])
          .flatMap((row) => [
            getRestoreIdentity("projects", row),
            row.domain_id && row.name
              ? `domain-name:${row.domain_id}:${row.name.toLocaleLowerCase("pt-BR")}`
              : null,
          ])
          .filter((value): value is string => Boolean(value)),
      ),
      tasks: new Set(
        (tasks.data ?? [])
          .map((row) => getRestoreIdentity("tasks", row))
          .filter((value): value is string => Boolean(value)),
      ),
    };

    return {
      message: "Preview concluído. Nenhum dado foi gravado.",
      ok: true,
      preview: buildBackupRestorePreview(backup, existing),
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível validar este backup.",
      ok: false,
      preview: null,
    };
  }
}
