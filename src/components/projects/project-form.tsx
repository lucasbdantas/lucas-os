import { createProject, updateProject } from "@/lib/projects/actions";

type DomainOption = {
  id: string;
  name: string;
};

export type ProjectFormInitialProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  target_date: string | null;
  start_date: string | null;
  cadence_expected: string | null;
  domain_id: string;
  success_definition: string | null;
  failure_mode: string | null;
};

type ProjectFormProps = {
  domains: DomainOption[];
  initialProject?: ProjectFormInitialProject;
  returnTo: string;
};

export function ProjectForm({
  domains,
  initialProject,
  returnTo,
}: ProjectFormProps) {
  const isEditing = Boolean(initialProject);
  const action = isEditing ? updateProject : createProject;

  return (
    <form
      action={action}
      className="rounded-md border border-zinc-200 bg-white p-4"
    >
      <input name="returnTo" type="hidden" value={returnTo} />
      {initialProject ? (
        <input name="projectId" type="hidden" value={initialProject.id} />
      ) : null}

      <div className="grid gap-4">
        {isEditing ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
            Modo edição. Se este projeto já tiver tasks associadas, o domínio
            não poderá ser alterado para evitar inconsistência. As tasks
            existentes não são movidas automaticamente.
          </div>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Nome</span>
          <input
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            defaultValue={initialProject?.name ?? ""}
            maxLength={160}
            name="name"
            required
            type="text"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Descrição</span>
          <textarea
            className="mt-2 min-h-20 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            defaultValue={initialProject?.description ?? ""}
            maxLength={4000}
            name="description"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Domínio</span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              defaultValue={initialProject?.domain_id ?? ""}
              name="domainId"
              required
            >
              <option value="">Escolher domínio</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Data alvo</span>
            <input
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              defaultValue={initialProject?.target_date ?? ""}
              name="targetDate"
              type="date"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Início</span>
            <input
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              defaultValue={initialProject?.start_date ?? ""}
              name="startDate"
              type="date"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Cadência esperada
            </span>
            <input
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              defaultValue={initialProject?.cadence_expected ?? ""}
              maxLength={120}
              name="cadenceExpected"
              placeholder="Ex.: semanal, quinzenal"
              type="text"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Status</span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              defaultValue={initialProject?.status ?? "active"}
              name="status"
            >
              <option value="active">active</option>
              <option value="waiting">waiting</option>
              <option value="paused">paused</option>
              <option value="completed">completed</option>
              <option value="canceled">canceled</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Tipo</span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              defaultValue={initialProject?.type ?? "deadline"}
              name="type"
            >
              <option value="deadline">deadline</option>
              <option value="ongoing">ongoing</option>
              <option value="seasonal">seasonal</option>
              <option value="learning">learning</option>
              <option value="administrative">administrative</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Definição de sucesso
          </span>
          <textarea
            className="mt-2 min-h-16 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            defaultValue={initialProject?.success_definition ?? ""}
            maxLength={4000}
            name="successDefinition"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Modo de falha
          </span>
          <textarea
            className="mt-2 min-h-16 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            defaultValue={initialProject?.failure_mode ?? ""}
            maxLength={4000}
            name="failureMode"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            {isEditing ? "Salvar projeto" : "Criar projeto"}
          </button>
          {isEditing ? (
            <a
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              href="/projects"
            >
              Cancelar edição
            </a>
          ) : null}
        </div>
      </div>
    </form>
  );
}
