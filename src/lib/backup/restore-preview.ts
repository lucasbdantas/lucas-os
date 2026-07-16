import { z } from "zod";
import {
  backupExportVersion,
  findSensitiveKeys,
  type JsonRecord,
} from "./export-sanitizers";

export const restorableEntityNames = [
  "domains",
  "projects",
  "tasks",
  "milestones",
  "app_settings",
] as const;

export type RestorableEntityName = (typeof restorableEntityNames)[number];

const recordArray = z.array(z.record(z.string(), z.unknown())).max(10_000);

const backupRestoreSchema = z
  .object({
    export_version: z.literal(backupExportVersion),
    exported_at: z.string().min(1),
    user_id: z.string().min(1),
    data: z
      .object({
        app_settings: recordArray,
        domains: recordArray,
        milestones: recordArray,
        projects: recordArray,
        tasks: recordArray,
      })
      .passthrough(),
  })
  .passthrough();

export type BackupRestoreInput = z.infer<typeof backupRestoreSchema>;

export type ExistingRestoreKeys = Record<RestorableEntityName, Set<string>>;

export type RestoreEntityPreview = {
  create: number;
  invalid: number;
  total: number;
  update: number;
};

export type BackupRestorePreview = {
  entities: Record<RestorableEntityName, RestoreEntityPreview>;
  excludedEntities: string[];
  exportedAt: string;
  warnings: string[];
};

function readString(row: JsonRecord, key: string) {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getRestoreIdentity(
  entity: RestorableEntityName,
  row: JsonRecord,
) {
  const id = readString(row, "id");

  if (entity === "app_settings") {
    const key = readString(row, "key");
    return key ? `key:${key}` : null;
  }

  if (id) return `id:${id}`;

  if (entity === "domains") {
    const name = readString(row, "name");
    return name ? `name:${name.toLocaleLowerCase("pt-BR")}` : null;
  }

  if (entity === "projects") {
    const domainId = readString(row, "domain_id");
    const name = readString(row, "name");
    return domainId && name
      ? `domain-name:${domainId}:${name.toLocaleLowerCase("pt-BR")}`
      : null;
  }

  return null;
}

export function parseBackupRestoreJson(rawJson: string): BackupRestoreInput {
  if (rawJson.length > 5_000_000) {
    throw new Error("O arquivo excede o limite seguro de 5 MB.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("O arquivo não contém JSON válido.");
  }

  const sensitiveKeys = findSensitiveKeys(parsed);

  if (sensitiveKeys.length > 0) {
    throw new Error("O arquivo contém campos sensíveis e foi bloqueado.");
  }

  const result = backupRestoreSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error("O arquivo não corresponde ao formato de backup do Lucas OS.");
  }

  return result.data;
}

export function buildBackupRestorePreview(
  backup: BackupRestoreInput,
  existing: ExistingRestoreKeys,
): BackupRestorePreview {
  const entities = Object.fromEntries(
    restorableEntityNames.map((entity) => {
      const rows = backup.data[entity];
      let create = 0;
      let invalid = 0;
      let update = 0;

      for (const row of rows) {
        const identity = getRestoreIdentity(entity, row);

        if (!identity) {
          invalid += 1;
        } else if (existing[entity].has(identity)) {
          update += 1;
        } else {
          create += 1;
        }
      }

      return [entity, { create, invalid, total: rows.length, update }];
    }),
  ) as Record<RestorableEntityName, RestoreEntityPreview>;

  return {
    entities,
    excludedEntities: [
      "capture_tokens",
      "connected_accounts",
      "notifications",
      "pending_captures",
      "push_subscriptions",
    ],
    exportedAt: backup.exported_at,
    warnings: [
      "Este é apenas um preview: nenhuma linha foi gravada.",
      "O user_id do arquivo nunca será usado como dono no ambiente de destino.",
      "Tokens, integrações, autenticação e secrets nunca entram no restore.",
      "Conflitos serão preservados para revisão humana; nada será apagado.",
    ],
  };
}
