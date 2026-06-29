import { createDomain } from "@/lib/domains/actions";

type DomainFormProps = {
  returnTo: string;
};

export function DomainForm({ returnTo }: DomainFormProps) {
  return (
    <form
      action={createDomain}
      className="rounded-md border border-zinc-200 bg-white p-4"
    >
      <input name="returnTo" type="hidden" value={returnTo} />

      <div className="grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Nome</span>
          <input
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            maxLength={120}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Cor</span>
            <input
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              maxLength={64}
              name="color"
              placeholder="#2563eb"
              type="text"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Ícone</span>
            <input
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              maxLength={64}
              name="icon"
              placeholder="folder"
              type="text"
            />
          </label>
        </div>

        <button className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Criar domínio
        </button>
      </div>
    </form>
  );
}
