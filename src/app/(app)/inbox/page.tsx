import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList, type TaskListItem } from "@/components/tasks/task-list";
import { requireSession } from "@/lib/supabase/require-session";

type InboxPageProps = {
  searchParams: Promise<{
    error?: string;
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

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const { error: pageError } = await searchParams;
  const { supabase } = await requireSession();
  const { data: inbox, error: inboxError } = await supabase
    .from("domains")
    .select("id,name,is_system")
    .eq("name", "Inbox")
    .eq("is_system", true)
    .maybeSingle<DomainRow>();

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
        description="Captura manual rápida para itens ainda não classificados."
      />

      {pageError ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </p>
      ) : null}

      <section className="mt-8">
        {inbox ? (
          <TaskForm
            compact
            defaultDomainId={inbox.id}
            domains={[inbox]}
            returnTo="/inbox"
          />
        ) : (
          <EmptyState
            title="Inbox não encontrada"
            description="Rode o seed inicial para criar o domínio system Inbox."
          />
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-zinc-950">Itens abertos</h2>
        <TaskList
          emptyDescription="Nada pendente no domínio Inbox por enquanto."
          emptyTitle="Inbox vazia"
          returnTo="/inbox"
          tasks={inboxTasks}
        />
      </section>
    </main>
  );
}
