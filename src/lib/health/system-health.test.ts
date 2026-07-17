import { describe, expect, it } from "vitest";
import {
  buildSetupChecklist,
  buildSystemHealthChecks,
} from "./system-health";
import {
  googleCalendarReadonlyScope,
  googleGmailReadonlyScope,
} from "../integrations/google/connected-account";

describe("system health", () => {
  it("resume integrações sem expor credenciais", () => {
    const checks = buildSystemHealthChecks({
      activeGoogleAccounts: [
        { scopes: [googleCalendarReadonlyScope, googleGmailReadonlyScope] },
      ],
      authReady: true,
      backupReady: true,
      dailyPlanningTablesReady: false,
      openAIConfigured: false,
      pushConfigured: false,
      schedulerConfigured: false,
      supabaseReady: true,
    });

    expect(checks.find((item) => item.label === "Gmail")?.status).toBe("ok");
    expect(checks.find((item) => item.label === "Daily Planning")?.status).toBe(
      "compatibilidade",
    );
    expect(JSON.stringify(checks)).not.toContain("token");
  });

  it("gera checklist com links acionáveis", () => {
    const items = buildSetupChecklist({
      backupReady: true,
      calendarReady: false,
      dailyPlanCreated: false,
      gmailReady: false,
      googleConnected: true,
      openAIConfigured: false,
      pushReady: false,
      schedulerReady: false,
    });

    expect(items).toHaveLength(8);
    expect(items.every((item) => item.href.startsWith("/"))).toBe(true);
  });

  it("mostra tabelas reais quando Daily Planning está disponível", () => {
    const checks = buildSystemHealthChecks({
      activeGoogleAccounts: [],
      authReady: true,
      backupReady: true,
      dailyPlanningTablesReady: true,
      openAIConfigured: false,
      pushConfigured: false,
      schedulerConfigured: false,
      supabaseReady: true,
    });

    expect(checks.find((item) => item.label === "Daily Planning")).toMatchObject({
      detail: "Tabelas dedicadas disponíveis",
      status: "tabelas",
      tone: "good",
    });
  });
});
