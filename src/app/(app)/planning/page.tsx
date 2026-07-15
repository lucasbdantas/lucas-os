import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getDailyPlanById,
  getDailyPlanningPersistenceAvailability,
  getRecentDailyPlans,
} from "@/lib/ai/daily-plan-repository";
import type { StoredDailyPlan } from "@/lib/ai/daily-planning";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireSession } from "@/lib/supabase/require-session";

type PlanningPageProps = {
  searchParams: Promise<{ id?: string }>;
};

function StoredPlan({ plan }: { plan: StoredDailyPlan }) {
  return (
    <section className="section-shell">
      <SectionHeader
        action={<StatusBadge label={`Revisao ${plan.generation}`} tone="blue" />}
        description={`Gerado em ${formatDateTime(plan.generatedAt, "Sem data", plan.timezone)} no fuso ${plan.timezone}.`}
        title={`Plano de ${formatDate(plan.planDate)}`}
      />

      <div className="mt-5 grid gap-5">
        <div className="app-card-muted p-4">
          <p className="text-base leading-7 text-zinc-800">{plan.plan.summary}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <PlanItems
            items={plan.plan.priorities.map(
              (item) => `${item.title}: ${item.reason}`,
            )}
            title="Prioridades"
          />
          <PlanItems items={plan.plan.frictions} title="Riscos e atritos" />
          <PlanItems
            items={plan.plan.reschedulingSuggestions.map(
              (item) => `${item.title}: ${item.reason}`,
            )}
            title="Sugestoes de reagendamento"
          />
          <PlanItems
            items={plan.plan.triageSuggestions.map(
              (item) => `${item.title}: ${item.reason}`,
            )}
            title="Triagem sugerida"
          />
        </div>
        <PlanItems items={plan.plan.nextSteps} title="Proximos passos" />
      </div>
    </section>
  );
}

function PlanItems({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <h2 className="mb-2 font-semibold text-zinc-950">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhum item registrado.</p>
      ) : (
        <ul className="grid gap-2 text-sm leading-6 text-zinc-700">
          {items.map((item, index) => (
            <li className="app-card-soft p-3" key={`${item}-${index}`}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function PlanningPage({ searchParams }: PlanningPageProps) {
  const { id } = await searchParams;
  const { supabase, user } = await requireSession();
  const availability = await getDailyPlanningPersistenceAvailability(
    supabase,
  ).catch(() => ({ available: false }));
  const [selectedPlan, history] = availability.available
    ? await Promise.all([
        id
          ? getDailyPlanById(supabase, user.id, id).catch(() => null)
          : Promise.resolve(null),
        getRecentDailyPlans(supabase, user.id).catch(() => []),
      ])
    : [null, []];

  return (
    <main className="app-page mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Lucas OS"
        title="Historico de planos"
        description="Planos diarios salvos para consulta. Eles registram sugestoes, nunca acoes executadas pela IA."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="section-shell h-fit">
          <p className="font-semibold text-zinc-950">Ultimos 14 dias</p>
          {!availability.available ? (
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Historico indisponivel enquanto o Supabase atualiza as tabelas de planejamento.
            </p>
          ) : history.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Gere o primeiro plano no Today.
            </p>
          ) : (
            <nav className="mt-3 grid gap-2">
              {history.map((item) => (
                <Link
                  className="app-card-interactive block p-3"
                  href={`/planning?id=${encodeURIComponent(item.id)}`}
                  key={item.id}
                >
                  <p className="text-sm font-medium text-zinc-950">
                    {formatDate(item.planDate)}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">
                    {item.summary}
                  </p>
                </Link>
              ))}
            </nav>
          )}
        </aside>

        {!availability.available ? (
          <EmptyState
            description="As tabelas de planejamento ainda não estão disponíveis no Supabase. O restante do Lucas OS continua funcionando."
            title="Planejamento temporariamente indisponivel"
          />
        ) : selectedPlan ? (
          <StoredPlan plan={selectedPlan} />
        ) : (
          <EmptyState
            description={
              history.length > 0
                ? "Escolha um plano no historico para abrir em modo leitura."
                : "O historico aparecera aqui depois que voce gerar um plano no Today."
            }
            title={history.length > 0 ? "Selecione um plano" : "Sem planos salvos"}
          />
        )}
      </div>
    </main>
  );
}
