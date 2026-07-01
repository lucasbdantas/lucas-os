import { describe, expect, test } from "vitest";
import {
  buildLucasOsBackupExport,
  findSensitiveKeys,
  getBackupExportFileName,
  sanitizeCaptureTokenForExport,
  sanitizeConnectedAccountForExport,
} from "./export-sanitizers";

describe("backup export sanitizers", () => {
  test("sanitizes connected accounts without OAuth tokens", () => {
    const exported = sanitizeConnectedAccountForExport({
      access_token_encrypted: "encrypted-access",
      account_email: "lucas@example.com",
      created_at: "2026-07-01T12:00:00.000Z",
      display_name: "Lucas",
      last_sync_at: null,
      provider: "google",
      refresh_token_encrypted: "encrypted-refresh",
      scopes: ["openid", "email"],
      status: "active",
      updated_at: "2026-07-01T12:30:00.000Z",
    });

    expect(exported).toEqual({
      account_email: "lucas@example.com",
      created_at: "2026-07-01T12:00:00.000Z",
      display_name: "Lucas",
      last_sync_at: null,
      provider: "google",
      scopes: ["openid", "email"],
      status: "active",
      updated_at: "2026-07-01T12:30:00.000Z",
    });
    expect(JSON.stringify(exported)).not.toContain("encrypted-access");
    expect(JSON.stringify(exported)).not.toContain("encrypted-refresh");
  });

  test("sanitizes capture tokens without token hash", () => {
    const exported = sanitizeCaptureTokenForExport({
      created_at: "2026-07-01T12:00:00.000Z",
      last_used_at: null,
      name: "Android shortcut",
      revoked_at: null,
      token_hash: "sha256-secret-hash",
      token_prefix: "lcos_1234",
    });

    expect(exported).toEqual({
      created_at: "2026-07-01T12:00:00.000Z",
      last_used_at: null,
      name: "Android shortcut",
      revoked_at: null,
      token_prefix: "lcos_1234",
    });
    expect(JSON.stringify(exported)).not.toContain("sha256-secret-hash");
  });

  test("builds the export structure and keeps sensitive keys out", () => {
    const exported = buildLucasOsBackupExport({
      app_version: "0.1.0",
      exported_at: "2026-07-01T12:00:00.000Z",
      user_id: "user-1",
      data: {
        capture_tokens: [
          {
            name: "Token",
            token_hash: "hash",
            token_prefix: "lcos_abcd",
          },
        ],
        connected_accounts: [
          {
            access_token_encrypted: "encrypted-access",
            account_email: "lucas@example.com",
            provider: "google",
            refresh_token_encrypted: "encrypted-refresh",
            scopes: ["email"],
            status: "active",
          },
        ],
        domains: [{ id: "domain-1", name: "Inbox" }],
      },
    });

    expect(exported.export_version).toBe("lucas-os.backup.v1");
    expect(exported.data.domains).toHaveLength(1);
    expect(exported.data.capture_tokens[0]).not.toHaveProperty("token_hash");
    expect(exported.data.connected_accounts[0]).not.toHaveProperty(
      "access_token_encrypted",
    );
    expect(findSensitiveKeys(exported)).toEqual([]);
  });

  test("detects sensitive keys if a future export leaks them", () => {
    expect(
      findSensitiveKeys({
        ok: true,
        nested: {
          refresh_token_encrypted: "bad",
        },
      }),
    ).toEqual(["$.nested.refresh_token_encrypted"]);
  });

  test("builds readable export file names", () => {
    expect(
      getBackupExportFileName(new Date("2026-07-01T12:00:00.000Z")),
    ).toBe("lucas-os-export-2026-07-01.json");
  });
});
