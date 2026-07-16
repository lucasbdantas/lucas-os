import Link from "next/link";
import { createContentItem, updateContentItem } from "@/lib/library/actions";
import {
  contentItemPriorities,
  contentItemStatuses,
  contentItemTypes,
  contentPriorityLabels,
  contentStatusLabels,
  contentTypeLabels,
} from "@/lib/library/content-library";

export type ContentItemFormValue = {
  creator: string | null;
  description: string | null;
  finished_at: string | null;
  id: string;
  priority: string;
  source_label: string | null;
  source_url: string | null;
  started_at: string | null;
  status: string;
  tags: string[];
  title: string;
  type: string;
  url: string | null;
};

export function ContentItemForm({
  initialItem,
}: {
  initialItem?: ContentItemFormValue;
}) {
  const editing = Boolean(initialItem);
  const returnTo = initialItem
    ? `/library?item=${encodeURIComponent(initialItem.id)}&edit=${encodeURIComponent(initialItem.id)}#content-form`
    : "/library#content-form";

  return (
    <form
      action={editing ? updateContentItem : createContentItem}
      className="app-card-soft p-4 sm:p-5"
      id="content-form"
    >
      <input name="returnTo" type="hidden" value={returnTo} />
      {initialItem ? <input name="itemId" type="hidden" value={initialItem.id} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-kicker">{editing ? "Modo edição" : "Novo registro"}</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-950">
            {editing ? "Editar conteúdo" : "Adicionar à Biblioteca"}
          </h2>
        </div>
        {editing ? (
          <Link className="ghost-button px-3 py-2 text-sm font-semibold" href={`/library?item=${initialItem?.id}#library-detail`}>
            Cancelar
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Título
          <input className="field-control min-h-12 px-3 py-2" defaultValue={initialItem?.title ?? ""} maxLength={240} name="title" required />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Tipo
            <select className="field-control min-h-12 px-3 py-2" defaultValue={initialItem?.type ?? "book"} name="type">
              {contentItemTypes.map((value) => <option key={value} value={value}>{contentTypeLabels[value]}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Status
            <select className="field-control min-h-12 px-3 py-2" defaultValue={initialItem?.status ?? "want_to_consume"} name="status">
              {contentItemStatuses.map((value) => <option key={value} value={value}>{contentStatusLabels[value]}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Prioridade
            <select className="field-control min-h-12 px-3 py-2" defaultValue={initialItem?.priority ?? "medium"} name="priority">
              {contentItemPriorities.map((value) => <option key={value} value={value}>{contentPriorityLabels[value]}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Autor, criador ou responsável
            <input className="field-control min-h-12 px-3 py-2" defaultValue={initialItem?.creator ?? ""} maxLength={180} name="creator" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Link principal
            <input className="field-control min-h-12 px-3 py-2" defaultValue={initialItem?.url ?? ""} name="url" placeholder="https://..." type="url" />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Descrição
          <textarea className="field-control min-h-28 px-3 py-2" defaultValue={initialItem?.description ?? ""} maxLength={5000} name="description" />
        </label>

        <label className="grid gap-2 text-sm font-medium text-zinc-800">
          Tags
          <input className="field-control min-h-12 px-3 py-2" defaultValue={initialItem?.tags.join(", ") ?? ""} name="tags" placeholder="energia, mercado, ficção" />
          <span className="text-xs font-normal text-zinc-500">Separe por vírgulas.</span>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Origem da indicação
            <input className="field-control min-h-12 px-3 py-2" defaultValue={initialItem?.source_label ?? ""} maxLength={120} name="sourceLabel" placeholder="Ex.: professor, newsletter" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Link da origem
            <input className="field-control min-h-12 px-3 py-2" defaultValue={initialItem?.source_url ?? ""} name="sourceUrl" placeholder="https://..." type="url" />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Iniciado em
            <input className="field-control min-h-12 px-3 py-2" defaultValue={initialItem?.started_at ?? ""} name="startedAt" type="date" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-800">
            Finalizado em
            <input className="field-control min-h-12 px-3 py-2" defaultValue={initialItem?.finished_at ?? ""} name="finishedAt" type="date" />
          </label>
        </div>

        <button className="primary-button min-h-12 px-5 py-3 text-sm font-semibold sm:w-fit" type="submit">
          {editing ? "Salvar alterações" : "Adicionar conteúdo"}
        </button>
      </div>
    </form>
  );
}
