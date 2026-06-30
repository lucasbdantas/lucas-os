import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireSession } from "@/lib/supabase/require-session";

type DomainRow = {
  id: string;
  name: string;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  type: string;
  target_date: string | null;
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
  domain_id: string;
  project_id: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
};

type PendingCaptureRow = {
  id: string;
  raw_text: string;
  source: string;
  captured_at: string;
};

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

const openTaskStatuses = ["todo", "doing", "waiting"];

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

function toSaoPauloDateOnly(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).formatToParts(date);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));

  return `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`;
}

async function getCount(query: PromiseLike<CountResult>) {
  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

function sortByDueDateAndPriority<
  T extends { due_date: string | null; priority: string },
>(rows: T[]) {
  return [...rows].sort((first, second) => {
    const dateDelta = (first.due_date ?? "9999-12-31").localeCompare(
      second.due_date ?? "9999-12-31",
    );

    if (dateDelta !== 0) {
      return dateDelta;
    }

    return (
      (priorityRank[first.priority] ?? 99) -
      (priorityRank[second.priority] ?? 99)
    );
  });
}

function getPriorityTone(priority: string) {
  if (priority === "critical") return "red";
  if (priority === "high") return "amber";
  if (priority === "medium") return "blue";

  return "default";
}

function getProjectTone(status: string) {
  if (status === "active") return "green";
  if (status === "waiting") return "amber";
  if (status === "paused") return "amber";
  if (status === "canceled") return "red";

  return "default";
}

function getTaskEditHref(taskId: string) {
  return `/tasks?edit=${taskId}#edit-task`;
}

function getProjectEditHref(projectId: string) {
  return `/projects?edit=${projectId}#edit-project`;
}

function getNextActionHref(project: Pick<ProjectRow, "id" | "domain_id">) {
  return `/tasks?domain=${project.domain_id}&project=${project.id}#task-form`;
}

function TaskReviewSection({
  description,
  emptyDescription,
  emptyTitle,
  projectNameById,
  domainNameById,
  tasks,
  title,
}: {
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  projectNameById: Map<string, string>;
  domainNameById: Map<string, string>;
  tasks: TaskRow[];
  title: string;
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm text-zinc-600">{description}</p>
        </div>
        <StatusBadge label={`${tasks.length}`} />
      </div>

      {tasks.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <article
              className="rounded-md border border-zinc-200 bg-white p-4"
              key={task.id}
            >
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-zinc-950">
                      {task.title}
                    </h3>
                    <StatusBadge
                      label={task.priority}
                      tone={getPriorityTone(task.priority)}
                    />
                    {task.status !== "todo" ? (
                      <StatusBadge label={task.status} />
                    ) : null}
                  </div>
                  {task.notes ? (
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {task.notes}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                    <span>Data: {formatDate(task.due_date)}</span>
                    {task.due_time ? (
                      <span>Horário: {task.due_time.slice(0, 5)}</span>
                    ) : null}
                    <span>
                      Domínio:{" "}
                      {domainNameById.get(task.domain_id) ?? "Sem domínio"}
                    </span>
                    {task.project_id ? (
                      <span>
                        Projeto:{" "}
                        {projectNameById.get(task.project_id) ?? "Sem projeto"}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Link
                  className="inline-flex items-center justify-center rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  href={getTaskEditHref(task.id)}
                >
                  Editar task
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function WeeklyReviewPage() {
  const { supabase } = await requireSession();
  const now = new Date();
  const today = toSaoPauloDateOnly(now);
  const nextSevenDays = toSaoPauloDateOnly(addDays(now, 7));
  const nextThirtyDays = toSaoPauloDateOnly(addDays(now, 30));
  const sevenDaysAgoIso = addDays(now, -7).toISOString();

  const [
    pendingCapturesCount,
    pendingCapturesResult,
    overdueTasksResult,
    completedTasksResult,
    nextTasksResult,
    activeProjectsResult,
    openProjectTasksResult,
    upcomingProjectsResult,
    decisionProjectsResult,
    domainsResult,
    projectsForNamesResult,
  ] = await Promise.all([
    getCount(
      supabase
        .from("pending_captures")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ),
    supabase
      .from("pending_captures")
      .select("id,raw_text,source,captured_at")
      .eq("status", "pending")
      .order("captured_at", { ascending: false })
      .limit(10)
      .returns<PendingCaptureRow[]>(),
    supabase
      .from("tasks")
      .select(
        "id,title,notes,status,due_date,due_time,priority,domain_id,project_id",
      )
      .in("status", openTaskStatuses)
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .returns<TaskRow[]>(),
    supabase
      .from("tasks")
      .select(
        "id,title,notes,status,due_date,due_time,priority,domain_id,project_id,completed_at,updated_at",
      )
      .eq("status", "done")
      .order("updated_at", { ascending: false })
      .limit(50)
      .returns<TaskRow[]>(),
    supabase
      .from("tasks")
      .select(
        "id,title,notes,status,due_date,due_time,priority,domain_id,project_id",
      )
      .in("status", openTaskStatuses)
      .gte("due_date", today)
      .lte("due_date", nextSevenDays)
      .order("due_date", { ascending: true })
      .order("due_time", { ascending: true, nullsFirst: false })
      .returns<TaskRow[]>(),
    supabase
      .from("projects")
      .select("id,name,status,type,target_date,domain_id")
      .eq("status", "active")
      .order("name", { ascending: true })
      .returns<ProjectRow[]>(),
    supabase
      .from("tasks")
      .select("project_id")
      .in("status", openTaskStatuses)
      .not("project_id", "is", null)
      .returns<Array<{ project_id: string | null }>>(),
    supabase
      .from("projects")
      .select("id,name,status,type,target_date,domain_id")
      .in("status", ["active", "waiting"])
      .not("target_date", "is", null)
      .gte("target_date", today)
      .lte("target_date", nextThirtyDays)
      .order("target_date", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true })
      .limit(20)
      .returns<ProjectRow[]>(),
    supabase
      .from("projects")
      .select("id,name,status,type,target_date,domain_id")
      .in("status", ["paused", "waiting"])
      .order("status", { ascending: true })
      .order("name", { ascending: true })
      .returns<ProjectRow[]>(),
    supabase.from("domains").select("id,name").returns<DomainRow[]>(),
    supabase
      .from("projects")
      .select("id,name,status,type,target_date,domain_id")
      .returns<ProjectRow[]>(),
  ]);

  if (pendingCapturesResult.error) {
    throw new Error(pendingCapturesResult.error.message);
  }
  if (overdueTasksResult.error) {
    throw new Error(overdueTasksResult.error.message);
  }
  if (completedTasksResult.error) {
    throw new Error(completedTasksResult.error.message);
  }
  if (nextTasksResult.error) {
    throw new Error(nextTasksResult.error.message);
  }
  if (activeProjectsResult.error) {
    throw new Error(activeProjectsResult.error.message);
  }
  if (openProjectTasksResult.error) {
    throw new Error(openProjectTasksResult.error.message);
  }
  if (upcomingProjectsResult.error) {
    throw new Error(upcomingProjectsResult.error.message);
  }
  if (decisionProjectsResult.error) {
    throw new Error(decisionProjectsResult.error.message);
  }
  if (domainsResult.error) {
    throw new Error(domainsResult.error.message);
  }
  if (projectsForNamesResult.error) {
    throw new Error(projectsForNamesResult.error.message);
  }

  const domainNameById = new Map(
    domainsResult.data.map((domain) => [domain.id, domain.name]),
  );
  const projectNameById = new Map(
    projectsForNamesResult.data.map((project) => [project.id, project.name]),
  );
  const projectIdsWithOpenTasks = new Set(
    openProjectTasksResult.data
      .map((task) => task.project_id)
      .filter((projectId): projectId is string => Boolean(projectId)),
  );
  const projectsWithoutNextAction = activeProjectsResult.data
    .filter((project) => !projectIdsWithOpenTasks.has(project.id))
    .slice(0, 10);

  const overdueTasks = sortByDueDateAndPriority(overdueTasksResult.data);
  const nextTasks = sortByDueDateAndPriority(nextTasksResult.data);
  const completedTasks = completedTasksResult.data
    .filter((task) => {
      const referenceDate = task.completed_at ?? task.updated_at;

      return referenceDate ? referenceDate >= sevenDaysAgoIso : false;
    })
    .slice(0, 20);

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Lucas OS"
        title="Weekly Review"
        description="Revisão semanal simples com capturas, tasks, prazos e projetos que precisam de decisão."
      />

      <section className="mt-8 grid gap-3 sm:grid-cols-4">
        <StatCard label="Capturas pendentes" value={pendingCapturesCount} />
        <StatCard label="Tarefas vencidas" value={overdueTasks.length} />
        <StatCard label="Próximos 7 dias" value={nextTasks.length} />
        <StatCard
          label="Projetos sem próxima ação"
          value={projectsWithoutNextAction.length}
        />
      </section>

      <div className="mt-8 grid gap-8">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-zinc-950">
                Capturas pendentes
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Texto bruto aguardando triagem.
              </p>
            </div>
            <Link
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              href="/capture"
            >
              Abrir Capture
            </Link>
          </div>

          {pendingCapturesResult.data.length === 0 ? (
            <EmptyState
              title="Nenhuma captura pendente"
              description="Tudo que entrou por captura já foi triado."
            />
          ) : (
            <div className="grid gap-3">
              {pendingCapturesResult.data.map((capture) => (
                <article
                  className="rounded-md border border-zinc-200 bg-white p-4"
                  key={capture.id}
                >
                  <p className="line-clamp-3 text-sm leading-6 text-zinc-800">
                    {capture.raw_text}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-600">
                    <StatusBadge label={capture.source} />
                    <span>
                      Capturada em{" "}
                      {formatDateTime(capture.captured_at, "Sem data")}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <TaskReviewSection
          description="Tasks abertas com data anterior a hoje."
          domainNameById={domainNameById}
          emptyDescription="Nada vencido no momento."
          emptyTitle="Nenhuma tarefa vencida"
          projectNameById={projectNameById}
          tasks={overdueTasks}
          title="Tarefas vencidas"
        />

        <TaskReviewSection
          description="Tasks concluídas nos últimos 7 dias. Quando completed_at não existe, updated_at é usado como aproximação."
          domainNameById={domainNameById}
          emptyDescription="Nenhuma task concluída apareceu na janela dos últimos 7 dias."
          emptyTitle="Nenhuma conclusão recente"
          projectNameById={projectNameById}
          tasks={completedTasks}
          title="Tarefas concluídas nos últimos 7 dias"
        />

        <TaskReviewSection
          description="Tasks abertas com prazo entre hoje e os próximos 7 dias."
          domainNameById={domainNameById}
          emptyDescription="Nenhum prazo aberto nos próximos 7 dias."
          emptyTitle="Semana livre de prazos"
          projectNameById={projectNameById}
          tasks={nextTasks}
          title="Próximos 7 dias"
        />

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-zinc-950">
                Projetos ativos sem próxima ação
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Mesma lógica do Today: projetos ativos sem nenhuma task aberta
                associada.
              </p>
            </div>
            <StatusBadge label={`${projectsWithoutNextAction.length}`} />
          </div>

          {projectsWithoutNextAction.length === 0 ? (
            <EmptyState
              title="Nenhum projeto parado"
              description="Todos os projetos ativos encontrados têm pelo menos uma task aberta."
            />
          ) : (
            <div className="grid gap-3">
              {projectsWithoutNextAction.map((project) => (
                <article
                  className="rounded-md border border-zinc-200 bg-white p-4"
                  key={project.id}
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div>
                      <h3 className="font-medium text-zinc-950">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        {domainNameById.get(project.domain_id) ?? "Sem domínio"}
                        {project.target_date
                          ? ` - alvo ${formatDate(project.target_date)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        href={getNextActionHref(project)}
                      >
                        Criar próxima ação
                      </Link>
                      <Link
                        className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        href={getProjectEditHref(project.id)}
                      >
                        Editar projeto
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <ProjectReviewSection
          description="Projetos active/waiting com target_date nos próximos 30 dias."
          domainNameById={domainNameById}
          emptyDescription="Nenhum projeto com data alvo nessa janela."
          emptyTitle="Sem prazos de projeto nos próximos 30 dias"
          projects={upcomingProjectsResult.data}
          title="Projetos com prazo nos próximos 30 dias"
        />

        <ProjectReviewSection
          description="Projetos pausados ou waiting que talvez precisem de decisão."
          domainNameById={domainNameById}
          emptyDescription="Nenhum projeto pausado ou waiting para revisar agora."
          emptyTitle="Nenhuma decisão pendente"
          projects={decisionProjectsResult.data}
          title="Projetos pausados ou waiting"
        />
      </div>
    </main>
  );
}

function ProjectReviewSection({
  description,
  domainNameById,
  emptyDescription,
  emptyTitle,
  projects,
  title,
}: {
  description: string;
  domainNameById: Map<string, string>;
  emptyDescription: string;
  emptyTitle: string;
  projects: ProjectRow[];
  title: string;
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm text-zinc-600">{description}</p>
        </div>
        <StatusBadge label={`${projects.length}`} />
      </div>

      {projects.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <article
              className="rounded-md border border-zinc-200 bg-white p-4"
              key={project.id}
            >
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-zinc-950">
                      {project.name}
                    </h3>
                    <StatusBadge
                      label={project.status}
                      tone={getProjectTone(project.status)}
                    />
                    <StatusBadge label={project.type} />
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    {domainNameById.get(project.domain_id) ?? "Sem domínio"} -
                    alvo {formatDate(project.target_date)}
                  </p>
                </div>
                <Link
                  className="inline-flex items-center justify-center rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  href={getProjectEditHref(project.id)}
                >
                  Editar projeto
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
