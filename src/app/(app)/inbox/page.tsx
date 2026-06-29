import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/supabase/require-session";

type DomainRow = {
  id: string;
  name: string;
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  priority: string;
};

export default async function InboxPage() {
  const { supabase } = await requireSession();
  const { data: inbox, error: inboxError } = await supabase
    .from("domains")
    .select("id,name")
    .eq("name", "Inbox")
    .eq("is_system", true)
    .maybeSingle<DomainRow>();

  if (inboxError) {
    throw new Error(inboxError.message);
  }

  const { data: tasks, error: tasksError } = inbox
    ? await supabase
        .from("tasks")
        .select("id,title,status,due_date,priority")
        .eq("domain_id", inbox.id)
        .in("status", ["todo", "doing", "waiting"])
        .order("created_at", { ascending: false })
        .returns<TaskRow[]>()
    : { data: [], error: null };

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Inbox"
        description="Itens abertos no domínio Inbox."
      />

      <section className="mt-8">
        {!inbox ? (
          <EmptyState
            title="Inbox não encontrada"
            description="Rode o seed inicial para criar o domínio system Inbox."
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="Inbox vazia"
            description="Nada pendente no domínio Inbox por enquanto."
          />
        ) : (
          <div className="grid gap-3">
            {tasks.map((task) => (
              <article
                className="rounded-md border border-zinc-200 bg-white p-4"
                key={task.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-zinc-950">
                      {task.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      {formatDate(task.due_date)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge label={task.status} tone="blue" />
                    <StatusBadge label={task.priority} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
