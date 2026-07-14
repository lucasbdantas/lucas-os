import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  setDomainActive,
  updateDomainDetails,
} from "@/lib/domains/actions";

export type DomainListItem = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  active: boolean;
  is_system: boolean;
  projectCount: number;
  openTaskCount: number;
};

type DomainListProps = {
  domains: DomainListItem[];
  returnTo: string;
};

function isInbox(domain: DomainListItem) {
  return domain.is_system && domain.name === "Inbox";
}

export function DomainList({ domains, returnTo }: DomainListProps) {
  if (domains.length === 0) {
    return (
      <EmptyState
        title="Nenhum domínio encontrado"
        description="Rode o seed inicial da Fase 1 para criar Inbox e os domínios principais."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {domains.map((domain) => (
        <article
          className={`app-card-interactive p-4 ${
            isInbox(domain) ? "app-card" : "app-card-soft"
          }`}
          key={domain.id}
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-zinc-950">{domain.name}</h2>
                <StatusBadge
                  label={domain.active ? "active" : "inactive"}
                  tone={domain.active ? "green" : "default"}
                />
                {domain.is_system ? (
                  <StatusBadge label="system" tone="blue" />
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {domain.description ?? "Sem descrição"}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                <span>Projetos: {domain.projectCount}</span>
                <span>Tarefas abertas: {domain.openTaskCount}</span>
                {domain.color ? <span>Cor: {domain.color}</span> : null}
                {domain.icon ? <span>Ícone: {domain.icon}</span> : null}
              </div>
            </div>

            {isInbox(domain) ? (
              <p className="text-sm text-zinc-500">
                Inbox é system e fica sempre ativa.
              </p>
            ) : (
              <form action={setDomainActive}>
                <input name="domainId" type="hidden" value={domain.id} />
                <input name="returnTo" type="hidden" value={returnTo} />
                <input
                  name="active"
                  type="hidden"
                  value={domain.active ? "false" : "true"}
                />
                <button className="soft-button px-3 py-2 text-sm font-semibold">
                  {domain.active ? "Desativar" : "Ativar"}
                </button>
              </form>
            )}
          </div>

          {!isInbox(domain) ? (
            <form
              action={updateDomainDetails}
              className="mt-5 grid gap-3 border-t border-zinc-100 pt-4 md:grid-cols-[1fr_180px_160px_auto]"
            >
              <input name="domainId" type="hidden" value={domain.id} />
              <input name="returnTo" type="hidden" value={returnTo} />
              <input
                className="field-control px-3 py-2 text-sm outline-none"
                defaultValue={domain.description ?? ""}
                maxLength={4000}
                name="description"
                placeholder="Descrição"
                type="text"
              />
              <input
                className="field-control px-3 py-2 text-sm outline-none"
                defaultValue={domain.color ?? ""}
                maxLength={32}
                name="color"
                placeholder="Cor"
                type="text"
              />
              <input
                className="field-control px-3 py-2 text-sm outline-none"
                defaultValue={domain.icon ?? ""}
                maxLength={64}
                name="icon"
                placeholder="Ícone"
                type="text"
              />
              <button className="soft-button px-3 py-2 text-sm font-semibold">
                Salvar
              </button>
            </form>
          ) : null}
        </article>
      ))}
    </div>
  );
}
