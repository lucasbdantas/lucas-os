import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { TaskList, type TaskListItem } from "@/components/tasks/task-list";
import { formatDate, toDateOnly } from "@/lib/format";
import { requireSession } from "@/lib/supabase/require-session";

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  type: string;
  target_date: string | null;
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
};

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

const priorityRank: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

async function getCount(query: PromiseLike<CountResult>) {
  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

function sortPriorityTasks(tasks: TaskRow[]) {
  return [...tasks].sort((first, second) => {
    const priorityDelta =
      (priorityRank[first.priority] ?? 99) -
      (priorityRank[second.priority] ?? 99);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return (first.due_date ?? "9999-12-31").localeCompare(
      second.due_date ?? "9999-12-31",
    );
  });
}

function toTaskListItems(tasks: TaskRow[]): TaskListItem[] {
  return tasks.map((task) => ({ ...task }));
}

export default async function TodayPage() {
  const { supabase } = await requireSession();
  const soon = addDays(new Date(), 7);

  const [
    activeDomainsCount,
    activeOrWaitingProjectsCount,
    openTasksCount,
    dueSoonTasksCount,
    mainProjectsResult,
    inboxResult,
    openTasksResult,
    dueSoonTasksResult,
  ] = await Promise.all([
    getCount(
      supabase
        .from("domains")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
    ),
    getCount(
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .in("status", ["active", "waiting"]),
    ),
    getCount(
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("status", ["todo", "doing", "waiting"]),
    ),
    getCount(
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("status", ["todo", "doing", "waiting"])
        .lte("due_date", toDateOnly(soon)),
    ),
    supabase
      .from("projects")
      .select("id,name,status,type,target_date")
      .in("status", ["active", "waiting"])
      .order("target_date", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true })
      .limit(5)
      .returns<ProjectRow[]>(),
    supabase
      .from("domains")
      .select("id,name")
      .eq("name", "Inbox")
      .eq("is_system", true)
      .maybeSingle<{ id: string; name: string }>(),
    supabase
      .from("tasks")
      .select(
        "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id",
      )
      .in("status", ["todo", "doing", "waiting"])
      .limit(20)
      .returns<TaskRow[]>(),
    supabase
      .from("tasks")
      .select(
        "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id",
      )
      .in("status", ["todo", "doing", "waiting"])
      .lte("due_date", toDateOnly(soon))
      .order("due_date", { ascending: true })
      .limit(5)
      .returns<TaskRow[]>(),
  ]);

  if (mainProjectsResult.error) {
    throw new Error(mainProjectsResult.error.message);
  }

  if (inboxResult.error) {
    throw new Error(inboxResult.error.message);
  }

  if (openTasksResult.error) {
    throw new Error(openTasksResult.error.message);
  }

  if (dueSoonTasksResult.error) {
    throw new Error(dueSoonTasksResult.error.message);
  }

  const inboxOpenTasksCount = inboxResult.data
    ? await getCount(
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("domain_id", inboxResult.data.id)
          .in("status", ["todo", "doing", "waiting"]),
      )
    : 0;

  const priorityTasks = sortPriorityTasks(openTasksResult.data).slice(0, 3);

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Lucas OS"
        title="Today"
        description="Leitura básica do estado operacional usando Supabase Auth e RLS."
      />

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Domínios ativos" value={activeDomainsCount} />
        <StatCard
          label="Projetos ativos/waiting"
          value={activeOrWaitingProjectsCount}
        />
        <StatCard label="Tarefas abertas" value={openTasksCount} />
        <StatCard
          label="Prazos próximos"
          value={dueSoonTasksCount}
          detail="Tarefas abertas vencidas ou nos próximos 7 dias"
        />
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-zinc-950">
              Projetos principais
            </h2>
            <StatusBadge label="até 5" />
          </div>

          {mainProjectsResult.data.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Nenhum projeto ativo"
                description="Rode o seed inicial ou ative projetos para vê-los no Today."
              />
            </div>
          ) : (
            <div className="mt-4 divide-y divide-zinc-100">
              {mainProjectsResult.data.map((project) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                  key={project.id}
                >
                  <div>
                    <p className="font-medium text-zinc-950">{project.name}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {project.type} · {formatDate(project.target_date)}
                    </p>
                  </div>
                  <StatusBadge
                    label={project.status}
                    tone={project.status === "waiting" ? "amber" : "green"}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <h2 className="font-semibold text-zinc-950">Inbox</h2>
          <p className="mt-3 text-3xl font-semibold text-zinc-950">
            {inboxOpenTasksCount}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            {inboxResult.data
              ? inboxOpenTasksCount === 0
                ? "Inbox vazia."
                : "Itens abertos aguardando triagem."
              : "Domínio Inbox não encontrado."}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-zinc-950">
          Top 3 tarefas abertas
        </h2>
        <TaskList
          emptyDescription="Crie tarefas em Tasks ou Inbox para vê-las aqui."
          emptyTitle="Nenhuma tarefa aberta"
          returnTo="/today"
          showActions={false}
          tasks={toTaskListItems(priorityTasks)}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-zinc-950">Deadlines próximos</h2>
        <TaskList
          emptyDescription="Nenhuma tarefa aberta vencida ou com prazo nos próximos 7 dias."
          emptyTitle="Sem deadlines próximos"
          returnTo="/today"
          showActions={false}
          tasks={toTaskListItems(dueSoonTasksResult.data)}
        />
      </section>
    </main>
  );
}
