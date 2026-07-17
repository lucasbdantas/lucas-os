import {
  googleCalendarReadonlyScope,
  googleGmailReadonlyScope,
} from "../integrations/google/connected-account";

export type HealthTone = "good" | "needs_attention" | "optional";

export type SystemHealthCheck = {
  actionHref?: string;
  detail: string;
  label: string;
  status: string;
  tone: HealthTone;
};

export function hasScope(accounts: Array<{ scopes: unknown }>, scope: string) {
  return accounts.some(
    (account) => Array.isArray(account.scopes) && account.scopes.includes(scope),
  );
}

export function buildSystemHealthChecks(input: {
  activeGoogleAccounts: Array<{ scopes: unknown }>;
  authReady: boolean;
  backupReady: boolean;
  dailyPlanningTablesReady: boolean;
  openAIConfigured: boolean;
  pushConfigured: boolean;
  schedulerConfigured: boolean;
  supabaseReady: boolean;
}) {
  const calendarReady = hasScope(
    input.activeGoogleAccounts,
    googleCalendarReadonlyScope,
  );
  const gmailReady = hasScope(
    input.activeGoogleAccounts,
    googleGmailReadonlyScope,
  );

  return [
    check("Supabase", input.supabaseReady, "Conexão de dados disponível", "/settings"),
    check("Auth", input.authReady, "Sessão autenticada por cookies", "/settings"),
    check("Google Calendar", calendarReady, "Escopo read-only", "/settings/integrations"),
    check("Gmail", gmailReady, "Escopo read-only", "/settings/integrations"),
    optionalCheck("OpenAI", input.openAIConfigured, "Preview e planejamento assistido", "/settings/health#setup"),
    check("Web Push", input.pushConfigured, "VAPID server-side", "/settings/notifications"),
    check("Scheduler", input.schedulerConfigured, "CRON_SECRET configurado", "/settings/notifications"),
    check("Backup export", input.backupReady, "Export autenticado disponível", "/settings/backup"),
    {
      actionHref: "/planning",
      detail: input.dailyPlanningTablesReady
        ? "Tabelas dedicadas disponíveis"
        : "Modo compatibilidade via app_settings",
      label: "Daily Planning",
      status: input.dailyPlanningTablesReady ? "tabelas" : "compatibilidade",
      tone: input.dailyPlanningTablesReady ? "good" : "optional",
    } satisfies SystemHealthCheck,
  ];
}

function check(
  label: string,
  ready: boolean,
  detail: string,
  actionHref: string,
): SystemHealthCheck {
  return {
    actionHref,
    detail,
    label,
    status: ready ? "ok" : "configurar",
    tone: ready ? "good" : "needs_attention",
  };
}

function optionalCheck(
  label: string,
  ready: boolean,
  detail: string,
  actionHref: string,
): SystemHealthCheck {
  return {
    actionHref,
    detail,
    label,
    status: ready ? "ok" : "opcional",
    tone: ready ? "good" : "optional",
  };
}

export type SetupChecklistItem = {
  complete: boolean;
  description: string;
  href: string;
  label: string;
};

export function buildSetupChecklist(input: {
  backupReady: boolean;
  calendarReady: boolean;
  dailyPlanCreated: boolean;
  gmailReady: boolean;
  googleConnected: boolean;
  openAIConfigured: boolean;
  pushReady: boolean;
  schedulerReady: boolean;
}): SetupChecklistItem[] {
  return [
    item("Conectar Google", "Conta OAuth ativa", "/settings/integrations", input.googleConnected),
    item("Ativar Gmail", "Conceder Gmail read-only", "/settings/integrations", input.gmailReady),
    item("Ativar Calendar", "Conceder Calendar read-only", "/settings/integrations", input.calendarReady),
    item("Configurar push", "Registrar ao menos um dispositivo", "/settings/notifications", input.pushReady),
    item("Configurar scheduler", "Definir CRON_SECRET e cron", "/settings/notifications", input.schedulerReady),
    item("Configurar OpenAI", "Opcional para recursos assistidos", "/settings/health", input.openAIConfigured),
    item("Fazer primeiro backup", "Export JSON disponível", "/settings/backup", input.backupReady),
    item("Gerar primeiro plano", "Plano diário salvo ou em compatibilidade", "/today", input.dailyPlanCreated),
  ];
}

function item(
  label: string,
  description: string,
  href: string,
  complete: boolean,
): SetupChecklistItem {
  return { complete, description, href, label };
}
