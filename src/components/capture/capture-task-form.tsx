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
};

function getDefaultTitle(rawText: string) {
  return rawText.trim().slice(0, 220);
}

export function CaptureTaskForm({
  captureId,
  rawText,
  domains,
  projects,
  returnTo,
}: CaptureTaskFormProps) {
  return (
    <details className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <summary className="cursor-pointer text-sm font-medium text-zinc-800">
        Criar tarefa
      </summary>

      <form action={createTaskFromPendingCapture} className="mt-4 grid gap-4">
        <input name="captureId" type="hidden" value={captureId} />
        <input name="returnTo" type="hidden" value={returnTo} />

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Titulo</span>
          <input
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            defaultValue={getDefaultTitle(rawText)}
            maxLength={220}
            name="title"
            required
            type="text"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Notas</span>
          <textarea
            className="mt-2 min-h-20 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            maxLength={4000}
            name="notes"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Dominio</span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              name="dueDate"
              type="date"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Horario</span>
            <input
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              defaultValue="medium"
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
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              maxLength={80}
              name="context"
              placeholder="computador, casa..."
              type="text"
            />
          </label>
        </div>

        <CaptureTaskSubmitButton />
      </form>
    </details>
  );
}
