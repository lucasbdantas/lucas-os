"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type {
  CaptureDomainOption,
  CaptureProjectOption,
} from "@/components/capture/capture-task-form";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AICapturePreviewState } from "@/lib/captures/ai-preview";
import {
  createPendingCapture,
  createTaskFromSmartCapture,
  previewCaptureWithAI,
} from "@/lib/captures/actions";
import { parseSimpleCapture } from "@/lib/captures/simple-parser";

type SmartCaptureFormProps = {
  domains: CaptureDomainOption[];
  projects: CaptureProjectOption[];
  returnTo: string;
};

function PendingSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="soft-button px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Salvando..." : "Salvar como pending"}
    </button>
  );
}

function TaskSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="primary-button px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Criando..." : "Confirmar e criar tarefa"}
    </button>
  );
}

function AISubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="soft-button px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Sugerindo..." : "Sugerir com IA"}
    </button>
  );
}

const initialAIState: AICapturePreviewState = {
  status: "idle",
};

export function SmartCaptureForm({
  domains,
  projects,
  returnTo,
}: SmartCaptureFormProps) {
  const [rawText, setRawText] = useState("");
  const [aiState, aiAction] = useActionState(
    previewCaptureWithAI,
    initialAIState,
  );
  const parsed = useMemo(() => parseSimpleCapture(rawText), [rawText]);
  const parsedTitle = parsed.kind === "task" ? parsed.title : "";
  const statusLabel =
    parsed.kind === "task"
      ? "prévia de tarefa"
      : parsed.kind === "multiple_lines"
        ? "multiplas linhas"
        : "pending";
  const statusTone = parsed.kind === "task" ? "green" : "amber";
  const statusMessage =
    parsed.kind === "task"
      ? "Prefixo reconhecido. Revise antes de criar."
      : parsed.kind === "multiple_lines"
        ? "Captura com multiplas linhas detectada. Salve como pending ou envie uma captura por vez."
        : "Sem regra simples detectada. Salve para triagem posterior.";

  function clearForm() {
    setRawText("");
  }

  return (
    <div className="capture-card p-4">
      <label className="block">
        <span className="text-sm font-semibold text-zinc-800">Texto bruto</span>
        <textarea
          className="field-control mt-2 min-h-36 w-full px-4 py-3 text-sm leading-6 outline-none"
          maxLength={12000}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="Ex: task: comprar cabo USB"
          value={rawText}
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge label={statusLabel} tone={statusTone} />
        <p className="text-sm text-zinc-600">{statusMessage}</p>
      </div>

      {parsed.kind === "task" ? (
        <form action={createTaskFromSmartCapture} className="mt-5 grid gap-4">
          <input name="returnTo" type="hidden" value={returnTo} />

          <label className="block">
            <span className="text-sm font-semibold text-zinc-800">Titulo</span>
            <input
              className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
              defaultValue={parsedTitle.slice(0, 220)}
              key={parsedTitle}
              maxLength={220}
              name="title"
              required
              type="text"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-800">Notas</span>
            <textarea
              className="field-control mt-2 min-h-20 w-full px-3 py-2 text-sm outline-none"
              maxLength={4000}
              name="notes"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                Domínio
              </span>
              <select
                className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
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
                name="dueDate"
                type="date"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                Horário
              </span>
              <input
                className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
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
              <span className="text-sm font-medium text-zinc-700">
                Energia
              </span>
              <select
                className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
                name="energyRequired"
              >
                <option value="">Sem definir</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                Contexto
              </span>
              <input
                className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
                maxLength={80}
                name="context"
                placeholder="computador, casa..."
                type="text"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <TaskSubmitButton />
            <button
              className="ghost-button px-4 py-2.5 text-sm font-semibold"
              onClick={clearForm}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <form action={aiAction} className="mt-4">
        <input name="rawText" type="hidden" value={rawText} />
        <AISubmitButton />
      </form>

      {aiState.status !== "idle" ? (
        <div className="app-card-soft mt-4 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={aiState.status === "task" ? "Prévia da IA" : aiState.status}
              tone={aiState.status === "task" ? "blue" : "amber"}
            />
            {aiState.message ? (
              <p className="text-sm text-blue-900">{aiState.message}</p>
            ) : null}
          </div>
          {aiState.status === "task" && aiState.preview ? (
            <form
              action={createTaskFromSmartCapture}
              className="mt-4 grid gap-4"
            >
              <input name="returnTo" type="hidden" value={returnTo} />

              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  Titulo
                </span>
                <input
                  className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
                  defaultValue={aiState.preview.title}
                  maxLength={220}
                  name="title"
                  required
                  type="text"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-zinc-700">
                  Notas
                </span>
                <textarea
                  className="field-control mt-2 min-h-20 w-full px-3 py-2 text-sm outline-none"
                  defaultValue={aiState.preview.notes ?? ""}
                  maxLength={4000}
                  name="notes"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">
                    Domínio
                  </span>
                  <select
                    className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
                    defaultValue={aiState.preview.domainId ?? ""}
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
                    defaultValue={aiState.preview.projectId ?? ""}
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
                  <span className="text-sm font-medium text-zinc-700">
                    Data
                  </span>
                  <input
                    className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
                    defaultValue={aiState.preview.dueDate ?? ""}
                    name="dueDate"
                    type="date"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">
                    Horário
                  </span>
                  <input
                    className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
                    defaultValue={aiState.preview.dueTime ?? ""}
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
                    defaultValue={aiState.preview.priority}
                    name="priority"
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">
                    Energia
                  </span>
                  <select
                    className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
                    name="energyRequired"
                  >
                    <option value="">Sem definir</option>
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-zinc-700">
                    Contexto
                  </span>
                  <input
                    className="field-control mt-2 w-full px-3 py-2 text-sm outline-none"
                    maxLength={80}
                    name="context"
                    placeholder="computador, casa..."
                    type="text"
                  />
                </label>
              </div>

              <p className="text-sm text-blue-900">
                Motivo da IA: {aiState.preview.reason}
              </p>

              <TaskSubmitButton />
            </form>
          ) : null}
        </div>
      ) : null}

      <form action={createPendingCapture} className="mt-4">
        <input name="returnTo" type="hidden" value={returnTo} />
        <input name="source" type="hidden" value="manual" />
        <input name="rawText" type="hidden" value={rawText} />
        <div className="flex flex-wrap gap-2">
          <PendingSubmitButton />
          <button
            className="ghost-button px-4 py-2.5 text-sm font-semibold"
            onClick={clearForm}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
