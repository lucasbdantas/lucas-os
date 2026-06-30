import { PageHeader } from "@/components/layout/page-header";
import {
  ProjectForm,
  type ProjectFormInitialProject,
} from "@/components/projects/project-form";
import {
  ProjectList,
  type MilestoneListItem,
  type ProjectListItem,
} from "@/components/projects/project-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/supabase/require-session";

type ProjectsPageProps = {
  searchParams: Promise<{
    edit?: string;
    error?: string;
  }>;
};

type DomainRow = {
  id: string;
  name: string;
  active: boolean;
};

type ProjectRow = ProjectFormInitialProject;

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { edit, error: pageError } = await searchParams;
  const { supabase } = await requireSession();

  const [domainsResult, projectsResult, milestonesResult] = await Promise.all([
    supabase
      .from("domains")
      .select("id,name,active")
      .order("name", { ascending: true })
      .returns<DomainRow[]>(),
    supabase
      .from("projects")
      .select(
        "id,name,description,status,type,target_date,start_date,cadence_expected,domain_id,success_definition,failure_mode",
      )
      .order("target_date", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true })
      .returns<ProjectRow[]>(),
    supabase
      .from("milestones")
      .select("id,project_id,title,status,weight,due_date")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .returns<MilestoneListItem[]>(),
  ]);

  if (domainsResult.error) throw new Error(domainsResult.error.message);
  if (projectsResult.error) throw new Error(projectsResult.error.message);
  if (milestonesResult.error) throw new Error(milestonesResult.error.message);

  const domainNameById = new Map(
    domainsResult.data.map((domain) => [domain.id, domain.name]),
  );
  const activeDomains = domainsResult.data.filter((domain) => domain.active);
  const milestonesByProjectId = new Map<string, MilestoneListItem[]>();

  for (const milestone of milestonesResult.data) {
    const currentMilestones =
      milestonesByProjectId.get(milestone.project_id) ?? [];
    currentMilestones.push(milestone);
    milestonesByProjectId.set(milestone.project_id, currentMilestones);
  }

  const projects: ProjectListItem[] = projectsResult.data.map((project) => ({
    ...project,
    domainName: domainNameById.get(project.domain_id) ?? "Sem domínio",
    milestones: milestonesByProjectId.get(project.id) ?? [],
  }));

  let editProject: ProjectRow | null = null;
  let editError: string | null = null;

  if (edit) {
    if (!uuidRegex.test(edit)) {
      editError = "Projeto inválido para edição.";
    } else {
      editProject =
        projectsResult.data.find((project) => project.id === edit) ?? null;
      if (!editProject) {
        editError = "Projeto não encontrado ou sem permissão.";
      }
    }
  }

  const editDomain = editProject
    ? domainsResult.data.find((domain) => domain.id === editProject.domain_id)
    : null;
  const editDomains =
    editDomain && !activeDomains.some((domain) => domain.id === editDomain.id)
      ? [...activeDomains, editDomain]
      : activeDomains;
  const visibleError = pageError ?? editError;

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Projects"
        description="CRUD manual mínimo de projetos e milestones via Supabase Auth + RLS."
      />

      {visibleError ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {visibleError}
        </p>
      ) : null}

      {editProject ? (
        <section className="mt-8" id="edit-project">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-semibold text-zinc-950">Editar projeto</h2>
            <StatusBadge label="edição manual" tone="amber" />
          </div>
          <ProjectForm
            domains={editDomains}
            initialProject={editProject}
            returnTo="/projects"
          />
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold text-zinc-950">Novo projeto</h2>
          <StatusBadge label="manual" />
        </div>
        <ProjectForm domains={activeDomains} returnTo="/projects" />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-zinc-950">Projetos</h2>
        <ProjectList projects={projects} returnTo="/projects" />
      </section>
    </main>
  );
}
