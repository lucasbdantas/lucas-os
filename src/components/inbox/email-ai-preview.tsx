"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { TaskForm, type DomainOption, type ProjectOption } from "@/components/tasks/task-form";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AICapturePreviewState } from "@/lib/captures/ai-preview";
import { previewGmailMessageWithAI } from "@/lib/integrations/google/gmail-actions";

type EmailAIPreviewProps = {
  accountId: string;
  domains: DomainOption[];
  emailNotes: string;
  messageId: string;
  projects: ProjectOption[];
  returnTo: string;
};

const initialState: AICapturePreviewState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="soft-button px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Gerando sugestao..." : "Sugerir task com IA"}
    </button>
  );
}

export function EmailAIPreview({
  accountId,
  domains,
  emailNotes,
  messageId,
  projects,
  returnTo,
}: EmailAIPreviewProps) {
  const [state, action] = useActionState(
    previewGmailMessageWithAI,
    initialState,
  );
  const notes = [emailNotes, state.preview?.notes]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n\n");

  return (
    <div className="app-card-muted mt-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label="preview IA" tone="blue" />
        <span className="text-sm text-zinc-600">
          A IA apenas sugere. Revise e confirme antes de criar.
        </span>
      </div>

      <form action={action} className="mt-4">
        <input name="accountId" type="hidden" value={accountId} />
        <input name="messageId" type="hidden" value={messageId} />
        <SubmitButton />
      </form>

      {state.status !== "idle" ? (
        <div className="mt-4 grid gap-3">
          <p className="text-sm text-zinc-700">
            {state.message ?? "Sugestao pronta para revisao."}
          </p>
          {state.status === "task" && state.preview ? (
            <StatusBadge
              label={`Confianca: ${Math.round(state.preview.confidence * 100)}%`}
              tone="blue"
            />
          ) : null}

          {state.status === "task" && state.preview ? (
            <TaskForm
              createDefaults={{
                domain_id: state.preview.domainId,
                due_date: state.preview.dueDate,
                due_time: state.preview.dueTime,
                notes,
                priority: state.preview.priority,
                project_id: state.preview.projectId,
                reminder_offsets: state.preview.reminderOffsets,
                source: "email",
                title: state.preview.title,
              }}
              domains={domains}
              projects={projects}
              returnTo={returnTo}
              submitLabel="Usar sugestao e criar task"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
