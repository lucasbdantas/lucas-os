"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  generateDailyPlan,
  saveDailyPlanFeedback,
} from "@/lib/ai/daily-planning-actions";
import {
  getDailyPlanFeedbackKey,
  initialDailyPlanFeedbackState,
  initialDailyPlanningState,
  type DailyPlanFeedbackRating,
  type DailyPlanFeedbackTargetType,
  type DailyPlanHistoryItem,
  type DailyPlanningState,
  type StoredDailyPlan,
} from "@/lib/ai/daily-planning";
import { formatDate, formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";

const feedbackOptions: Array<{
  label: string;
  value: DailyPlanFeedbackRating;
}> = [
  { label: "Util", value: "useful" },
  { label: "Não foi útil", value: "not_useful" },
  { label: "Errado", value: "wrong" },
  { label: "Feito", value: "done" },
  { label: "Ignorado", value: "ignored" },
];

function SubmitButton({ hasPlan }: { hasPlan: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="primary-button px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending
        ? "Gerando plano..."
        : hasPlan
          ? "Regenerar plano"
          : "Gerar plano do dia com IA"}
    </button>
  );
}

function FeedbackControls({
  initialRating,
  plan,
  targetIndex,
  targetType,
}: {
  initialRating?: DailyPlanFeedbackRating;
  plan: StoredDailyPlan;
  targetIndex: number;
  targetType: DailyPlanFeedbackTargetType;
}) {
  const [state, action] = useActionState(
    saveDailyPlanFeedback,
    initialDailyPlanFeedbackState,
  );
  const selectedRating =
    state.status === "saved" ? state.rating : initialRating;

  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-1.5">
      <input name="dailyPlanId" type="hidden" value={plan.id} />
      <input name="planGeneration" type="hidden" value={plan.generation} />
      <input name="targetIndex" type="hidden" value={targetIndex} />
      <input name="targetType" type="hidden" value={targetType} />
      {feedbackOptions.map((option) => (
        <button
          aria-pressed={selectedRating === option.value}
          className="soft-button px-2.5 py-1.5 text-xs font-medium aria-pressed:border-emerald-700 aria-pressed:bg-emerald-50 aria-pressed:text-emerald-900"
          key={option.value}
          name="rating"
          type="submit"
          value={option.value}
        >
          {option.label}
        </button>
      ))}
      {state.status === "error" && state.message ? (
        <p className="basis-full text-xs text-red-700">{state.message}</p>
      ) : null}
    </form>
  );
}

function PlanList({
  emptyLabel,
  items,
  plan,
  targetType,
}: {
  emptyLabel: string;
  items: Array<{ title: string; reason: string; href?: string }>;
  plan: StoredDailyPlan;
  targetType: "priority" | "reschedule" | "triage";
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
            <Link
              className="soft-button mt-3 inline-flex px-3 py-2 text-sm font-semibold"
              href={item.href}
            >
              {targetType === "triage" ? "Abrir triagem" : "Abrir origem"}
            </Link>
          ) : null}
          <FeedbackControls
            initialRating={
              plan.feedback[getDailyPlanFeedbackKey(targetType, index)]
            }
            plan={plan}
            targetIndex={index}
            targetType={targetType}
          />
        </div>
      ))}
    </div>
  );
}

function FeedbackTextList({
  emptyLabel,
  items,
  plan,
  targetType,
}: {
  emptyLabel: string;
  items: string[];
  plan: StoredDailyPlan;
  targetType: "risk" | "next_step";
}) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div className="app-card-soft p-3" key={`${item}-${index}`}>
          <p className="text-sm leading-6 text-zinc-700">{item}</p>
          <FeedbackControls
            initialRating={
              plan.feedback[getDailyPlanFeedbackKey(targetType, index)]
            }
            plan={plan}
            targetIndex={index}
            targetType={targetType}
          />
        </div>
      ))}
    </div>
  );
}

