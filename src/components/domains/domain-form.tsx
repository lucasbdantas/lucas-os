import { createDomain } from "@/lib/domains/actions";

type DomainFormProps = {
  returnTo: string;
};

export function DomainForm({ returnTo }: DomainFormProps) {
  return (
    <form
      action={createDomain}
      className="app-card-soft p-4"
    >
      <input name="returnTo" type="hidden" value={returnTo} />

      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Nome</span>
          <input
            className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
            maxLength={120}
            name="name"
            required
            type="text"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Descrição</span>
          <textarea
            className="field-control mt-2 min-h-20 w-full px-3 py-2 text-sm outline-none"
            maxLength={4000}
            name="description"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Cor</span>
            <input
              className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
              maxLength={32}
              name="color"
              placeholder="#2563eb"
              type="text"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Ícone</span>
            <input
              className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
              maxLength={64}
              name="icon"
              placeholder="folder"
              type="text"
            />
          </label>
        </div>

        <button className="primary-button px-4 py-2.5 text-sm font-semibold">
          Criar domínio
        </button>
      </div>
    </form>
  );
}
