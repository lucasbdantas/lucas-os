"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type {
  CaptureDomainOption,
  CaptureProjectOption,
} from "@/components/capture/capture-task-form";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createPendingCapture,
  createTaskFromSmartCapture,
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
      className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
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
      className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Criando..." : "Confirmar e criar task"}
    </button>
  );
}

export function SmartCaptureForm({
  domains,
  projects,
  returnTo,
}: SmartCaptureFormProps) {
  const [rawText, setRawText] = useState("");
  const parsed = useMemo(() => parseSimpleCapture(rawText), [rawText]);
  const parsedTitle = parsed.kind === "task" ? parsed.title : "";
  const statusLabel =
    parsed.kind === "task"
      ? "preview task"
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
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Texto bruto</span>
        <textarea
          className="mt-2 min-h-36 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-zinc-900"
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
            <span className="text-sm font-medium text-zinc-700">Titulo</span>
            <input
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              defaultValue={parsedTitle.slice(0, 220)}
              key={parsedTitle}
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
              <span className="text-sm font-medium text-zinc-700">
                Dominio
              </span>
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
              <span className="text-sm font-medium text-zinc-700">
                Horario
              </span>
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
              <span className="text-sm font-medium text-zinc-700">
                Energia
              </span>
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
              <span className="text-sm font-medium text-zinc-700">
                Contexto
              </span>
              <input
                className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
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
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              onClick={clearForm}
              type="button"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <form action={createPendingCapture} className="mt-4">
        <input name="returnTo" type="hidden" value={returnTo} />
        <input name="source" type="hidden" value="manual" />
        <input name="rawText" type="hidden" value={rawText} />
        <div className="flex flex-wrap gap-2">
          <PendingSubmitButton />
          <button
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
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
