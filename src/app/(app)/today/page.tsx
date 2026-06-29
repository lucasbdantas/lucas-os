import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, toDateOnly } from "@/lib/format";
import { requireSession } from "@/lib/supabase/require-session";

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  type: string;
  target_date: string | null;
};

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

async function getCount(query: PromiseLike<CountResult>) {
  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export default async function TodayPage() {
  const { supabase } = await requireSession();
  const soon = addDays(new Date(), 7);

  const [
    activeDomainsCount,
    activeOrWaitingProjectsCount,
    openTasksCount,
    dueSoonTasksCount,
    mainProjectsResult,
    inboxResult,
  ] = await Promise.all([
    getCount(
      supabase
        .from("domains")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
    ),
    getCount(
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .in("status", ["active", "waiting"]),
    ),
    getCount(
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("status", ["todo", "doing", "waiting"]),
    ),
    getCount(
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("status", ["todo", "doing", "waiting"])
        .lte("due_date", toDateOnly(soon)),
    ),
    supabase
      .from("projects")
      .select("id,name,status,type,target_date")
      .in("status", ["active", "waiting"])
      .order("target_date", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true })
      .limit(5)
      .returns<ProjectRow[]>(),
    supabase
      .from("domains")
      .select("id,name")
      .eq("name", "Inbox")
      .eq("is_system", true)
      .maybeSingle<{ id: string; name: string }>(),
  ]);

  if (mainProjectsResult.error) {
    throw new Error(mainProjectsResult.error.message);
  }

  if (inboxResult.error) {
    throw new Error(inboxResult.error.message);
  }

  const inboxOpenTasksCount = inboxResult.data
    ? await getCount(
        supabase
          .from("tasks")
          .select("id", { count: "exact", head: true })
          .eq("domain_id", inboxResult.data.id)
          .in("status", ["todo", "doing", "waiting"]),
      )
    : 0;

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Lucas OS"
        title="Today"
        description="Leitura básica do estado operacional usando Supabase Auth e RLS."
      />

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Domínios ativos" value={activeDomainsCount} />
        <StatCard
          label="Projetos ativos/waiting"
          value={activeOrWaitingProjectsCount}
        />
        <StatCard label="Tarefas abertas" value={openTasksCount} />
        <StatCard
          label="Prazos próximos"
          value={dueSoonTasksCount}
          detail="Tarefas abertas vencidas ou nos próximos 7 dias"
        />
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-zinc-950">
              Projetos principais
            </h2>
            <StatusBadge label="até 5" />
          </div>

          {mainProjectsResult.data.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Nenhum projeto ativo"
                description="Rode o seed inicial ou ative projetos para vê-los no Today."
              />
            </div>
          ) : (
            <div className="mt-4 divide-y divide-zinc-100">
              {mainProjectsResult.data.map((project) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                  key={project.id}
                >
                  <div>
                    <p className="font-medium text-zinc-950">{project.name}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {project.type} · {formatDate(project.target_date)}
                    </p>
                  </div>
                  <StatusBadge
                    label={project.status}
                    tone={project.status === "waiting" ? "amber" : "green"}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <h2 className="font-semibold text-zinc-950">Inbox</h2>
          <p className="mt-3 text-3xl font-semibold text-zinc-950">
            {inboxOpenTasksCount}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            {inboxResult.data
              ? inboxOpenTasksCount === 0
                ? "Inbox vazia."
                : "Itens abertos aguardando triagem."
              : "Domínio Inbox não encontrado."}
          </p>
        </div>
      </section>
    </main>
  );
}
