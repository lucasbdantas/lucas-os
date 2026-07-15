import { CaptureTaskSubmitButton } from "@/components/capture/capture-task-submit-button";
import { createTaskFromPendingCapture } from "@/lib/captures/actions";

export type CaptureDomainOption = {
  id: string;
  name: string;
  is_system?: boolean;
};

export type CaptureProjectOption = {
  id: string;
  name: string;
  domain_id: string;
  domainName?: string;
};

type CaptureTaskFormProps = {
  captureId: string;
  rawText: string;
  domains: CaptureDomainOption[];
  projects: CaptureProjectOption[];
  returnTo: string;
  defaultValues?: {
    context?: string | null;
    domainId?: string | null;
    dueDate?: string | null;
    dueTime?: string | null;
    energyRequired?: string | null;
    notes?: string | null;
    priority?: "low" | "medium" | "high" | "critical";
    projectId?: string | null;
    reminderOffsets?: number[];
    reason?: string;
    title?: string;
  };
  label?: string;
  resolutionMode?: "task" | "ai_task";
};

function getDefaultTitle(rawText: string) {
  return rawText.trim().slice(0, 220);
}

export function CaptureTaskForm({
  captureId,
  rawText,
  domains,
  defaultValues,
  label = "Criar tarefa",
  projects,
  returnTo,
  resolutionMode = "task",
}: CaptureTaskFormProps) {
  const defaultTitle = defaultValues?.title ?? getDefaultTitle(rawText);

  return (
    <details className="app-card-soft mt-4 p-3">
      <summary className="cursor-pointer text-sm font-medium text-zinc-800">
        {label}
      </summary>

      <form action={createTaskFromPendingCapture} className="mt-4 grid gap-4">
        <input name="captureId" type="hidden" value={captureId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        <input name="resolutionMode" type="hidden" value={resolutionMode} />

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Titulo</span>
          <input
            className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
            defaultValue={defaultTitle}
            maxLength={220}
            name="title"
            required
            type="text"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Notas</span>
          <textarea
            className="field-control mt-2 min-h-20 w-full px-3 py-2 text-sm outline-none"
            defaultValue={defaultValues?.notes ?? ""}
            maxLength={4000}
            name="notes"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Dominio</span>
            <select
              className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
              defaultValue={defaultValues?.domainId ?? ""}
              name="domainId"
            >
              <option value="">Inbox automatica</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Projeto opcional
            </span>
            <select
              className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
              defaultValue={defaultValues?.projectId ?? ""}
              name="projectId"
            >
              <option value="">Sem projeto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.domainName
                    ? `${project.name} - ${project.domainName}`
                    : project.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Data</span>
            <input
              className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
              defaultValue={defaultValues?.dueDate ?? ""}
              name="dueDate"
              type="date"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Horario</span>
            <input
              className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
              defaultValue={defaultValues?.dueTime ?? ""}
              name="dueTime"
              type="time"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Prioridade
            </span>
            <select
              className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
              defaultValue={defaultValues?.priority ?? "medium"}
              name="priority"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Energia</span>
            <select
              className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
              defaultValue={defaultValues?.energyRequired ?? ""}
              name="energyRequired"
            >
              <option value="">Sem definir</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Contexto</span>
            <input
              className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
              defaultValue={defaultValues?.context ?? ""}
              maxLength={80}
              name="context"
              placeholder="computador, casa..."
              type="text"
            />
          </label>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-zinc-700">Lembretes</legend>
          <div className="flex flex-wrap gap-3 text-sm text-zinc-700">
            {[
              [0, "Na hora"],
              [15, "15 min antes"],
              [60, "1 hora antes"],
              [1440, "1 dia antes"],
            ].map(([value, label]) => (
              <label className="flex items-center gap-2" key={value}>
                <input
                  className="size-4 accent-[var(--emerald)]"
                  defaultChecked={defaultValues?.reminderOffsets?.includes(Number(value))}
                  name="reminderOffsets"
                  type="checkbox"
                  value={value}
                />
                {label}
              </label>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            Lembretes so funcionam quando a task tem data e horario.
          </p>
        </fieldset>

        {defaultValues?.reason ? (
          <p className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            Motivo da IA: {defaultValues.reason}
          </p>
        ) : null}

        <CaptureTaskSubmitButton />
      </form>
    </details>
  );
}
