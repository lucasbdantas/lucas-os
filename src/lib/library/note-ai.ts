import { z } from "zod";

export const contentNoteRewriteSchema = z.object({
  rewrite: z.string().trim().min(1).max(12000),
});

export type ContentNoteRewriteContext = {
  contentContext: string | null;
  creator: string | null;
  rawNote: string;
  title: string;
  type: string;
};

export function buildContentNoteRewritePayload(
  context: ContentNoteRewriteContext,
) {
  return {
    content_context: context.contentContext?.slice(0, 1000) ?? null,
    creator: context.creator?.slice(0, 180) ?? null,
    raw_note: context.rawNote.slice(0, 10000),
    title: context.title.slice(0, 240),
    type: context.type,
  };
}

export function parseContentNoteRewrite(value: unknown) {
  const parsed = contentNoteRewriteSchema.safeParse(value);
  return parsed.success
    ? { ok: true as const, rewrite: parsed.data.rewrite }
    : { ok: false as const, message: "A IA não retornou uma reescrita válida." };
}

export function getContentNoteAIUnavailableMessage(configured: boolean) {
  return configured
    ? "Não foi possível reescrever a nota agora. A nota original continua intacta."
    : "OpenAI não está configurada. A nota manual continua disponível.";
}
