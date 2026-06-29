import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/supabase/require-session";

type DomainRow = {
  id: string;
  name: string;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  type: string;
  target_date: string | null;
  domain_id: string;
};

function getProjectTone(status: string) {
  if (status === "active") return "green";
  if (status === "waiting") return "amber";
  if (status === "completed") return "blue";
  if (status === "canceled") return "red";

  return "default";
}

export default async function ProjectsPage() {
  const { supabase } = await requireSession();

  const [{ data: projects, error: projectsError }, { data: domains }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id,name,status,type,target_date,domain_id")
        .order("name", { ascending: true })
        .returns<ProjectRow[]>(),
      supabase.from("domains").select("id,name").returns<DomainRow[]>(),
    ]);

  if (projectsError) {
    throw new Error(projectsError.message);
  }

  const domainNameById = new Map(
    (domains ?? []).map((domain) => [domain.id, domain.name]),
  );

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Projects"
        description="Projetos reais do usuário, ligados aos domínios seedados."
      />

      <section className="mt-8">
        {projects.length === 0 ? (
          <EmptyState
            title="Nenhum projeto encontrado"
            description="Rode o seed inicial da Fase 1 para criar os projetos base."
          />
        ) : (
          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Projeto</th>
                  <th className="px-4 py-3 font-medium">Domínio</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Data alvo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-4 py-3 font-medium text-zinc-950">
                      {project.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {domainNameById.get(project.domain_id) ?? "Sem domínio"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={project.status}
                        tone={getProjectTone(project.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {project.type}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {formatDate(project.target_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
