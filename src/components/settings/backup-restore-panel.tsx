"use client";

import { FileJson, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";
import {
  previewBackupRestore,
  type BackupRestorePreviewState,
} from "@/lib/backup/restore-actions";

const initialState: BackupRestorePreviewState = {
  message: "",
  ok: false,
  preview: null,
};

const entityLabels = {
  app_settings: "Preferências seguras",
  domains: "Domínios",
  milestones: "Milestones",
  projects: "Projetos",
  tasks: "Tasks",
};

export function BackupRestorePanel() {
  const [state, setState] = useState(initialState);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;

    setIsPending(true);
    setFileName(file.name);
    setState(initialState);

    try {
      if (file.size > 5_000_000) {
        setState({
          message: "O arquivo excede o limite seguro de 5 MB.",
          ok: false,
          preview: null,
        });
        return;
      }

      setState(await previewBackupRestore(await file.text()));
    } catch {
      setState({
        message: "Não foi possível ler o arquivo selecionado.",
        ok: false,
        preview: null,
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="app-card p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
        />
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            Preview de restauração
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
            Selecione um export do Lucas OS para comparar com sua conta atual.
            Esta versão é somente leitura: não cria, atualiza ou apaga dados.
          </p>
        </div>
      </div>

      <label className="soft-button mt-5 min-h-12 cursor-pointer justify-center gap-2 px-4 py-3 text-sm font-semibold sm:inline-flex">
        <Upload aria-hidden="true" className="h-4 w-4" />
        {isPending ? "Analisando backup..." : "Selecionar arquivo JSON"}
        <input
          accept="application/json,.json"
          className="sr-only"
          disabled={isPending}
          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
          type="file"
        />
      </label>

      {fileName ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
          <FileJson aria-hidden="true" className="h-4 w-4" />
          <span className="break-all">{fileName}</span>
        </p>
      ) : null}

      {state.message ? (
        <p
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            state.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      {state.preview ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(state.preview.entities).map(([entity, counts]) => (
              <div className="app-card-muted min-w-0 p-3" key={entity}>
                <h3 className="text-sm font-semibold text-zinc-950">
                  {entityLabels[entity as keyof typeof entityLabels]}
                </h3>
                <dl className="mt-2 space-y-1 text-xs text-zinc-600">
                  <div className="flex justify-between gap-2">
                    <dt>Criar</dt>
                    <dd className="font-semibold">{counts.create}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Atualizar</dt>
                    <dd className="font-semibold">{counts.update}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Inválidos</dt>
                    <dd className="font-semibold">{counts.invalid}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <div className="app-card-muted p-4">
            <h3 className="text-sm font-semibold text-zinc-950">
              Proteções aplicadas
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-600">
              {state.preview.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              Excluídos: {state.preview.excludedEntities.join(", ")}.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
