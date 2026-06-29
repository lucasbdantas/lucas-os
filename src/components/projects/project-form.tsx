import { createProject } from "@/lib/projects/actions";

type DomainOption = {
  id: string;
  name: string;
};

type ProjectFormProps = {
  domains: DomainOption[];
  returnTo: string;
};

export function ProjectForm({ domains, returnTo }: ProjectFormProps) {
  return (
    <form
      action={createProject}
      className="rounded-md border border-zinc-200 bg-white p-4"
    >
      <input name="returnTo" type="hidden" value={returnTo} />

      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Nome</span>
          <input
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
            maxLength={4000}
            name="description"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Domínio</span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
              name="targetDate"
              type="date"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Status</span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              defaultValue="active"
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
              defaultValue="deadline"
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
            maxLength={4000}
            name="failureMode"
          />
        </label>

        <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Criar projeto
        </button>
      </div>
    </form>
  );
}
