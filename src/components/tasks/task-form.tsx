import { createTask } from "@/lib/tasks/actions";

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

type TaskFormProps = {
  domains: DomainOption[];
  projects?: ProjectOption[];
  defaultDomainId?: string;
  returnTo: string;
  compact?: boolean;
};

export function TaskForm({
  domains,
  projects = [],
  defaultDomainId,
  returnTo,
  compact = false,
}: TaskFormProps) {
  return (
    <form
      action={createTask}
      className="rounded-md border border-zinc-200 bg-white p-4"
    >
      <input name="returnTo" type="hidden" value={returnTo} />

      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Título</span>
          <input
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            maxLength={220}
            name="title"
            placeholder={compact ? "Adicionar tarefa na Inbox" : "Nova tarefa"}
            required
            type="text"
          />
        </label>

        {!compact ? (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Notas</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              maxLength={4000}
              name="notes"
            />
          </label>
        ) : null}

        {defaultDomainId ? (
          <input name="domainId" type="hidden" value={defaultDomainId} />
        ) : (
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Domínio</span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              name="domainId"
            >
              <option value="">Inbox automática</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {!compact ? (
          <>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                Projeto opcional
              </span>
              <select
                className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                name="projectId"
              >
                <option value="">Sem projeto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.domainName
                      ? `${project.name} — ${project.domainName}`
                      : project.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  Data
                </span>
                <input
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                  name="dueDate"
                  type="date"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  Horário
                </span>
                <input
                  className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
                  defaultValue="medium"
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
                  maxLength={80}
                  name="context"
                  placeholder="computador, casa..."
                  type="text"
                />
              </label>
            </div>
          </>
        ) : (
          <input name="priority" type="hidden" value="medium" />
        )}

        <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Criar tarefa
        </button>
      </div>
    </form>
  );
}
