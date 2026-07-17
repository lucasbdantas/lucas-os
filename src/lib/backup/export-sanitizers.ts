export const backupExportVersion = "lucas-os.backup.v1";

export type JsonRecord = Record<string, unknown>;

export type SafeCaptureTokenExport = {
  created_at: string | null;
  last_used_at: string | null;
  name: string | null;
  revoked_at: string | null;
  token_prefix: string | null;
};

export type SafeConnectedAccountExport = {
  account_email: string | null;
  created_at: string | null;
  display_name: string | null;
  last_sync_at: string | null;
  provider: string | null;
  scopes: unknown[];
  status: string | null;
  updated_at: string | null;
};

export type LucasOsBackupExport = {
  app_version: string;
  data: {
    app_settings: JsonRecord[];
    capture_tokens: SafeCaptureTokenExport[];
    connected_accounts: SafeConnectedAccountExport[];
    content_items: JsonRecord[];
    content_notes: JsonRecord[];
    domains: JsonRecord[];
    milestones: JsonRecord[];
    notifications: JsonRecord[];
    pending_captures: JsonRecord[];
    projects: JsonRecord[];
    tasks: JsonRecord[];
  };
  export_version: typeof backupExportVersion;
  exported_at: string;
  user_id: string;
};

export type LucasOsBackupExportInput = Omit<
  LucasOsBackupExport,
  "data" | "export_version"
> & {
  data: {
    app_settings?: JsonRecord[];
    capture_tokens?: JsonRecord[];
    connected_accounts?: JsonRecord[];
    content_items?: JsonRecord[];
    content_notes?: JsonRecord[];
    domains?: JsonRecord[];
    milestones?: JsonRecord[];
    notifications?: JsonRecord[];
    pending_captures?: JsonRecord[];
    projects?: JsonRecord[];
    tasks?: JsonRecord[];
  };
};

const sensitiveKeyFragments = [
  "access_token",
  "api_key",
  "authorization",
  "database_url",
  "encryption_key",
  "openai_api_key",
  "refresh_token",
  "secret",
  "service_role",
  "token_encrypted",
  "token_hash",
];

function safeString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function safeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function sanitizeCaptureTokenForExport(
  token: JsonRecord,
): SafeCaptureTokenExport {
  return {
    created_at: safeString(token.created_at),
    last_used_at: safeString(token.last_used_at),
    name: safeString(token.name),
    revoked_at: safeString(token.revoked_at),
    token_prefix: safeString(token.token_prefix),
  };
}

export function sanitizeConnectedAccountForExport(
  account: JsonRecord,
): SafeConnectedAccountExport {
  return {
    account_email: safeString(account.account_email),
    created_at: safeString(account.created_at),
    display_name: safeString(account.display_name),
    last_sync_at: safeString(account.last_sync_at),
    provider: safeString(account.provider),
    scopes: safeArray(account.scopes),
    status: safeString(account.status),
    updated_at: safeString(account.updated_at),
  };
}

export function buildLucasOsBackupExport(
  input: LucasOsBackupExportInput,
): LucasOsBackupExport {
  return {
    app_version: input.app_version,
    data: {
      app_settings: input.data.app_settings ?? [],
      capture_tokens: (input.data.capture_tokens ?? []).map(
        sanitizeCaptureTokenForExport,
      ),
      connected_accounts: (input.data.connected_accounts ?? []).map(
        sanitizeConnectedAccountForExport,
      ),
      content_items: input.data.content_items ?? [],
      content_notes: input.data.content_notes ?? [],
      domains: input.data.domains ?? [],
      milestones: input.data.milestones ?? [],
      notifications: input.data.notifications ?? [],
      pending_captures: input.data.pending_captures ?? [],
      projects: input.data.projects ?? [],
      tasks: input.data.tasks ?? [],
    },
    export_version: backupExportVersion,
    exported_at: input.exported_at,
    user_id: input.user_id,
  };
}

export function getBackupExportFileName(date = new Date()) {
  return `lucas-os-export-${date.toISOString().slice(0, 10)}.json`;
}

export function findSensitiveKeys(value: unknown, path = "$"): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findSensitiveKeys(item, `${path}[${index}]`),
    );
  }

  return Object.entries(value as JsonRecord).flatMap(([key, child]) => {
    const normalizedKey = key.toLowerCase();
    const currentPath = `${path}.${key}`;
    const keyIsSensitive = sensitiveKeyFragments.some((fragment) =>
      normalizedKey.includes(fragment),
    );

    return [
      ...(keyIsSensitive ? [currentPath] : []),
      ...findSensitiveKeys(child, currentPath),
    ];
  });
}
