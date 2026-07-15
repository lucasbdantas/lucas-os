"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { generateDailyPlan } from "@/lib/ai/daily-planning-actions";
import {
  initialDailyPlanningState,
  type DailyPlanningState,
} from "@/lib/ai/daily-planning";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="primary-button px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Gerando plano..." : "Gerar plano do dia com IA"}
    </button>
  );
}

function PlanList({
  items,
  emptyLabel,
}: {
  items: Array<{ title: string; reason: string; href?: string }>;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div className="app-card-soft p-3" key={`${item.title}-${index}`}>
          <p className="font-medium text-zinc-950">{item.title}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{item.reason}</p>
          {item.href ? (
            <Link className="soft-button mt-3 inline-flex px-3 py-2 text-sm font-semibold" href={item.href}>
              Abrir origem
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ReadyPlan({ plan }: { plan: NonNullable<DailyPlanningState["plan"]> }) {
  return (
    <div className="mt-5 grid gap-5">
      <div className="app-card-muted p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label="Plano pronto" tone="blue" />
          <span className="text-sm text-zinc-600">Sugestao para revisao humana.</span>
        </div>
        <p className="mt-3 text-base leading-7 text-zinc-800">{plan.summary}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold text-zinc-950">3 prioridades principais</h3>
          <PlanList emptyLabel="Nenhuma prioridade clara foi sugerida." items={plan.priorities} />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-zinc-950">Riscos e atritos</h3>
          {plan.frictions.length > 0 ? (
            <ul className="grid gap-2 text-sm leading-6 text-zinc-700">
              {plan.frictions.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}
            </ul>
          ) : <p className="text-sm text-zinc-500">Nenhum atrito destacado.</p>}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold text-zinc-950">Reagendamento possível</h3>
          <PlanList emptyLabel="Nenhuma sugestao de reagendamento." items={plan.reschedulingSuggestions} />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-zinc-950">Capturas e emails para triagem</h3>
          {plan.triageSuggestions.length > 0 ? (
            <div className="grid gap-3">
              {plan.triageSuggestions.map((item, index) => (
                <div className="app-card-soft p-3" key={`${item.title}-${index}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={item.kind === "capture" ? "capture" : "email"} />
                    <p className="font-medium text-zinc-950">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{item.reason}</p>
                  {item.href ? <Link className="soft-button mt-3 inline-flex px-3 py-2 text-sm font-semibold" href={item.href}>Abrir triagem</Link> : null}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-zinc-500">Nenhuma captura ou email foi destacado.</p>}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-zinc-950">Próximos passos</h3>
        {plan.nextSteps.length > 0 ? (
          <ol className="grid gap-2 text-sm leading-6 text-zinc-700">
            {plan.nextSteps.map((item, index) => <li key={`${item}-${index}`}>{index + 1}. {item}</li>)}
          </ol>
        ) : <p className="text-sm text-zinc-500">Nenhum próximo passo adicional.</p>}
      </div>
    </div>
  );
}

export function DailyPlanningPanel() {
  const [state, action] = useActionState(
    generateDailyPlan,
    initialDailyPlanningState,
  );

  return (
    <section className="section-shell">
      <SectionHeader
        action={<StatusBadge label="approval-first" tone="blue" />}
        description="Um briefing curto baseado nos dados atuais. A IA apenas sugere e nunca executa ações."
        title="Plano sugerido"
      />
      <form action={action} className="mt-4">
        <SubmitButton />
      </form>
      {state.status === "error" ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {state.message}
        </div>
      ) : null}
      {state.status === "ready" && state.plan ? <ReadyPlan plan={state.plan} /> : null}
      {state.status === "idle" ? (
        <div className="mt-4">
          <EmptyState
            description="Gere um briefing quando quiser revisar prioridades, atritos e triagens do dia."
            title="Nenhum plano gerado"
          />
        </div>
      ) : null}
    </section>
  );
}
