"use client";

import { Sparkles } from "lucide-react";
import { useActionState } from "react";
import { generateWeeklyReview } from "@/lib/ai/weekly-review-actions";
import { initialWeeklyReviewAIState } from "@/lib/ai/weekly-review";

export function WeeklyAIReviewPanel() {
  const [state, action, isPending] = useActionState(
    generateWeeklyReview,
    initialWeeklyReviewAIState,
  );

  return (
    <section className="section-shell">
      <div className="app-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles aria-hidden="true" className="h-5 w-5 text-green-700" />
              <h2 className="text-lg font-semibold text-zinc-950">
                Revisão semanal assistida
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              Gera uma leitura resumida da semana. A IA não cria, edita ou
              conclui nada; todas as recomendações são apenas sugestões.
            </p>
          </div>
          <form action={action}>
            <button
              className="primary-button min-h-11 gap-2 px-4 py-2.5 text-sm font-semibold"
              disabled={isPending}
              type="submit"
            >
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {isPending ? "Gerando revisão..." : "Gerar revisão com IA"}
            </button>
          </form>
        </div>

        {state.status === "error" ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {state.message}
          </p>
        ) : null}

        {state.status === "ready" ? (
          <div className="mt-5 space-y-5" aria-live="polite">
            <div className="app-card-muted p-4">
              <h3 className="font-semibold text-zinc-950">Resumo da semana</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {state.review.summary}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ReviewList title="Vitórias" items={state.review.wins} />
              <ReviewList title="Pendências" items={state.review.pending} />
              <ReviewList title="Gargalos" items={state.review.bottlenecks} />
              <ReviewList
                title="Próxima semana"
                items={state.review.recommendations}
              />
            </div>
            <ReviewList
              title="Projetos que pedem próxima ação"
              items={state.review.projectsNeedingNextAction.map(
                (project) => `${project.name}: ${project.reason}`,
              )}
            />
            <p className="text-xs text-zinc-500">
              Revisão não persistida. Recarregar a página remove este resultado.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ReviewList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="app-card-muted p-4">
      <h3 className="font-semibold text-zinc-950">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">Nenhum item sugerido.</p>
      ) : (
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-700">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
