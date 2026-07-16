import { describe, expect, it } from "vitest";
import { backupExportVersion } from "./export-sanitizers";
import {
  buildBackupRestorePreview,
  parseBackupRestoreJson,
  restorableEntityNames,
  type ExistingRestoreKeys,
} from "./restore-preview";

function makeBackup() {
  return {
    export_version: backupExportVersion,
    exported_at: "2026-07-16T12:00:00.000Z",
    user_id: "source-user",
    data: {
      app_settings: [{ key: "app_preferences", value: {} }],
      capture_tokens: [{ name: "Phone", token_prefix: "abc123" }],
      connected_accounts: [{ provider: "google" }],
      content_items: [{ id: "content-1", title: "Livro" }],
      content_notes: [{ id: "note-1", content_item_id: "content-1" }],
      domains: [{ id: "domain-1", name: "Inbox" }],
      milestones: [{ id: "milestone-1", title: "M1" }],
      notifications: [],
      pending_captures: [],
      projects: [{ domain_id: "domain-1", name: "Projeto" }],
      tasks: [{ id: "task-1", title: "Task" }],
    },
  };
}

describe("backup restore preview", () => {
  it("valida o formato e classifica criações e atualizações", () => {
    const backup = parseBackupRestoreJson(JSON.stringify(makeBackup()));
    const existing = Object.fromEntries(
      restorableEntityNames.map((name) => [name, new Set<string>()]),
    ) as ExistingRestoreKeys;
    existing.domains.add("id:domain-1");

    const preview = buildBackupRestorePreview(backup, existing);

    expect(preview.entities.domains.update).toBe(1);
    expect(preview.entities.projects.create).toBe(1);
    expect(preview.entities.tasks.create).toBe(1);
    expect(preview.entities.content_items.create).toBe(1);
    expect(preview.entities.content_notes.create).toBe(1);
    expect(preview.excludedEntities).toContain("connected_accounts");
  });

  it("bloqueia campos sensíveis mesmo em estruturas aninhadas", () => {
    const backup = makeBackup();
    backup.data.app_settings = [
      { key: "unsafe", value: { refresh_token: "secret" } },
    ];

    expect(() => parseBackupRestoreJson(JSON.stringify(backup))).toThrow(
      "campos sensíveis",
    );
  });

  it("rejeita JSON inválido e versões desconhecidas", () => {
    expect(() => parseBackupRestoreJson("not-json")).toThrow("JSON válido");
    expect(() =>
      parseBackupRestoreJson(
        JSON.stringify({ ...makeBackup(), export_version: "other" }),
      ),
    ).toThrow("formato de backup");
  });

  it("marca linha sem identidade conservadora como inválida", () => {
    const backup = parseBackupRestoreJson(
      JSON.stringify({
        ...makeBackup(),
        data: { ...makeBackup().data, tasks: [{ title: "Sem id" }] },
      }),
    );
    const existing = Object.fromEntries(
      restorableEntityNames.map((name) => [name, new Set<string>()]),
    ) as ExistingRestoreKeys;

    expect(buildBackupRestorePreview(backup, existing).entities.tasks.invalid).toBe(
      1,
    );
  });
});
