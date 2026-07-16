"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import {
  previewContentNoteRewrite,
  saveContentNoteRewrite,
} from "@/lib/library/note-ai-actions";

export function ContentNoteAIRewrite({
  existingRewrite,
  noteId,
}: {
  existingRewrite: string | null;
  noteId: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [savedRewrite, setSavedRewrite] = useState(existingRewrite);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function generate() {
    setPending(true);
    setMessage(null);
    const result = await previewContentNoteRewrite(noteId);
    setPending(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setPreview(result.rewrite);
    setMessage("Preview pronto. Revise antes de confirmar.");
  }

  async function save() {
    if (!preview) return;
    setPending(true);
    const result = await saveContentNoteRewrite(noteId, preview);
    setPending(false);
    setMessage(result.message ?? null);

    if (result.ok) {
      setSavedRewrite(result.rewrite);
      setPreview(null);
    }
  }

  return (
    <div className="mt-4 border-t border-zinc-200 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-950">Reescrita com IA</p>
        <button className="soft-button min-h-11 gap-2 px-3 py-2 text-sm font-semibold" disabled={pending} onClick={() => void generate()} type="button">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          {pending ? "Preparando..." : "Reescrever com IA"}
        </button>
      </div>

      {savedRewrite ? (
        <div className="app-card-muted mt-3 p-3">
          <p className="text-xs font-semibold uppercase text-zinc-500">Versão confirmada</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{savedRewrite}</p>
        </div>
      ) : null}

      {preview !== null ? (
        <div className="mt-3 grid gap-3">
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Preview editável
            <textarea className="field-control min-h-36 px-3 py-2" onChange={(event) => setPreview(event.target.value)} value={preview} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button className="primary-button min-h-11 px-4 py-2 text-sm font-semibold" disabled={pending || !preview.trim()} onClick={() => void save()} type="button">
              Confirmar e salvar reescrita
            </button>
            <button className="ghost-button min-h-11 px-4 py-2 text-sm font-semibold" onClick={() => setPreview(null)} type="button">
              Cancelar preview
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm leading-6 text-zinc-600" role="status">{message}</p> : null}
      <p className="mt-2 text-xs leading-5 text-zinc-500">A nota original sempre permanece visível. A IA não salva nada sem sua confirmação.</p>
    </div>
  );
}
