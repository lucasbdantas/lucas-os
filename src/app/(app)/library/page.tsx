import { ExternalLink, LibraryBig, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { ContentItemForm, type ContentItemFormValue } from "@/components/library/content-item-form";
import { ContentNotesPanel, type ContentNoteRow } from "@/components/library/content-notes-panel";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { deleteContentItem } from "@/lib/library/actions";
import {
  contentItemPriorities,
  contentItemStatuses,
  contentItemTypes,
  contentPriorityLabels,
  contentStatusLabels,
  contentTypeLabels,
  normalizeContentLibraryFilters,
  type ContentItemPriority,
  type ContentItemStatus,
  type ContentItemType,
} from "@/lib/library/content-library";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireSession } from "@/lib/supabase/require-session";

type LibraryPageProps = {
  searchParams: Promise<{
    edit?: string;
    error?: string;
    item?: string;
    priority?: string;
    saved?: string;
    status?: string;
    type?: string;
  }>;
};

type ContentItemRow = ContentItemFormValue & {
  created_at: string;
  updated_at: string;
};

function statusTone(status: ContentItemStatus) {
  if (status === "consumed") return "green" as const;
  if (status === "consuming") return "blue" as const;
  if (status === "paused") return "amber" as const;
  if (status === "abandoned") return "red" as const;
  return "default" as const;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const filters = normalizeContentLibraryFilters(params);
  const { supabase, user } = await requireSession();
  const [itemsResult, noteCountsResult] = await Promise.all([
    supabase
      .from("content_items")
      .select("id,title,type,status,priority,creator,url,source_label,source_url,description,tags,started_at,finished_at,created_at,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(300)
      .returns<ContentItemRow[]>(),
    supabase
      .from("content_notes")
      .select("content_item_id")
      .eq("user_id", user.id)
      .returns<Array<{ content_item_id: string }>>(),
  ]);

  if (itemsResult.error) throw new Error(itemsResult.error.message);
  if (noteCountsResult.error) throw new Error(noteCountsResult.error.message);

  const items = itemsResult.data ?? [];
  const filteredItems = items.filter(
    (item) =>
      (!filters.type || item.type === filters.type) &&
      (!filters.status || item.status === filters.status) &&
      (!filters.priority || item.priority === filters.priority),
  );
  const noteCounts = new Map<string, number>();
  for (const note of noteCountsResult.data ?? []) {
    noteCounts.set(note.content_item_id, (noteCounts.get(note.content_item_id) ?? 0) + 1);
  }

  const selectedItem = items.find((item) => item.id === params.item) ?? null;
  const editingItem = items.find((item) => item.id === params.edit) ?? null;
  let selectedNotes: ContentNoteRow[] = [];

  if (selectedItem) {
    const notesResult = await supabase
      .from("content_notes")
      .select("id,raw_note,context,ai_rewrite,note_context,position_label,created_at")
      .eq("user_id", user.id)
      .eq("content_item_id", selectedItem.id)
      .order("created_at", { ascending: false })
      .returns<ContentNoteRow[]>();

    if (notesResult.error) throw new Error(notesResult.error.message);
    selectedNotes = notesResult.data ?? [];
  }

  return (
    <main className="app-page mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          description="Livros, vídeos, aulas, podcasts e referências com notas que ficam no seu próprio caderno."
          eyebrow="Biblioteca pessoal"
          title="Biblioteca"
        />
        <Link className="primary-button min-h-12 gap-2 px-4 py-3 text-sm font-semibold" href="/library#content-form">
          <Plus aria-hidden="true" className="h-4 w-4" /> Adicionar conteúdo
        </Link>
      </div>

      {params.error ? <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{params.error}</p> : null}
      {params.saved ? <p className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">{params.saved}</p> : null}

      <div className="page-grid mt-8">
        <div className="grid min-w-0 gap-8">
          <section className="section-shell">
            <form className="app-card-soft grid gap-3 p-4 sm:grid-cols-4" method="get">
              <label className="grid gap-2 text-xs font-semibold text-zinc-600">
                Tipo
                <select className="field-control min-h-11 px-3 py-2 text-sm" defaultValue={filters.type ?? ""} name="type">
                  <option value="">Todos</option>
                  {contentItemTypes.map((value) => <option key={value} value={value}>{contentTypeLabels[value]}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-xs font-semibold text-zinc-600">
                Status
                <select className="field-control min-h-11 px-3 py-2 text-sm" defaultValue={filters.status ?? ""} name="status">
                  <option value="">Todos</option>
                  {contentItemStatuses.map((value) => <option key={value} value={value}>{contentStatusLabels[value]}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-xs font-semibold text-zinc-600">
                Prioridade
                <select className="field-control min-h-11 px-3 py-2 text-sm" defaultValue={filters.priority ?? ""} name="priority">
                  <option value="">Todas</option>
                  {contentItemPriorities.map((value) => <option key={value} value={value}>{contentPriorityLabels[value]}</option>)}
                </select>
              </label>
              <div className="flex items-end gap-2">
                <button className="soft-button min-h-11 flex-1 px-3 py-2 text-sm font-semibold">Filtrar</button>
                <Link aria-label="Limpar filtros" className="ghost-button min-h-11 px-3 py-2 text-sm font-semibold" href="/library">Limpar</Link>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-zinc-950">Seu acervo</h2>
              <StatusBadge label={`${filteredItems.length} itens`} tone="green" />
            </div>

            {filteredItems.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredItems.map((item) => (
                  <Link className="app-card app-card-interactive min-w-0 p-4 no-underline" href={`/library?item=${encodeURIComponent(item.id)}#library-detail`} key={item.id}>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={contentTypeLabels[item.type as ContentItemType]} />
                      <StatusBadge label={contentStatusLabels[item.status as ContentItemStatus]} tone={statusTone(item.status as ContentItemStatus)} />
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-zinc-950">{item.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600">{item.creator || "Criador não informado"}</p>
                    <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span>Prioridade {contentPriorityLabels[item.priority as ContentItemPriority].toLowerCase()}</span>
                      <span>{noteCounts.get(item.id) ?? 0} notas</span>
                      <span>Atualizado {formatDateTime(item.updated_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                description={items.length ? "Nenhum item corresponde aos filtros. Limpe os filtros ou ajuste sua seleção." : "Comece com o próximo livro, vídeo ou aula que você quer guardar fora do caderninho."}
                title={items.length ? "Nada encontrado" : "Sua Biblioteca está vazia"}
              />
            )}
          </section>

          {selectedItem ? (
            <section className="section-shell" id="library-detail">
              <article className="app-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="section-kicker">Detalhe</p>
                    <h2 className="mt-2 text-2xl font-semibold text-zinc-950">{selectedItem.title}</h2>
                    <p className="mt-2 text-sm text-zinc-600">{selectedItem.creator || "Criador não informado"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link className="soft-button min-h-11 gap-2 px-3 py-2 text-sm font-semibold" href={`/library?item=${selectedItem.id}&edit=${selectedItem.id}#content-form`}>
                      <Pencil aria-hidden="true" className="h-4 w-4" /> Editar
                    </Link>
                    {selectedItem.url ? <a className="soft-button min-h-11 gap-2 px-3 py-2 text-sm font-semibold" href={selectedItem.url} rel="noreferrer" target="_blank">Abrir <ExternalLink aria-hidden="true" className="h-4 w-4" /></a> : null}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge label={contentTypeLabels[selectedItem.type as ContentItemType]} />
                  <StatusBadge label={contentStatusLabels[selectedItem.status as ContentItemStatus]} tone={statusTone(selectedItem.status as ContentItemStatus)} />
                  <StatusBadge label={`Prioridade ${contentPriorityLabels[selectedItem.priority as ContentItemPriority].toLowerCase()}`} />
                </div>

                {selectedItem.description ? <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-zinc-700">{selectedItem.description}</p> : null}
                {selectedItem.tags.length ? <div className="mt-4 flex flex-wrap gap-2">{selectedItem.tags.map((tag) => <span className="status-badge px-2.5 py-1 text-xs" key={tag}>#{tag}</span>)}</div> : null}

                <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><dt className="text-zinc-500">Início</dt><dd className="mt-1 font-medium text-zinc-800">{formatDate(selectedItem.started_at)}</dd></div>
                  <div><dt className="text-zinc-500">Fim</dt><dd className="mt-1 font-medium text-zinc-800">{formatDate(selectedItem.finished_at)}</dd></div>
                  <div><dt className="text-zinc-500">Origem</dt><dd className="mt-1 font-medium text-zinc-800">{selectedItem.source_label || "Não informada"}</dd></div>
                  <div><dt className="text-zinc-500">Notas</dt><dd className="mt-1 font-medium text-zinc-800">{selectedNotes.length}</dd></div>
                </dl>

                {selectedItem.source_url ? <a className="muted-link mt-4 inline-flex text-sm" href={selectedItem.source_url} rel="noreferrer" target="_blank">Abrir origem da indicação</a> : null}

                <details className="mt-6 border-t border-zinc-200 pt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-red-700">Excluir conteúdo</summary>
                  <form action={deleteContentItem} className="mt-3 flex flex-wrap items-end gap-2">
                    <input name="itemId" type="hidden" value={selectedItem.id} />
                    <label className="grid min-w-0 flex-1 gap-2 text-xs font-medium text-zinc-700">
                      Digite o título exato: {selectedItem.title}
                      <input className="field-control min-h-11 px-3 py-2 text-sm" name="confirmation" required />
                    </label>
                    <button className="danger-button min-h-11 px-4 py-2 text-sm font-semibold">Excluir conteúdo e notas</button>
                  </form>
                </details>
              </article>

              <ContentNotesPanel itemId={selectedItem.id} notes={selectedNotes} />
            </section>
          ) : null}
        </div>

        <aside className="min-w-0">
          {editingItem ? <ContentItemForm initialItem={editingItem} /> : <ContentItemForm />}
          <div className="app-card-muted mt-4 p-4">
            <LibraryBig aria-hidden="true" className="h-5 w-5 text-green-700" />
            <p className="mt-3 text-sm font-semibold text-zinc-950">Captura manual, sem sincronização invasiva</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">Links do YouTube, TikTok e outras fontes são guardados manualmente. Watch Later e importações automáticas ficam para uma versão futura.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
