"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  CaptureTaskForm,
  type CaptureDomainOption,
  type CaptureProjectOption,
} from "@/components/capture/capture-task-form";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AICapturePreviewState } from "@/lib/captures/ai-preview";
import { previewPendingCaptureWithAI } from "@/lib/captures/actions";

type PendingCaptureAIPreviewProps = {
  captureId: string;
  domains: CaptureDomainOption[];
  projects: CaptureProjectOption[];
  rawText: string;
  returnTo: string;
};

const initialState: AICapturePreviewState = {
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="soft-button px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Sugerindo..." : "Sugerir task com IA"}
    </button>
  );
}

function getStateTone(status: AICapturePreviewState["status"]) {
  if (status === "task") return "blue";
  if (status === "error") return "red";

  return "amber";
}

export function PendingCaptureAIPreview({
  captureId,
  domains,
  projects,
  rawText,
  returnTo,
}: PendingCaptureAIPreviewProps) {
  const [state, action] = useActionState(
    previewPendingCaptureWithAI,
    initialState,
  );

  return (
    <div className="mt-3">
      <form action={action}>
        <input name="captureId" type="hidden" value={captureId} />
        <SubmitButton />
      </form>

      {state.status !== "idle" ? (
        <div className="app-card-soft mt-3 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={state.status === "task" ? "preview IA" : state.status}
              tone={getStateTone(state.status)}
            />
            {state.message ? (
              <p className="text-sm text-blue-900">{state.message}</p>
            ) : null}
          </div>

          {state.status === "task" && state.preview ? (
            <CaptureTaskForm
              captureId={captureId}
              defaultValues={{
                domainId: state.preview.domainId,
                dueDate: state.preview.dueDate,
                dueTime: state.preview.dueTime,
                notes: state.preview.notes,
                priority: state.preview.priority,
                projectId: state.preview.projectId,
                reason: state.preview.reason,
                title: state.preview.title,
              }}
              domains={domains}
              label="Confirmar preview IA"
              projects={projects}
              rawText={rawText}
              resolutionMode="ai_task"
              returnTo={returnTo}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
