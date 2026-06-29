import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/supabase/require-session";

type DomainRow = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  is_system: boolean;
};

export default async function DomainsPage() {
  const { supabase } = await requireSession();
  const { data: domains, error } = await supabase
    .from("domains")
    .select("id,name,description,active,is_system")
    .order("is_system", { ascending: false })
    .order("name", { ascending: true })
    .returns<DomainRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Domains"
        description="Domínios permanentes carregados do Supabase com RLS."
      />

      <section className="mt-8">
        {domains.length === 0 ? (
          <EmptyState
            title="Nenhum domínio encontrado"
            description="Rode o seed inicial da Fase 1 para criar Inbox e os domínios principais."
          />
        ) : (
          <div className="grid gap-3">
            {domains.map((domain) => (
              <article
                className={`rounded-md border bg-white p-4 ${
                  domain.name === "Inbox"
                    ? "border-zinc-950"
                    : "border-zinc-200"
                }`}
                key={domain.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-zinc-950">
                      {domain.name}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      {domain.description ?? "Sem descrição"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge
                      label={domain.active ? "active" : "inactive"}
                      tone={domain.active ? "green" : "default"}
                    />
                    {domain.is_system ? (
                      <StatusBadge label="system" tone="blue" />
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
