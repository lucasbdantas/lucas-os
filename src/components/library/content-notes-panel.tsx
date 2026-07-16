import { ContentNoteAIRewrite } from "@/components/library/content-note-ai-rewrite";
import {
  createContentNote,
  deleteContentNote,
  updateContentNote,
} from "@/lib/library/actions";
import { formatDateTime } from "@/lib/format";

export type ContentNoteRow = {
  ai_rewrite: string | null;
  context: string | null;
  created_at: string;
  id: string;
  note_context: string | null;
  position_label: string | null;
  raw_note: string;
};

export function ContentNotesPanel({
  itemId,
  notes,
}: {
  itemId: string;
  notes: ContentNoteRow[];
}) {
  const returnTo = `/library?item=${encodeURIComponent(itemId)}#library-notes`;

  return (
    <section className="section-shell" id="library-notes">
      <div>
        <p className="section-kicker">Caderno</p>
        <h2 className="mt-1 text-xl font-semibold text-zinc-950">Notas e aprendizados</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">Registre a ideia crua primeiro. Organizar com IA é opcional e sempre exige confirmação.</p>
      </div>

      <form action={createContentNote} className="app-card-soft grid gap-4 p-4">
        <input name="itemId" type="hidden" value={itemId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Nota original
          <textarea className="field-control min-h-36 px-3 py-2" maxLength={10000} name="rawNote" placeholder="Escreva sem polir. A ideia vem primeiro." required />
        </label>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Contexto curto
            <input className="field-control min-h-12 px-3 py-2" maxLength={160} name="noteContext" placeholder="Ex.: conceito central" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Posição
            <input className="field-control min-h-12 px-3 py-2" maxLength={160} name="positionLabel" placeholder="Ex.: capítulo 3, 18:42" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Contexto adicional
            <input className="field-control min-h-12 px-3 py-2" maxLength={2000} name="context" />
          </label>
        </div>
        <button className="primary-button min-h-12 px-4 py-3 text-sm font-semibold sm:w-fit">Salvar nota</button>
      </form>

      {notes.length ? (
        <div className="grid gap-3">
          {notes.map((note) => (
            <article className="app-card p-4 sm:p-5" key={note.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                  <span>{formatDateTime(note.created_at)}</span>
                  {note.note_context ? <span>· {note.note_context}</span> : null}
                  {note.position_label ? <span>· {note.position_label}</span> : null}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-800">{note.raw_note}</p>
              {note.context ? <p className="mt-3 text-xs leading-5 text-zinc-500">Contexto: {note.context}</p> : null}

              <ContentNoteAIRewrite existingRewrite={note.ai_rewrite} noteId={note.id} />

              <details className="mt-4 border-t border-zinc-200 pt-3">
                <summary className="cursor-pointer text-sm font-semibold text-zinc-600">Editar nota</summary>
                <form action={updateContentNote} className="mt-3 grid gap-3">
                  <input name="noteId" type="hidden" value={note.id} />
                  <input name="returnTo" type="hidden" value={returnTo} />
                  <textarea className="field-control min-h-32 px-3 py-2" defaultValue={note.raw_note} maxLength={10000} name="rawNote" required />
                  <div className="grid gap-3 md:grid-cols-3">
                    <input className="field-control min-h-11 px-3 py-2" defaultValue={note.note_context ?? ""} name="noteContext" placeholder="Contexto curto" />
                    <input className="field-control min-h-11 px-3 py-2" defaultValue={note.position_label ?? ""} name="positionLabel" placeholder="Posição" />
                    <input className="field-control min-h-11 px-3 py-2" defaultValue={note.context ?? ""} name="context" placeholder="Contexto adicional" />
                  </div>
                  <button className="soft-button min-h-11 px-4 py-2 text-sm font-semibold sm:w-fit">Salvar nota original</button>
                </form>
              </details>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-red-700">Excluir nota</summary>
                <form action={deleteContentNote} className="mt-3 flex flex-wrap items-end gap-2">
                  <input name="noteId" type="hidden" value={note.id} />
                  <input name="returnTo" type="hidden" value={returnTo} />
                  <label className="grid flex-1 gap-2 text-xs font-medium text-zinc-700">
                    Digite EXCLUIR NOTA
                    <input className="field-control min-h-11 px-3 py-2 text-sm" name="confirmation" required />
                  </label>
                  <button className="danger-button min-h-11 px-4 py-2 text-sm font-semibold">Excluir</button>
                </form>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <div className="app-card-soft px-5 py-7">
          <h3 className="font-semibold text-zinc-950">Nenhuma nota ainda</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Guarde uma frase, insight ou dúvida. Não precisa estar pronta.</p>
        </div>
      )}
    </section>
  );
}
