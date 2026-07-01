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
  recurrence_type: string;
  recurrence_interval: number;
  recurrence_anchor_date: string | null;
  recurrence_end_date: string | null;
  reminder_offsets: number[];
};

export type CreateTaskDefaults = {
  context?: string | null;
  domain_id?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  energy_required?: string | null;
  notes?: string | null;
  priority?: string;
  project_id?: string | null;
  recurrence_anchor_date?: string | null;
  recurrence_end_date?: string | null;
  recurrence_interval?: number;
  recurrence_type?: string;
  reminder_offsets?: number[];
  source?: "manual" | "voice" | "email" | "observation" | "import";
  title?: string;
};

type TaskFormProps = {
  domains: DomainOption[];
  projects?: ProjectOption[];
  defaultDomainId?: string;
  defaultProjectId?: string;
  returnTo: string;
  compact?: boolean;
  createDefaults?: CreateTaskDefaults;
  initialTask?: EditableTaskValues;
  submitLabel?: string;
};

export function TaskForm({
  domains,
  projects = [],
  defaultDomainId,
  defaultProjectId,
  returnTo,
  compact = false,
  createDefaults,
  initialTask,
  submitLabel,
}: TaskFormProps) {
  const isEditing = Boolean(initialTask);
  const action = isEditing ? updateTask : createTask;
  const selectedDomainId =
    initialTask?.domain_id ??
    createDefaults?.domain_id ??
    defaultDomainId ??
    "";
  const selectedDomainIsAvailable = selectedDomainId
    ? domains.some((domain) => domain.id === selectedDomainId)
    : false;
  const domainSelectDefaultValue =
    selectedDomainId && selectedDomainIsAvailable ? selectedDomainId : "";

  return (
    <form
      action={action}
      className="app-card-soft p-4"
    >
      <input name="returnTo" type="hidden" value={returnTo} />
      {initialTask ? (
        <input name="taskId" type="hidden" value={initialTask.id} />
      ) : null}
      {!isEditing && createDefaults?.source ? (
        <input name="source" type="hidden" value={createDefaults.source} />
      ) : null}

      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Titulo</span>
          <input
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            defaultValue={initialTask?.title ?? createDefaults?.title}
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
              defaultValue={initialTask?.notes ?? createDefaults?.notes ?? ""}
              maxLength={4000}
              name="notes"
            />
          </label>
        ) : null}

        {defaultDomainId && compact && !isEditing ? (
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
                defaultValue={
                  initialTask?.project_id ??
                  createDefaults?.project_id ??
                  defaultProjectId ??
                  ""
                }
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
                  defaultValue={initialTask?.due_date ?? createDefaults?.due_date ?? ""}
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
                  defaultValue={
                    initialTask?.due_time?.slice(0, 5) ??
                    createDefaults?.due_time?.slice(0, 5) ??
                    ""
                  }
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
                  defaultValue={
                    initialTask?.priority ?? createDefaults?.priority ?? "medium"
                  }
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
                  defaultValue={
                    initialTask?.energy_required ??
                    createDefaults?.energy_required ??
                    ""
                  }
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
                  defaultValue={initialTask?.context ?? createDefaults?.context ?? ""}
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

            <fieldset className="app-card-muted p-3">
              <legend className="px-1 text-sm font-medium text-zinc-700">
                Recorrência
              </legend>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">
                    Repetição
                  </span>
                  <select
                    className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                    defaultValue={
                      initialTask?.recurrence_type ??
                      createDefaults?.recurrence_type ??
                      "none"
                    }
                    name="recurrenceType"
                  >
                    <option value="none">Não repetir</option>
                    <option value="daily">Todo dia</option>
                    <option value="weekly">Toda semana</option>
                    <option value="monthly">Todo mês</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">
                    Intervalo
                  </span>
                  <input
                    className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                    defaultValue={
                      initialTask?.recurrence_interval ??
                      createDefaults?.recurrence_interval ??
                      1
                    }
                    min={1}
                    name="recurrenceInterval"
                    type="number"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">
                    Data base opcional
                  </span>
                  <input
                    className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                    defaultValue={
                      initialTask?.recurrence_anchor_date ??
                      createDefaults?.recurrence_anchor_date ??
                      ""
                    }
                    name="recurrenceAnchorDate"
                    type="date"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">
                    Repetir até
                  </span>
                  <input
                    className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                    defaultValue={
                      initialTask?.recurrence_end_date ??
                      createDefaults?.recurrence_end_date ??
                      ""
                    }
                    name="recurrenceEndDate"
                    type="date"
                  />
                </label>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Ao concluir uma task recorrente com data, o Lucas OS cria a
                próxima ocorrência a partir do prazo atual. Sem data, nenhuma
                próxima ocorrência é criada automaticamente.
              </p>
            </fieldset>

            <fieldset className="app-card-muted p-3">
              <legend className="px-1 text-sm font-medium text-zinc-700">
                Lembretes
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  { label: "Na hora", value: 0 },
                  { label: "15 minutos antes", value: 15 },
                  { label: "1 hora antes", value: 60 },
                  { label: "1 dia antes", value: 1440 },
                ].map((option) => (
                  <label
                    className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                    key={option.value}
                  >
                    <input
                      defaultChecked={initialTask?.reminder_offsets?.includes(
                        option.value,
                      ) ?? createDefaults?.reminder_offsets?.includes(option.value)}
                      name="reminderOffsets"
                      type="checkbox"
                      value={option.value}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Lembretes internos só são gerados quando a task tem data e
                horário. Não há push notification nesta versão.
              </p>
            </fieldset>
          </>
        ) : (
          <>
            <input name="priority" type="hidden" value="medium" />
            <input name="recurrenceType" type="hidden" value="none" />
            <input name="recurrenceInterval" type="hidden" value="1" />
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <button className="primary-button px-4 py-2.5 text-sm font-semibold">
            {submitLabel ?? (isEditing ? "Salvar alteracoes" : "Criar tarefa")}
          </button>
          {isEditing ? (
            <a
              className="ghost-button px-4 py-2.5 text-sm font-semibold"
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
