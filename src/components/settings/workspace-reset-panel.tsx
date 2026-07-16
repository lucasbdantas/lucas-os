"use client";

import { Eraser, FolderPlus, ListPlus, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  resetWorkspace,
  type WorkspaceResetState,
} from "@/lib/workspace-reset/actions";
import {
  WORKSPACE_RESET_CONFIRMATION,
  getWorkspaceResetTotal,
  type WorkspaceResetCounts,
} from "@/lib/workspace-reset/policy";

const initialState: WorkspaceResetState = { message: "", status: "idle" };

const countLabels: Record<keyof WorkspaceResetCounts, string> = {
  compatibilityDailyPlans: "Planos no modo compatibilidade",
  contentItems: "Conteúdos da Biblioteca",
  contentNotes: "Notas da Biblioteca",
  dailyPlanFeedback: "Feedback de planos",
  dailyPlans: "Planos diários",
  milestones: "Milestones",
  notifications: "Notificações",
  pendingCaptures: "Capturas pendentes",
  projects: "Projetos",
  pushDeliveries: "Histórico de entregas push",
  tasks: "Tasks",
};

export function WorkspaceResetPanel({
  counts,
}: {
  counts: WorkspaceResetCounts;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [state, action, isPending] = useActionState(resetWorkspace, initialState);
  const isConfirmed = confirmation === WORKSPACE_RESET_CONFIRMATION;

  if (state.status === "success") {
    return (
      <div className="app-card p-5" aria-live="polite">
        <div className="flex items-start gap-3">
          <RotateCcw aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Workspace pronto para recomeçar
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{state.message}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <ResetLink href="/tasks#task-form" icon={ListPlus} label="Criar primeira task" />
          <ResetLink href="/projects" icon={FolderPlus} label="Criar primeiro projeto" />
          <ResetLink href="/quick-capture" icon={Eraser} label="Abrir Quick Capture" />
          <ResetLink href="/today" icon={RotateCcw} label="Gerar plano do dia" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Limpar workspace</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Remove somente dados operacionais desta conta. A limpeza começa
            apenas depois da confirmação explícita e nunca apaga configurações.
          </p>
        </div>
        <span className="status-badge" data-tone="amber">
          {getWorkspaceResetTotal(counts)} registros no preview
        </span>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(counts).map(([key, count]) => (
          <div className="app-card-muted flex items-center justify-between gap-3 p-3" key={key}>
            <span className="text-sm text-zinc-600">
              {countLabels[key as keyof WorkspaceResetCounts]}
            </span>
            <strong className="text-sm text-zinc-950">{count}</strong>
          </div>
        ))}
      </div>

      <form action={action} className="mt-6 border-t border-zinc-200 pt-5">
        <label className="grid gap-2 text-sm font-medium text-zinc-800" htmlFor="workspace-reset-confirmation">
          Para confirmar, digite exatamente:
          <code className="w-fit rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-800">
            {WORKSPACE_RESET_CONFIRMATION}
          </code>
          <input
            aria-describedby="workspace-reset-help"
            autoComplete="off"
            className="form-input min-h-12"
            id="workspace-reset-confirmation"
            name="confirmation"
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={WORKSPACE_RESET_CONFIRMATION}
            spellCheck={false}
            value={confirmation}
          />
        </label>
        <p className="mt-2 text-xs leading-5 text-zinc-500" id="workspace-reset-help">
          Não há confirmação aproximada: espaços extras, caixa diferente ou texto incompleto são rejeitados.
        </p>

        {state.status === "error" ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {state.message}
          </p>
        ) : null}

        <button
          className="danger-button mt-5 min-h-12 gap-2 px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isConfirmed || isPending}
          type="submit"
        >
          <Eraser aria-hidden="true" className="h-4 w-4" />
          {isPending ? "Limpando workspace..." : "Limpar workspace"}
        </button>
      </form>
    </div>
  );
}

function ResetLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Eraser;
  label: string;
}) {
  return (
    <Link className="soft-button min-h-12 justify-start gap-2 px-4 py-3 text-sm font-semibold" href={href}>
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </Link>
  );
}
