import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProjectStatusActions } from "@/components/projects/project-status-actions";
import { MilestoneForm } from "@/components/projects/milestone-form";
import { MilestoneActions } from "@/components/projects/milestone-actions";
import { formatDate } from "@/lib/format";

export type ProjectListItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  target_date: string | null;
  success_definition: string | null;
  failure_mode: string | null;
  domainName: string;
  milestones: MilestoneListItem[];
};

export type MilestoneListItem = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  weight: number;
  due_date: string | null;
};

type ProjectListProps = {
  projects: ProjectListItem[];
  returnTo: string;
};

function getProjectTone(status: string) {
  if (status === "active") return "green";
  if (status === "waiting") return "amber";
  if (status === "completed") return "blue";
  if (status === "canceled") return "red";

  return "default";
}

function getMilestoneTone(status: string) {
  if (status === "done") return "green";
  if (status === "canceled") return "red";
  if (status === "waiting") return "amber";

  return "blue";
}

export function ProjectList({ projects, returnTo }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="Nenhum projeto encontrado"
        description="Crie um projeto acima ou rode o seed inicial da Fase 1."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {projects.map((project) => (
        <article
          className="rounded-md border border-zinc-200 bg-white p-4"
          key={project.id}
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-zinc-950">
                  {project.name}
                </h2>
                <StatusBadge
                  label={project.status}
                  tone={getProjectTone(project.status)}
                />
                <StatusBadge label={project.type} />
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                {project.domainName} · {formatDate(project.target_date)}
              </p>
              {project.description ? (
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {project.description}
                </p>
              ) : null}
              {project.success_definition ? (
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  <span className="font-medium text-zinc-800">Sucesso:</span>{" "}
                  {project.success_definition}
                </p>
              ) : null}
              {project.failure_mode ? (
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  <span className="font-medium text-zinc-800">Risco:</span>{" "}
                  {project.failure_mode}
                </p>
              ) : null}
            </div>
            <ProjectStatusActions
              currentStatus={project.status}
              projectId={project.id}
              returnTo={returnTo}
            />
          </div>

          <div className="mt-5 border-t border-zinc-100 pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-950">
                Milestones
              </h3>
              <StatusBadge label={`${project.milestones.length}`} />
            </div>

            <MilestoneForm projectId={project.id} returnTo={returnTo} />

            {project.milestones.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                Nenhuma milestone neste projeto.
              </p>
            ) : (
              <div className="mt-4 grid gap-2">
                {project.milestones.map((milestone) => (
                  <div
                    className="grid gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-3 md:grid-cols-[1fr_auto]"
                    key={milestone.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-zinc-950">
                          {milestone.title}
                        </p>
                        <StatusBadge
                          label={milestone.status}
                          tone={getMilestoneTone(milestone.status)}
                        />
                      </div>
                      <p className="mt-1 text-sm text-zinc-600">
                        {formatDate(milestone.due_date)} · peso{" "}
                        {milestone.weight}
                      </p>
                    </div>
                    {["done", "canceled"].includes(milestone.status) ? null : (
                      <MilestoneActions
                        milestoneId={milestone.id}
                        returnTo={returnTo}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
