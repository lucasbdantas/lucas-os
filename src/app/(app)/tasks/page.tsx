import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList, type TaskListItem } from "@/components/tasks/task-list";
import { requireSession } from "@/lib/supabase/require-session";

type TasksPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

type DomainRow = {
  id: string;
  name: string;
  is_system: boolean;
};

type ProjectRow = {
  id: string;
  name: string;
  domain_id: string;
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

function decorateTasks(
  tasks: TaskRow[],
  domainNameById: Map<string, string>,
  projectNameById: Map<string, string>,
): TaskListItem[] {
  return tasks.map((task) => ({
    ...task,
    domainName: domainNameById.get(task.domain_id),
    projectName: task.project_id
      ? projectNameById.get(task.project_id)
      : undefined,
  }));
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { error: pageError } = await searchParams;
  const { supabase } = await requireSession();

  const [
    domainsResult,
    projectsResult,
    openTasksResult,
    closedTasksResult,
  ] = await Promise.all([
    supabase
      .from("domains")
      .select("id,name,is_system")
      .eq("active", true)
      .order("is_system", { ascending: false })
      .order("name", { ascending: true })
      .returns<DomainRow[]>(),
    supabase
      .from("projects")
      .select("id,name,domain_id")
      .in("status", ["active", "waiting"])
      .order("name", { ascending: true })
      .returns<ProjectRow[]>(),
    supabase
      .from("tasks")
      .select(
        "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id,created_at",
      )
      .in("status", ["todo", "doing", "waiting"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .returns<TaskRow[]>(),
    supabase
      .from("tasks")
      .select(
        "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id,completed_at",
      )
      .in("status", ["done", "canceled"])
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(10)
      .returns<TaskRow[]>(),
  ]);

  if (domainsResult.error) throw new Error(domainsResult.error.message);
  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (openTasksResult.error) throw new Error(openTasksResult.error.message);
  if (closedTasksResult.error) throw new Error(closedTasksResult.error.message);

  const domainNameById = new Map(
    domainsResult.data.map((domain) => [domain.id, domain.name]),
  );
  const projectNameById = new Map(
    projectsResult.data.map((project) => [project.id, project.name]),
  );
  const projectOptions = projectsResult.data.map((project) => ({
    ...project,
    domainName: domainNameById.get(project.domain_id),
  }));

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Tasks"
        description="Criação manual mínima e leitura real via Supabase Auth + RLS."
      />

      {pageError ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </p>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold text-zinc-950">Nova tarefa</h2>
          <StatusBadge label="manual" />
        </div>
        <TaskForm
          domains={domainsResult.data}
          projects={projectOptions}
          returnTo="/tasks"
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-zinc-950">Tarefas abertas</h2>
        <TaskList
          emptyDescription="Crie uma tarefa acima para começar a validar o fluxo manual."
          emptyTitle="Nenhuma tarefa aberta"
          returnTo="/tasks"
          tasks={decorateTasks(
            openTasksResult.data,
            domainNameById,
            projectNameById,
          )}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-zinc-950">Fechadas recentes</h2>
        <TaskList
          emptyDescription="Tarefas concluídas ou canceladas aparecerão aqui."
          emptyTitle="Nenhuma tarefa fechada recentemente"
          returnTo="/tasks"
          showActions={false}
          tasks={decorateTasks(
            closedTasksResult.data,
            domainNameById,
            projectNameById,
          )}
        />
      </section>
    </main>
  );
}
