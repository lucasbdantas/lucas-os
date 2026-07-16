"use server";

import { revalidatePath } from "next/cache";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { getOpenAIClient } from "@/lib/ai/openai";
import {
  buildContentNoteRewritePayload,
  contentNoteRewriteSchema,
  getContentNoteAIUnavailableMessage,
  parseContentNoteRewrite,
} from "@/lib/library/note-ai";
import { requireSession } from "@/lib/supabase/require-session";

export type ContentNoteAIState =
  | { ok: true; rewrite: string; message?: string }
  | { ok: false; message: string };

const uuidSchema = z.string().uuid();

export async function previewContentNoteRewrite(
  noteId: string,
): Promise<ContentNoteAIState> {
  const parsedId = uuidSchema.safeParse(noteId);
  if (!parsedId.success) return { ok: false, message: "Nota inválida." };

  const client = getOpenAIClient();
  if (!client) {
    return { ok: false, message: getContentNoteAIUnavailableMessage(false) };
  }

  const { supabase, user } = await requireSession();
  const { data: note, error: noteError } = await supabase
    .from("content_notes")
    .select("content_item_id,raw_note,context")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle<{ content_item_id: string; context: string | null; raw_note: string }>();

  if (noteError || !note) return { ok: false, message: "Nota não encontrada." };

  const { data: item, error: itemError } = await supabase
    .from("content_items")
    .select("title,type,creator,description")
    .eq("id", note.content_item_id)
    .eq("user_id", user.id)
    .maybeSingle<{ creator: string | null; description: string | null; title: string; type: string }>();

  if (itemError || !item) return { ok: false, message: "Conteúdo não encontrado." };

  try {
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-nano",
      instructions: [
        "Rewrite a personal content note in Brazilian Portuguese.",
        "Improve clarity, structure, and language while preserving the author's meaning.",
        "Never invent facts, quotes, references, conclusions, or details.",
        "Return only the requested structured object.",
      ].join(" "),
      input: JSON.stringify(
        buildContentNoteRewritePayload({
          contentContext: note.context ?? item.description,
          creator: item.creator,
          rawNote: note.raw_note,
          title: item.title,
          type: item.type,
        }),
      ),
      text: { format: zodTextFormat(contentNoteRewriteSchema, "content_note_rewrite") },
    });
    const parsed = parseContentNoteRewrite(response.output_parsed);

    return parsed.ok
      ? { ok: true, rewrite: parsed.rewrite }
      : { ok: false, message: parsed.message };
  } catch {
    return { ok: false, message: getContentNoteAIUnavailableMessage(true) };
  }
}

export async function saveContentNoteRewrite(
  noteId: string,
  rewrite: string,
): Promise<ContentNoteAIState> {
  const parsedId = uuidSchema.safeParse(noteId);
  const parsedRewrite = contentNoteRewriteSchema.safeParse({ rewrite });

  if (!parsedId.success || !parsedRewrite.success) {
    return { ok: false, message: "Revise a reescrita antes de salvar." };
  }

  const { supabase, user } = await requireSession();
  const { data, error } = await supabase
    .from("content_notes")
    .update({ ai_rewrite: parsedRewrite.data.rewrite })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, message: "Não foi possível salvar a reescrita." };

  revalidatePath("/library");
  return { ok: true, message: "Reescrita salva após sua confirmação.", rewrite: parsedRewrite.data.rewrite };
}
