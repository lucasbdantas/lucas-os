import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList, type TaskListItem } from "@/components/tasks/task-list";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import { getGmailActionInboxForUser } from "@/lib/integrations/google/gmail";
import { sendGmailMessageToCapture } from "@/lib/integrations/google/gmail-actions";
import {
  describeGmailFilters,
  gmailInboxPeriods,
  gmailInboxPresets,
  normalizeGmailInboxFilters,
  type GmailInboxFilters,
  type GmailInboxPreset,
} from "@/lib/integrations/google/gmail-filters";
import { requireSession } from "@/lib/supabase/require-session";

type InboxPageProps = {
  searchParams: Promise<{
    account?: string;
    attachment?: string;
    error?: string;
    label?: string;
    notice?: string;
    period?: string;
    preset?: string;
    q?: string;
    unread?: string;
  }>;
};

type DomainRow = {
  id: string;
  name: string;
  is_system: boolean;
};

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  due_date: string | null;
  due_time: string | null;
  priority: string;
  energy_required: string | null;
  context: string | null;
  domain_id: string;
  project_id: string | null;
  recurrence_type: string;
  reminder_offsets: number[];
};

function GmailLabels({ labels }: { labels: string[] }) {
  if (labels.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {labels.slice(0, 5).map((label) => (
        <StatusBadge key={label} label={label} />
      ))}
    </div>
  );
}

function buildInboxHref(
  filters: GmailInboxFilters,
  overrides: Partial<GmailInboxFilters> = {},
) {
  const nextFilters = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (nextFilters.accountId) {
    params.set("account", nextFilters.accountId);
  }

  if (nextFilters.periodDays !== 14) {
    params.set("period", String(nextFilters.periodDays));
  }

  if (nextFilters.preset !== "all_recent") {
    params.set("preset", nextFilters.preset);
  }

  if (nextFilters.unreadOnly && nextFilters.preset !== "unread") {
    params.set("unread", "1");
  }

  if (nextFilters.hasAttachment && nextFilters.preset !== "attachments") {
    params.set("attachment", "1");
  }

  if (nextFilters.label) {
    params.set("label", nextFilters.label);
  }

  if (nextFilters.query) {
    params.set("q", nextFilters.query);
  }

  const queryString = params.toString();
  return queryString ? `/inbox?${queryString}` : "/inbox";
}

