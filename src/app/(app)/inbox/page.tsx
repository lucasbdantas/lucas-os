import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList, type TaskListItem } from "@/components/tasks/task-list";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import { getGmailActionInboxForUser } from "@/lib/integrations/google/gmail";
import { sendGmailMessageToCapture } from "@/lib/integrations/google/gmail-actions";
import { requireSession } from "@/lib/supabase/require-session";

type InboxPageProps = {
  searchParams: Promise<{
    error?: string;
    notice?: string;
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

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const { error: pageError, notice } = await searchParams;
  const { supabase, user } = await requireSession();
  const [gmailInbox, inboxResult] = await Promise.all([
    getGmailActionInboxForUser({
      maxResultsPerAccount: 10,
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
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Inbox"
        description="Emails recentes para acao e captura rapida para itens ainda nao classificados."
      />

      {pageError ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </p>
      ) : null}

      {notice ? (
        <p className="mt-6 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </p>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-zinc-950">
              Gmail Action Inbox
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Emails recentes dos ultimos 14 dias, em modo somente leitura.
            </p>
          </div>
          <Link
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            href="/settings/integrations"
          >
            Configurar Google
          </Link>
        </div>

        {gmailInbox.connectedAccountCount === 0 ? (
          <EmptyState
            description="Conecte uma conta Google em Settings para usar Gmail."
            title="Nenhuma conta Google conectada"
          />
        ) : null}

        {gmailInbox.reconnectAccountEmails.length > 0 ? (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Reconecte {gmailInbox.reconnectAccountEmails.join(", ")} para
            conceder acesso somente leitura ao Gmail.
          </div>
        ) : null}

        {gmailInbox.warnings.length > 0 ? (
          <div className="mb-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            Algumas contas Google nao puderam carregar emails agora. A Inbox
            operacional continua funcionando.
          </div>
        ) : null}

        {gmailInbox.connectedAccountCount > 0 &&
        gmailInbox.messages.length === 0 ? (
          <EmptyState
            description="Nenhum email recente encontrado ou nenhuma conta com escopo Gmail read-only."
            title="Nenhum email recente encontrado"
          />
        ) : null}

        {gmailInbox.messages.length > 0 ? (
          <div className="grid gap-3">
            {gmailInbox.messages.map((message) => (
              <article
                className="rounded-md border border-zinc-200 bg-white p-4"
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
                    <div className="mt-2 grid gap-1 text-sm text-zinc-600">
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
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      href={message.gmailUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Abrir no Gmail
                    </a>
                    <form action={sendGmailMessageToCapture}>
                      <input name="returnTo" type="hidden" value="/inbox" />
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
                      <button className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800">
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

      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-zinc-950">
          Itens abertos da Inbox operacional
        </h2>
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
