import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionHeader } from "@/components/ui/section-header";
import {
  TaskForm,
  type EditableTaskValues,
} from "@/components/tasks/task-form";
import { TaskList, type TaskListItem } from "@/components/tasks/task-list";
import { requireSession } from "@/lib/supabase/require-session";

type TasksPageProps = {
  searchParams: Promise<{
    domain?: string;
    edit?: string;
    error?: string;
    notice?: string;
    project?: string;
  }>;
};

type DomainRow = {
  id: string;
  name: string;
  is_system: boolean;
  active: boolean;
};

type ProjectRow = {
  id: string;
  name: string;
  domain_id: string;
};

type TaskRow = EditableTaskValues;

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const {
    domain,
    edit,
    error: pageError,
    notice: pageNotice,
    project,
  } = await searchParams;
  const { supabase } = await requireSession();

  const [domainsResult, projectsResult, openTasksResult, closedTasksResult] =
    await Promise.all([
      supabase
        .from("domains")
        .select("id,name,is_system,active")
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
          "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id,recurrence_type,recurrence_interval,recurrence_anchor_date,recurrence_end_date,reminder_offsets,created_at",
        )
        .in("status", ["todo", "doing", "waiting"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .returns<TaskRow[]>(),
      supabase
        .from("tasks")
        .select(
          "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id,recurrence_type,recurrence_interval,recurrence_anchor_date,recurrence_end_date,reminder_offsets,completed_at",
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

  let editTask: TaskRow | null = null;
  let editError: string | null = null;

  if (edit) {
    if (!uuidRegex.test(edit)) {
      editError = "Tarefa inválida para edição.";
    } else {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id,recurrence_type,recurrence_interval,recurrence_anchor_date,recurrence_end_date,reminder_offsets",
        )
        .eq("id", edit)
        .maybeSingle<TaskRow>();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        editError = "Tarefa não encontrada ou sem permissão.";
      } else {
        editTask = data;
      }
    }
  }

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
  const selectableDomains = domainsResult.data.filter(
    (domain) => domain.active || (domain.is_system && domain.name === "Inbox"),
  );
  const domainParamWasProvided = Boolean(domain);
  const projectParamWasProvided = Boolean(project);
  let defaultCreateDomainId: string | undefined;
  let defaultCreateProjectId: string | undefined;

  if (!edit && (domainParamWasProvided || projectParamWasProvided)) {
    const domainCandidate =
      domain && uuidRegex.test(domain)
        ? selectableDomains.find((item) => item.id === domain)
        : undefined;
    const projectCandidate =
      project && uuidRegex.test(project)
        ? projectsResult.data.find((item) => item.id === project)
        : undefined;
    const domainParamIsValid = !domainParamWasProvided || Boolean(domainCandidate);
    const projectParamIsValid =
      !projectParamWasProvided || Boolean(projectCandidate);
    const projectDomainIsSelectable = projectCandidate
      ? selectableDomains.some((item) => item.id === projectCandidate.domain_id)
      : true;
    const projectMatchesDomain =
      projectCandidate && domainCandidate
        ? projectCandidate.domain_id === domainCandidate.id
        : true;

    if (
      domainParamIsValid &&
      projectParamIsValid &&
      projectDomainIsSelectable &&
      projectMatchesDomain
    ) {
      defaultCreateDomainId = domainCandidate?.id ?? projectCandidate?.domain_id;
      defaultCreateProjectId = projectCandidate?.id;
    }
  }

  const currentEditDomainIsSelectable = editTask
    ? selectableDomains.some((domain) => domain.id === editTask.domain_id)
    : true;
  const visibleError = pageError ?? editError;

  return (
    <main className="app-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Operacional"
        title="Tarefas"
        description="Crie, organize e conclua o trabalho que move seus projetos e compromissos."
      />

      {visibleError ? (
        <p className="feedback-panel mt-6" data-tone="danger" role="alert">
          {visibleError}
        </p>
      ) : null}

      {pageNotice ? (
        <p className="feedback-panel mt-6" data-tone="warning" role="status">
          {pageNotice}
        </p>
      ) : null}

      {editTask ? (
        <section className="section-shell mt-8" id="edit-task">
          <SectionHeader
            action={<StatusBadge label="Edição manual" tone="amber" />}
            description="Revise contexto, prazo, projeto e lembretes antes de salvar."
            title="Editar tarefa"
          />
          {!currentEditDomainIsSelectable ? (
            <p className="feedback-panel" data-tone="warning">
              O domínio atual desta tarefa está inativo. Escolha um domínio
              ativo ou Inbox antes de salvar.
            </p>
          ) : null}
          <TaskForm
            domains={selectableDomains}
            initialTask={editTask}
            projects={projectOptions}
            returnTo="/tasks"
          />
        </section>
      ) : null}

      <section className="section-shell mt-8" id="task-form">
        <SectionHeader
          action={<StatusBadge label="manual" />}
          description={
            defaultCreateProjectId
              ? "O projeto já está selecionado; falta definir a próxima ação concreta."
              : "Capture uma ação clara e organize os detalhes que realmente importam."
          }
          title={defaultCreateProjectId ? "Nova próxima ação" : "Nova tarefa"}
        />
        {defaultCreateProjectId ? (
          <p className="feedback-panel" data-tone="info">
            Projeto e domínio preenchidos a partir do link de próxima ação.
            Escreva o título antes de criar.
          </p>
        ) : null}
        <TaskForm
          defaultDomainId={defaultCreateDomainId}
          defaultProjectId={defaultCreateProjectId}
          domains={selectableDomains}
          projects={projectOptions}
          returnTo="/tasks"
        />
      </section>

      <section className="section-shell mt-10">
        <SectionHeader
          action={<StatusBadge label={`${openTasksResult.data.length}`} tone="green" />}
          description="Ações em andamento, aguardando ou ainda por começar."
          title="Tarefas abertas"
        />
        <TaskList
          emptyDescription="Crie uma tarefa acima para começar a organizar seu trabalho."
          emptyTitle="Nenhuma tarefa aberta"
          returnTo="/tasks"
          tasks={decorateTasks(
            openTasksResult.data,
            domainNameById,
            projectNameById,
          )}
        />
      </section>

      <section className="section-shell mt-10">
        <SectionHeader
          action={<StatusBadge label={`${closedTasksResult.data.length}`} />}
          description="Conclusões e cancelamentos recentes para manter contexto sem ocupar o foco."
          title="Fechadas recentemente"
        />
        <TaskList
          emptyDescription="Tarefas concluídas ou canceladas aparecerão aqui."
          emptyTitle="Nenhuma tarefa fechada recentemente"
          returnTo="/tasks"
          showStatusActions={false}
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
