import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarLanesForm } from "@/components/settings/calendar-lanes-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import { getCalendarLanePreferencesForUser } from "@/lib/integrations/google/calendar-lane-settings";
import { hasGoogleCalendarReadonlyScope } from "@/lib/integrations/google/calendar-events";
import { getGoogleCalendarSourcesForUser } from "@/lib/integrations/google/calendar";
import { hasGoogleGmailReadonlyScope } from "@/lib/integrations/google/gmail-messages";
import { requireSession } from "@/lib/supabase/require-session";

type ConnectedAccountListItem = {
  account_email: string;
  created_at: string;
  display_name: string | null;
  expires_at: string | null;
  id: string;
  last_sync_at: string | null;
  provider: "google";
  scopes: string[];
  status: "active" | "revoked" | "error";
};

type IntegrationsPageProps = {
  searchParams: Promise<{
    connected?: string;
    calendar_lanes?: string;
    disconnected?: string;
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  google_account_missing: "Conta Google não encontrada para desconectar.",
  google_callback_invalid: "Callback do Google invalido. Tente conectar de novo.",
  google_connect_failed: "Não foi possível conectar a conta Google.",
  google_disconnect_failed: "Não foi possível desconectar a conta Google.",
  google_env_missing:
    "Configuração Google OAuth incompleta no ambiente do servidor.",
  google_oauth_denied: "Conexão Google cancelada ou recusada.",
  google_state_invalid:
    "Sessão de conexão Google expirada ou inválida. Tente novamente.",
  google_token_missing: "O Google não retornou um token de acesso.",
};

function statusTone(status: ConnectedAccountListItem["status"]) {
  if (status === "active") {
    return "green" as const;
  }

  if (status === "error") {
    return "red" as const;
  }

  return "default" as const;
}

export default async function IntegrationsPage({
  searchParams,
}: IntegrationsPageProps) {
  const params = await searchParams;
  const { supabase, user } = await requireSession();
  const [connectedAccountsResult, calendarLanePreferences, calendarSources] =
    await Promise.all([
      supabase
        .from("connected_accounts")
        .select(
          "id,provider,account_email,display_name,scopes,status,expires_at,last_sync_at,created_at",
        )
        .eq("provider", "google")
        .order("created_at", { ascending: false })
        .returns<ConnectedAccountListItem[]>(),
      getCalendarLanePreferencesForUser(supabase, user.id),
      getGoogleCalendarSourcesForUser({ supabase, userId: user.id }),
    ]);

  if (connectedAccountsResult.error) {
    throw new Error(connectedAccountsResult.error.message);
  }

  return (
    <main className="app-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Configurações"
        title="Integrações"
        description="Conecte contas externas com tokens criptografados no servidor. Google Calendar e Gmail usam acesso somente leitura."
      />

      <div className="mt-4">
        <Link className="text-sm font-medium text-zinc-700 underline" href="/settings">
          Voltar para Configurações
        </Link>
      </div>

      {params.connected === "google" ? (
        <p className="feedback-panel mt-6 max-w-4xl" data-tone="success" role="status">
          Conta Google conectada.
        </p>
      ) : null}

      {params.disconnected === "google" ? (
        <p className="feedback-panel mt-6 max-w-4xl" data-tone="success" role="status">
          Conta Google desconectada.
        </p>
      ) : null}

      {params.calendar_lanes === "saved" ? (
        <p className="feedback-panel mt-6 max-w-4xl" data-tone="success" role="status">
          Preferências de calendários salvas.
        </p>
      ) : null}

      {params.error ? (
        <p className="feedback-panel mt-6 max-w-4xl" data-tone="danger" role="alert">
          {errorMessages[params.error] ?? "Erro ao processar a integração."}
        </p>
      ) : null}

      <section className="app-card mt-8 max-w-4xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-zinc-950">Google</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Fundação OAuth para múltiplas contas. O Calendar somente leitura está
              disponivel; Gmail read-only alimenta a Action Inbox sem modificar
              emails.
            </p>
          </div>

          <Link
              className="primary-button inline-flex px-4 py-2 text-sm font-semibold"
            href="/api/integrations/google/start"
          >
            Conectar Google
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          {connectedAccountsResult.data.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
              Nenhuma conta Google conectada ainda.
            </div>
          ) : null}

          {connectedAccountsResult.data.map((account) => (
            <article
              className="app-card-muted p-4"
              key={account.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-zinc-950">
                    {account.display_name || account.account_email}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    {account.account_email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    label={account.status}
                    tone={statusTone(account.status)}
                  />
                  {hasGoogleCalendarReadonlyScope(account.scopes) ? (
                    <StatusBadge label="Calendar read-only" tone="green" />
                  ) : (
                    <StatusBadge label="reconectar para Calendar" tone="amber" />
                  )}
                  {hasGoogleGmailReadonlyScope(account.scopes) ? (
                    <StatusBadge label="Gmail read-only" tone="green" />
                  ) : (
                    <StatusBadge label="reconectar para Gmail" tone="amber" />
                  )}
                </div>
              </div>

              {!hasGoogleCalendarReadonlyScope(account.scopes) &&
              account.status !== "revoked" ? (
                <p className="feedback-panel mt-3" data-tone="warning">
                  Esta conta foi conectada antes do escopo Calendar. Clique em
                  Conectar Google novamente e escolha esta conta para conceder
                  acesso somente leitura.
                </p>
              ) : null}

              {!hasGoogleGmailReadonlyScope(account.scopes) &&
              account.status !== "revoked" ? (
                <p className="feedback-panel mt-3" data-tone="warning">
                  Esta conta ainda não concedeu Gmail somente leitura. Clique em
                  Conectar Google novamente e escolha esta conta para habilitar a
                  Action Inbox.
                </p>
              ) : null}

              <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <dt className="font-medium text-zinc-500">Escopos</dt>
                  <dd className="mt-1 text-zinc-800">
                    {account.scopes.length > 0
                      ? account.scopes.join(", ")
                      : "Sem escopos registrados"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Criada em</dt>
                  <dd className="mt-1 text-zinc-800">
                    {formatDateTime(account.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Expira em</dt>
                  <dd className="mt-1 text-zinc-800">
                    {formatDateTime(account.expires_at, "Sem expiração")}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Ultima sync</dt>
                  <dd className="mt-1 text-zinc-800">
                    {formatDateTime(account.last_sync_at, "Nunca sincronizada")}
                  </dd>
                </div>
              </dl>

              {account.status !== "revoked" ? (
                <form
                  action="/api/integrations/google/disconnect"
                  className="mt-4"
                  method="post"
                >
                  <input name="accountId" type="hidden" value={account.id} />
                  <button className="danger-button min-h-11 px-3 py-2 text-sm font-semibold">
                    Desconectar
                  </button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="app-card mt-8 max-w-4xl p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-zinc-950">
              Calendários no Hoje
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Separe calendários principais, contexto/interesses e ocultos sem
              editar nada no Google.
            </p>
          </div>
          <StatusBadge label="app_settings" tone="blue" />
        </div>

        {calendarSources.warnings.length > 0 ? (
          <div className="feedback-panel mb-4" data-tone="warning">
            Algumas contas não puderam carregar calendários agora. Contas antigas
            podem precisar reconectar para conceder Calendar read-only.
          </div>
        ) : null}

        <CalendarLanesForm
          preferences={calendarLanePreferences}
          sources={calendarSources.sources}
        />
      </section>
    </main>
  );
}