function ReadyPlan({ plan }: { plan: StoredDailyPlan }) {
  return (
    <div className="mt-5 grid gap-5">
      <div className="app-card-muted p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label="Plano salvo" tone="green" />
          <span className="text-sm text-zinc-600">
            Gerado em {formatDateTime(plan.generatedAt, "agora", plan.timezone)}. Revisão {plan.generation}.
          </span>
        </div>
        <p className="mt-3 text-base leading-7 text-zinc-800">{plan.plan.summary}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold text-zinc-950">3 prioridades principais</h3>
          <PlanList
            emptyLabel="Nenhuma prioridade clara foi sugerida."
            items={plan.plan.priorities}
            plan={plan}
            targetType="priority"
          />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-zinc-950">Riscos e atritos</h3>
          <FeedbackTextList
            emptyLabel="Nenhum atrito destacado."
            items={plan.plan.frictions}
            plan={plan}
            targetType="risk"
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold text-zinc-950">Reagendamento possivel</h3>
          <PlanList
            emptyLabel="Nenhuma sugestão de reagendamento."
            items={plan.plan.reschedulingSuggestions}
            plan={plan}
            targetType="reschedule"
          />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-zinc-950">Capturas e emails para triagem</h3>
          <PlanList
            emptyLabel="Nenhuma captura ou email foi destacado."
            items={plan.plan.triageSuggestions}
            plan={plan}
            targetType="triage"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-zinc-950">Próximos passos</h3>
        <FeedbackTextList
          emptyLabel="Nenhum proximo passo adicional."
          items={plan.plan.nextSteps}
          plan={plan}
          targetType="next_step"
        />
      </div>
    </div>
  );
}

function PlanHistory({
  currentPlanId,
  history,
}: {
  currentPlanId?: string;
  history: DailyPlanHistoryItem[];
}) {
  const previousPlans = history.filter((item) => item.id !== currentPlanId);

  if (previousPlans.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 border-t border-zinc-200 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-zinc-950">Histórico recente</p>
          <p className="mt-1 text-sm text-zinc-600">Os últimos planos ficam disponíveis em modo leitura.</p>
        </div>
        <Link className="soft-button px-3 py-2 text-sm font-medium" href="/planning">
          Ver histórico
        </Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {previousPlans.slice(0, 4).map((item) => (
          <Link
            className="app-card-interactive block p-3"
            href={`/planning?id=${encodeURIComponent(item.id)}`}
            key={item.id}
          >
            <p className="text-sm font-medium text-zinc-950">{formatDate(item.planDate)}</p>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600">{item.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DailyPlanningPanel({
  history,
  initialPlan,
  persistenceMode,
}: {
  history: DailyPlanHistoryItem[];
  initialPlan: StoredDailyPlan | null;
  persistenceMode: "tables" | "compatibility";
}) {
  const initialState: DailyPlanningState = initialPlan
    ? { plan: initialPlan, persistenceMode, status: "ready" }
    : initialDailyPlanningState;
  const [state, action] = useActionState(generateDailyPlan, initialState);
  const plan = state.plan ?? initialPlan;
  const activePersistenceMode = state.persistenceMode ?? persistenceMode;

  return (
    <section className="section-shell">
      <SectionHeader
        action={
          <div className="flex flex-wrap items-center gap-2">
            {activePersistenceMode === "compatibility" ? (
              <StatusBadge label="modo compatibilidade" tone="amber" />
            ) : null}
            <StatusBadge label="Confirmação humana" tone="blue" />
          </div>
        }
        description="Um briefing pessoal baseado nos dados atuais. A IA apenas sugere e nunca executa ações."
        title="Plano sugerido"
      />
      {activePersistenceMode === "compatibility" ? (
        <div className="feedback-panel mt-4" data-tone="warning">
          Persistência em modo compatibilidade. O plano e o feedback ficam em
          app_settings enquanto a Data API ainda não reconhece as tabelas de
          planejamento.
        </div>
      ) : null}
      <form action={action} className="mt-4">
        <SubmitButton hasPlan={Boolean(plan)} />
      </form>
      {state.status === "error" ? (
        <div className="feedback-panel mt-4" data-tone="warning" role="alert">
          {state.message}
        </div>
      ) : null}
      {plan ? <ReadyPlan plan={plan} /> : null}
      {!plan && state.status === "idle" ? (
        <div className="mt-4">
          <EmptyState
            description="Gere um briefing quando quiser revisar prioridades, atritos e triagens do dia."
            title="Nenhum plano salvo"
          />
        </div>
      ) : null}
      <PlanHistory currentPlanId={plan?.id} history={history} />
    </section>
  );
}
