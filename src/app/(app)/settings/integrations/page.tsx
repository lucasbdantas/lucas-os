import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import { hasGoogleCalendarReadonlyScope } from "@/lib/integrations/google/calendar-events";
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
    disconnected?: string;
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  google_account_missing: "Conta Google nao encontrada para desconectar.",
  google_callback_invalid: "Callback do Google invalido. Tente conectar de novo.",
  google_connect_failed: "Nao foi possivel conectar a conta Google.",
  google_disconnect_failed: "Nao foi possivel desconectar a conta Google.",
  google_env_missing:
    "Configuracao Google OAuth incompleta no ambiente do servidor.",
  google_oauth_denied: "Conexao Google cancelada ou recusada.",
  google_state_invalid:
    "Sessao de conexao Google expirada ou invalida. Tente novamente.",
  google_token_missing: "Google nao retornou token de acesso.",
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
  const { supabase } = await requireSession();
  const { data, error } = await supabase
    .from("connected_accounts")
    .select(
      "id,provider,account_email,display_name,scopes,status,expires_at,last_sync_at,created_at",
    )
    .eq("provider", "google")
    .order("created_at", { ascending: false })
    .returns<ConnectedAccountListItem[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Configuracoes"
        title="Integracoes"
        description="Conecte contas externas com tokens criptografados no servidor. Google Calendar usa acesso somente leitura."
      />

      <div className="mt-4">
        <Link className="text-sm font-medium text-zinc-700 underline" href="/settings">
          Voltar para Settings
        </Link>
      </div>

      {params.connected === "google" ? (
        <p className="mt-6 max-w-4xl rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Conta Google conectada.
        </p>
      ) : null}

      {params.disconnected === "google" ? (
        <p className="mt-6 max-w-4xl rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Conta Google desconectada.
        </p>
      ) : null}

      {params.error ? (
        <p className="mt-6 max-w-4xl rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessages[params.error] ?? "Erro ao processar integracao."}
        </p>
      ) : null}

      <section className="mt-8 max-w-4xl rounded-md border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-zinc-950">Google</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Fundacao OAuth para multiplas contas. Calendar read-only esta
              disponivel; Gmail entra em etapa futura com novo escopo explicito.
            </p>
          </div>

          <Link
            className="inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            href="/api/integrations/google/start"
          >
            Conectar Google
          </Link>
        </div>

        <div className="mt-6 grid gap-3">
          {data.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600">
              Nenhuma conta Google conectada ainda.
            </div>
          ) : null}

          {data.map((account) => (
            <article
              className="rounded-md border border-zinc-200 bg-zinc-50 p-4"
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
                </div>
              </div>

              {!hasGoogleCalendarReadonlyScope(account.scopes) &&
              account.status !== "revoked" ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Esta conta foi conectada antes do escopo Calendar. Clique em
                  Conectar Google novamente e escolha esta conta para conceder
                  acesso somente leitura.
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
                    {formatDateTime(account.expires_at, "Sem expiracao")}
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
                  <button className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                    Desconectar
                  </button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