function buildPresetHref(filters: GmailInboxFilters, preset: GmailInboxPreset) {
  return buildInboxHref(
    {
      accountId: filters.accountId,
      hasAttachment: false,
      label: null,
      periodDays: filters.periodDays,
      preset,
      query: null,
      unreadOnly: false,
    },
    {},
  );
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const params = await searchParams;
  const { error: pageError, notice } = params;
  const gmailFilters = normalizeGmailInboxFilters(params);
  const activeFilterSummary = describeGmailFilters(gmailFilters);
  const currentInboxHref = buildInboxHref(gmailFilters);
  const { supabase, user } = await requireSession();
  const [gmailInbox, inboxResult] = await Promise.all([
    getGmailActionInboxForUser({
      filters: gmailFilters,
      maxResultsPerAccount: 20,
      supabase,
      userId: user.id,
    }),
    supabase
      .from("domains")
      .select("id,name,is_system")
      .eq("name", "Inbox")
      .eq("is_system", true)
      .maybeSingle<DomainRow>(),
  ]);
  const { data: inbox, error: inboxError } = inboxResult;

  if (inboxError) {
    throw new Error(inboxError.message);
  }

  const { data: tasks, error: tasksError } = inbox
    ? await supabase
        .from("tasks")
        .select(
          "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id,recurrence_type,reminder_offsets,created_at",
        )
        .eq("domain_id", inbox.id)
        .in("status", ["todo", "doing", "waiting"])
        .order("created_at", { ascending: false })
        .returns<TaskRow[]>()
    : { data: [], error: null };

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const inboxTasks: TaskListItem[] = tasks.map((task) => ({
    ...task,
    domainName: "Inbox",
  }));

  return (
    <main className="app-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Operacional"
        title="Inbox"
        description="Emails recentes para acao e captura rapida para itens ainda nao classificados."
      />

      {pageError ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </p>
      ) : null}

      <section className="section-shell mt-8">
        <SectionHeader
          action={
            <Link
              className="soft-button px-3 py-2 text-sm font-semibold"
              href="/settings/integrations"
            >
              Configurar Google
            </Link>
          }
          description="Emails recentes em modo somente leitura, filtrados para reduzir ruido sem modificar sua conta."
          title="Gmail Action Inbox"
        />

        <div className="app-card-muted grid gap-4 p-4">
          <div className="flex flex-wrap gap-2">
            {gmailInboxPresets.map((preset) => {
              const isActive = gmailFilters.preset === preset.value;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "primary-button px-3 py-2 text-sm font-semibold"
                      : "soft-button px-3 py-2 text-sm font-semibold"
                  }
                  href={buildPresetHref(gmailFilters, preset.value)}
                  key={preset.value}
                  title={preset.description}
                >
                  {preset.label}
                </Link>
              );
            })}
          </div>

          <form action="/inbox" className="grid gap-3 lg:grid-cols-6">
            <label className="grid gap-1 text-sm font-medium text-zinc-700 lg:col-span-2">
              Conta
              <select
                className="field-control px-3 py-2 text-sm"
                defaultValue={gmailFilters.accountId ?? ""}
                name="account"
              >
                <option value="">Todas as contas</option>
                {gmailInbox.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountEmail}
                    {account.hasGmailScope ? "" : " (reconectar)"}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Periodo
              <select
                className="field-control px-3 py-2 text-sm"
                defaultValue={String(gmailFilters.periodDays)}
                name="period"
              >
                {gmailInboxPeriods.map((period) => (
                  <option key={period} value={period}>
                    Ultimos {period} dias
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Label
              <select
                className="field-control px-3 py-2 text-sm"
                defaultValue={gmailFilters.label ?? ""}
                name="label"
              >
                <option value="">Todas</option>
                {gmailInbox.availableLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-700 lg:col-span-2">
              Busca simples
              <input
                className="field-control px-3 py-2 text-sm"
                defaultValue={gmailFilters.query ?? ""}
                name="q"
                placeholder="remetente, assunto ou termo"
              />
            </label>

            <div className="flex flex-wrap items-end gap-3 lg:col-span-4">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                <input
                  className="size-4 accent-[var(--emerald)]"
                  defaultChecked={gmailFilters.unreadOnly}
                  name="unread"
                  type="checkbox"
                  value="1"
                />
                Nao lidos
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                <input
                  className="size-4 accent-[var(--emerald)]"
                  defaultChecked={gmailFilters.hasAttachment}
                  name="attachment"
                  type="checkbox"
                  value="1"
                />
                Com anexo
              </label>
            </div>

            <div className="flex flex-wrap items-end justify-start gap-2 lg:col-span-2 lg:justify-end">
              <button className="primary-button px-4 py-2 text-sm font-semibold">
                Aplicar filtros
              </button>
              <Link className="ghost-button px-4 py-2 text-sm font-semibold" href="/inbox">
                Limpar
              </Link>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
            <span>Filtro ativo:</span>
            <StatusBadge label={activeFilterSummary} tone="blue" />
          </div>
        </div>

        {gmailInbox.connectedAccountCount === 0 ? (
          <EmptyState
            description="Conecte uma conta Google em Settings para usar Gmail."
            title="Nenhuma conta Google conectada"
          />
        ) : null}

        {gmailInbox.reconnectAccountEmails.length > 0 ? (
          <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Reconecte {gmailInbox.reconnectAccountEmails.join(", ")} para
            conceder acesso somente leitura ao Gmail.
          </div>
        ) : null}

        {gmailInbox.warnings.length > 0 ? (
          <div className="app-card-muted mb-3 p-3 text-sm text-zinc-600">
            Algumas contas Google nao puderam carregar emails agora. A Inbox
            operacional continua funcionando.
          </div>
        ) : null}

        {gmailInbox.connectedAccountCount > 0 &&
        gmailInbox.messages.length === 0 ? (
          <EmptyState
            description={`Nenhum email encontrado para: ${activeFilterSummary}. Limpe filtros ou amplie o periodo.`}
            title="Nenhum email recente encontrado"
          />
        ) : null}

        {gmailInbox.messages.length > 0 ? (
          <div className="grid gap-3">
            {gmailInbox.messages.map((message) => (
              <article
                className="email-card app-card-interactive p-4"
                key={`${message.accountId}:${message.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-zinc-950">
                        {message.subject}
                      </h3>
                      <StatusBadge label={message.accountEmail} tone="blue" />
                    </div>
                    <div className="mt-2 grid gap-1 text-sm leading-6 text-zinc-600">
                      <p>De: {message.from}</p>
                      <p>
                        Data:{" "}
                        {formatDateTime(
                          message.date,
                          "Sem data",
                          "America/Sao_Paulo",
                        )}
                      </p>
                      {message.snippet ? <p>{message.snippet}</p> : null}
                    </div>
                    <GmailLabels labels={message.labelIds} />
                    {message.hasAttachment ? (
                      <div className="mt-2">
                        <StatusBadge label="Com anexo" tone="amber" />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      className="soft-button px-3 py-2 text-sm font-semibold"
                      href={message.gmailUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Abrir no Gmail
                    </a>
                    <form action={sendGmailMessageToCapture}>
                      <input
                        name="returnTo"
                        type="hidden"
                        value={currentInboxHref}
                      />
                      <input
                        name="accountEmail"
                        type="hidden"
                        value={message.accountEmail}
                      />
                      <input name="from" type="hidden" value={message.from} />
                      <input
                        name="subject"
                        type="hidden"
                        value={message.subject}
                      />
                      <input
                        name="date"
                        type="hidden"
                        value={message.date ?? ""}
                      />
                      <input
                        name="gmailUrl"
                        type="hidden"
                        value={message.gmailUrl}
                      />
                      <input
                        name="snippet"
                        type="hidden"
                        value={message.snippet ?? ""}
                      />
                      <button className="primary-button px-3 py-2 text-sm font-semibold">
                        Enviar para Capture
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-10">
        {inbox ? (
          <TaskForm
            compact
            defaultDomainId={inbox.id}
            domains={[inbox]}
            returnTo="/inbox"
          />
        ) : (
          <EmptyState
            title="Inbox nao encontrada"
            description="Rode o seed inicial para criar o dominio system Inbox."
          />
        )}
      </section>

      <section className="section-shell mt-10">
        <SectionHeader
          description="Tarefas abertas que ainda moram no dominio system Inbox."
          title="Itens abertos da Inbox operacional"
        />
        <TaskList
          emptyDescription="Nada pendente no dominio Inbox por enquanto."
          emptyTitle="Inbox vazia"
          returnTo="/inbox"
          tasks={inboxTasks}
        />
      </section>
    </main>
  );
}
