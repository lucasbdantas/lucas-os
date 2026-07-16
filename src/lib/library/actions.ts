"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  contentItemInputSchema,
  contentNoteInputSchema,
  parseContentTags,
} from "@/lib/library/content-library";
import { requireSession } from "@/lib/supabase/require-session";

const uuidSchema = z.string().uuid();

function safeReturnTo(value: FormDataEntryValue | null, fallback = "/library") {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function withMessage(path: string, key: "error" | "saved", message: string) {
  const url = new URL(path, "http://lucas-os.local");
  url.searchParams.set(key, message);
  return `${url.pathname}${url.search}${url.hash}`;
}

function parseItemForm(formData: FormData) {
  return contentItemInputSchema.safeParse({
    creator: formData.get("creator") ?? "",
    description: formData.get("description") ?? "",
    finishedAt: formData.get("finishedAt") ?? "",
    priority: formData.get("priority") ?? "medium",
    sourceLabel: formData.get("sourceLabel") ?? "",
    sourceUrl: formData.get("sourceUrl") ?? "",
    startedAt: formData.get("startedAt") ?? "",
    status: formData.get("status") ?? "want_to_consume",
    tags: parseContentTags(formData.get("tags")),
    title: formData.get("title") ?? "",
    type: formData.get("type") ?? "other",
    url: formData.get("url") ?? "",
  });
}

function revalidateLibrary() {
  revalidatePath("/library");
  revalidatePath("/settings/backup");
  revalidatePath("/settings/data");
}

export async function createContentItem(formData: FormData) {
  const returnTo = safeReturnTo(formData.get("returnTo"));
  const parsed = parseItemForm(formData);

  if (!parsed.success) {
    redirect(withMessage(returnTo, "error", parsed.error.issues[0]?.message ?? "Revise os campos do conteúdo."));
  }

  const { supabase, user } = await requireSession();
  const value = parsed.data;
  const { data, error } = await supabase
    .from("content_items")
    .insert({
      creator: value.creator,
      description: value.description,
      finished_at: value.finishedAt,
      priority: value.priority,
      source_label: value.sourceLabel,
      source_url: value.sourceUrl,
      started_at: value.startedAt,
      status: value.status,
      tags: value.tags,
      title: value.title,
      type: value.type,
      url: value.url,
      user_id: user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    redirect(withMessage(returnTo, "error", "Não foi possível salvar o conteúdo."));
  }

  revalidateLibrary();
  redirect(`/library?item=${encodeURIComponent(data.id)}&saved=${encodeURIComponent("Conteúdo criado.")}#library-detail`);
}

export async function updateContentItem(formData: FormData) {
  const returnTo = safeReturnTo(formData.get("returnTo"));
  const itemId = uuidSchema.safeParse(formData.get("itemId"));
  const parsed = parseItemForm(formData);

  if (!itemId.success || !parsed.success) {
    redirect(withMessage(returnTo, "error", parsed.success ? "Conteúdo inválido." : parsed.error.issues[0]?.message ?? "Revise os campos."));
  }

  const { supabase, user } = await requireSession();
  const value = parsed.data;
  const { data, error } = await supabase
    .from("content_items")
    .update({
      creator: value.creator,
      description: value.description,
      finished_at: value.finishedAt,
      priority: value.priority,
      source_label: value.sourceLabel,
      source_url: value.sourceUrl,
      started_at: value.startedAt,
      status: value.status,
      tags: value.tags,
      title: value.title,
      type: value.type,
      url: value.url,
    })
    .eq("id", itemId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    redirect(withMessage(returnTo, "error", "Conteúdo não encontrado ou sem permissão."));
  }

  revalidateLibrary();
  redirect(`/library?item=${encodeURIComponent(itemId.data)}&saved=${encodeURIComponent("Alterações salvas.")}#library-detail`);
}

export async function deleteContentItem(formData: FormData) {
  const itemId = uuidSchema.safeParse(formData.get("itemId"));
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (!itemId.success) redirect(withMessage("/library", "error", "Conteúdo inválido."));

  const { supabase, user } = await requireSession();
  const { data: item, error: itemError } = await supabase
    .from("content_items")
    .select("id,title")
    .eq("id", itemId.data)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; title: string }>();

  if (itemError || !item) redirect(withMessage("/library", "error", "Conteúdo não encontrado."));
  if (confirmation !== item.title) {
    redirect(withMessage(`/library?item=${encodeURIComponent(item.id)}`, "error", "Digite o título exato para confirmar a exclusão."));
  }

  const { error } = await supabase
    .from("content_items")
    .delete()
    .eq("id", item.id)
    .eq("user_id", user.id);

  if (error) redirect(withMessage("/library", "error", "Não foi possível excluir o conteúdo."));

  revalidateLibrary();
  redirect(withMessage("/library", "saved", "Conteúdo e notas excluídos."));
}

export async function createContentNote(formData: FormData) {
  const itemId = uuidSchema.safeParse(formData.get("itemId"));
  const returnTo = safeReturnTo(formData.get("returnTo"));
  const parsed = contentNoteInputSchema.safeParse({
    context: formData.get("context") ?? "",
    noteContext: formData.get("noteContext") ?? "",
    positionLabel: formData.get("positionLabel") ?? "",
    rawNote: formData.get("rawNote") ?? "",
  });

  if (!itemId.success || !parsed.success) {
    redirect(withMessage(returnTo, "error", parsed.success ? "Conteúdo inválido." : parsed.error.issues[0]?.message ?? "Revise a nota."));
  }

  const { supabase, user } = await requireSession();
  const { data: item } = await supabase
    .from("content_items")
    .select("id")
    .eq("id", itemId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!item) redirect(withMessage(returnTo, "error", "Conteúdo não encontrado."));

  const { error } = await supabase.from("content_notes").insert({
    content_item_id: itemId.data,
    context: parsed.data.context,
    note_context: parsed.data.noteContext,
    position_label: parsed.data.positionLabel,
    raw_note: parsed.data.rawNote,
    user_id: user.id,
  });

  if (error) redirect(withMessage(returnTo, "error", "Não foi possível salvar a nota."));

  revalidateLibrary();
  redirect(withMessage(returnTo, "saved", "Nota adicionada."));
}

export async function updateContentNote(formData: FormData) {
  const noteId = uuidSchema.safeParse(formData.get("noteId"));
  const returnTo = safeReturnTo(formData.get("returnTo"));
  const parsed = contentNoteInputSchema.safeParse({
    context: formData.get("context") ?? "",
    noteContext: formData.get("noteContext") ?? "",
    positionLabel: formData.get("positionLabel") ?? "",
    rawNote: formData.get("rawNote") ?? "",
  });

  if (!noteId.success || !parsed.success) {
    redirect(withMessage(returnTo, "error", parsed.success ? "Nota inválida." : parsed.error.issues[0]?.message ?? "Revise a nota."));
  }

  const { supabase, user } = await requireSession();
  const { data, error } = await supabase
    .from("content_notes")
    .update({
      context: parsed.data.context,
      note_context: parsed.data.noteContext,
      position_label: parsed.data.positionLabel,
      raw_note: parsed.data.rawNote,
    })
    .eq("id", noteId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) redirect(withMessage(returnTo, "error", "Nota não encontrada ou sem permissão."));

  revalidateLibrary();
  redirect(withMessage(returnTo, "saved", "Nota atualizada."));
}

export async function deleteContentNote(formData: FormData) {
  const noteId = uuidSchema.safeParse(formData.get("noteId"));
  const returnTo = safeReturnTo(formData.get("returnTo"));

  if (!noteId.success || formData.get("confirmation") !== "EXCLUIR NOTA") {
    redirect(withMessage(returnTo, "error", "Confirme a exclusão da nota."));
  }

  const { supabase, user } = await requireSession();
  const { data, error } = await supabase
    .from("content_notes")
    .delete()
    .eq("id", noteId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) redirect(withMessage(returnTo, "error", "Nota não encontrada ou sem permissão."));

  revalidateLibrary();
  redirect(withMessage(returnTo, "saved", "Nota excluída."));
}
