import { PageHeader } from "@/components/layout/page-header";
import { DomainForm } from "@/components/domains/domain-form";
import {
  DomainList,
  type DomainListItem,
} from "@/components/domains/domain-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/supabase/require-session";

type DomainsPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

type DomainRow = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  active: boolean;
  is_system: boolean;
};

type ProjectCountRow = {
  domain_id: string;
};

type TaskCountRow = {
  domain_id: string;
};

function countByDomainId(rows: Array<{ domain_id: string }>) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.domain_id, (counts.get(row.domain_id) ?? 0) + 1);
  }

  return counts;
}

export default async function DomainsPage({ searchParams }: DomainsPageProps) {
  const { error: pageError } = await searchParams;
  const { supabase } = await requireSession();

  const [domainsResult, projectsResult, openTasksResult] = await Promise.all([
    supabase
      .from("domains")
      .select("id,name,description,color,icon,active,is_system")
      .order("is_system", { ascending: false })
      .order("name", { ascending: true })
      .returns<DomainRow[]>(),
    supabase.from("projects").select("domain_id").returns<ProjectCountRow[]>(),
    supabase
      .from("tasks")
      .select("domain_id")
      .in("status", ["todo", "doing", "waiting"])
      .returns<TaskCountRow[]>(),
  ]);

  if (domainsResult.error) throw new Error(domainsResult.error.message);
  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (openTasksResult.error) throw new Error(openTasksResult.error.message);

  const projectCountByDomainId = countByDomainId(projectsResult.data);
  const openTaskCountByDomainId = countByDomainId(openTasksResult.data);

  const domains: DomainListItem[] = domainsResult.data.map((domain) => ({
    ...domain,
    projectCount: projectCountByDomainId.get(domain.id) ?? 0,
    openTaskCount: openTaskCountByDomainId.get(domain.id) ?? 0,
  }));

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Domains"
        description="CRUD manual mínimo de domínios, sem delete e com Inbox protegida."
      />

      {pageError ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </p>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold text-zinc-950">Novo domínio</h2>
          <StatusBadge label="manual" />
        </div>
        <DomainForm returnTo="/domains" />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-zinc-950">Domínios</h2>
        <DomainList domains={domains} returnTo="/domains" />
      </section>
    </main>
  );
}
