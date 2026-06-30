import { createTask, updateTask } from "@/lib/tasks/actions";

export type DomainOption = {
  id: string;
  name: string;
  is_system?: boolean;
};

export type ProjectOption = {
  id: string;
  name: string;
  domain_id: string;
  domainName?: string;
};

export type EditableTaskValues = {
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

type TaskFormProps = {
  domains: DomainOption[];
  projects?: ProjectOption[];
  defaultDomainId?: string;
  returnTo: string;
  compact?: boolean;
  initialTask?: EditableTaskValues;
};

export function TaskForm({
  domains,
  projects = [],
  defaultDomainId,
  returnTo,
  compact = false,
  initialTask,
}: TaskFormProps) {
  const isEditing = Boolean(initialTask);
  const action = isEditing ? updateTask : createTask;
  const selectedDomainId = initialTask?.domain_id ?? defaultDomainId ?? "";
  const selectedDomainIsAvailable = selectedDomainId
    ? domains.some((domain) => domain.id === selectedDomainId)
    : false;
  const domainSelectDefaultValue =
    selectedDomainId && selectedDomainIsAvailable ? selectedDomainId : "";

  return (
    <form
      action={action}
      className="rounded-md border border-zinc-200 bg-white p-4"
    >
      <input name="returnTo" type="hidden" value={returnTo} />
      {initialTask ? (
        <input name="taskId" type="hidden" value={initialTask.id} />
      ) : null}

      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Titulo</span>
          <input
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            defaultValue={initialTask?.title}
            maxLength={220}
            name="title"
            placeholder={compact ? "Adicionar tarefa na Inbox" : "Nova tarefa"}
            required
            type="text"
          />
        </label>

        {!compact || isEditing ? (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Notas</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              defaultValue={initialTask?.notes ?? ""}
              maxLength={4000}
              name="notes"
            />
          </label>
        ) : null}

        {defaultDomainId && !isEditing ? (
          <input name="domainId" type="hidden" value={defaultDomainId} />
        ) : (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Dominio</span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              defaultValue={domainSelectDefaultValue}
              name="domainId"
              required={isEditing}
            >
              {!isEditing ? <option value="">Inbox automatica</option> : null}
              {isEditing && !selectedDomainIsAvailable ? (
                <option value="">Escolha um dominio ativo</option>
              ) : null}
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {!compact || isEditing ? (
          <>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                Projeto opcional
              </span>
              <select
                className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                defaultValue={initialTask?.project_id ?? ""}
                name="projectId"
              >
                <option value="">Sem projeto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.domainName
                      ? `${project.name} - ${project.domainName}`
                      : project.name}
                  </option>
                ))}
              </select>
              {isEditing ? (
                <span className="mt-1 block text-xs text-zinc-500">
                  Se trocar o dominio, escolha um projeto do mesmo dominio ou
                  deixe sem projeto.
                </span>
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">Data</span>
                <input
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  defaultValue={initialTask?.due_date ?? ""}
                  name="dueDate"
                  type="date"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  Horario
                </span>
                <input
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  defaultValue={initialTask?.due_time?.slice(0, 5) ?? ""}
                  name="dueTime"
                  type="time"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  Prioridade
                </span>
                <select
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  defaultValue={initialTask?.priority ?? "medium"}
                  name="priority"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  Energia
                </span>
                <select
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  defaultValue={initialTask?.energy_required ?? ""}
                  name="energyRequired"
                >
                  <option value="">Sem definir</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  Contexto
                </span>
                <input
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  defaultValue={initialTask?.context ?? ""}
                  maxLength={80}
                  name="context"
                  placeholder="computador, casa..."
                  type="text"
                />
              </label>
            </div>

            {isEditing ? (
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  Status
                </span>
                <select
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  defaultValue={initialTask?.status ?? "todo"}
                  name="status"
                >
                  <option value="todo">todo</option>
                  <option value="doing">doing</option>
                  <option value="waiting">waiting</option>
                  <option value="done">done</option>
                  <option value="canceled">canceled</option>
                </select>
              </label>
            ) : null}
          </>
        ) : (
          <input name="priority" type="hidden" value="medium" />
        )}

        <div className="flex flex-wrap gap-2">
          <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            {isEditing ? "Salvar alteracoes" : "Criar tarefa"}
          </button>
          {isEditing ? (
            <a
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              href="/tasks"
            >
              Cancelar edicao
            </a>
          ) : null}
        </div>
      </div>
    </form>
  );
}
