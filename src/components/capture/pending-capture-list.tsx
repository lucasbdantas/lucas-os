import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CaptureTaskForm,
  type CaptureDomainOption,
  type CaptureProjectOption,
} from "@/components/capture/capture-task-form";
import { PendingCaptureAIPreview } from "@/components/capture/pending-capture-ai-preview";
import { PendingCaptureActions } from "@/components/capture/pending-capture-actions";

export type PendingCaptureListItem = {
  id: string;
  raw_text: string;
  source: string;
  status: string;
  captured_at: string;
};

type PendingCaptureListProps = {
  captures: PendingCaptureListItem[];
  domains: CaptureDomainOption[];
  projects: CaptureProjectOption[];
  returnTo: string;
};

function formatCapturedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PendingCaptureList({
  captures,
  domains,
  projects,
  returnTo,
}: PendingCaptureListProps) {
  if (captures.length === 0) {
    return (
      <EmptyState
        title="Nenhuma captura pendente"
        description="Capturas manuais salvas para triagem aparecerão aqui."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {captures.map((capture) => (
        <article className="capture-card app-card-interactive p-4" key={capture.id}>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={capture.status} tone="amber" />
                <StatusBadge label={capture.source} />
                <span className="text-sm text-zinc-500">
                  {formatCapturedAt(capture.captured_at)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-700">
                {capture.raw_text}
              </p>
            </div>
            <PendingCaptureActions
              captureId={capture.id}
              returnTo={returnTo}
            />
          </div>
          <CaptureTaskForm
            captureId={capture.id}
            domains={domains}
            projects={projects}
            rawText={capture.raw_text}
            returnTo={returnTo}
          />
          <PendingCaptureAIPreview
            captureId={capture.id}
            domains={domains}
            projects={projects}
            rawText={capture.raw_text}
            returnTo={returnTo}
          />
        </article>
      ))}
    </div>
  );
}
