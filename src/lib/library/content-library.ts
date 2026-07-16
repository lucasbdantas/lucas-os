import { z } from "zod";

export const contentItemTypes = [
  "book",
  "movie_tv",
  "youtube_video",
  "podcast",
  "tiktok_reel",
  "article",
  "class_course",
  "theater_live",
  "other",
] as const;

export const contentItemStatuses = [
  "want_to_consume",
  "consuming",
  "consumed",
  "paused",
  "abandoned",
] as const;

export const contentItemPriorities = ["low", "medium", "high"] as const;

export type ContentItemType = (typeof contentItemTypes)[number];
export type ContentItemStatus = (typeof contentItemStatuses)[number];
export type ContentItemPriority = (typeof contentItemPriorities)[number];

export const contentTypeLabels: Record<ContentItemType, string> = {
  article: "Artigo",
  book: "Livro",
  class_course: "Aula / curso",
  movie_tv: "Filme / série",
  other: "Outro",
  podcast: "Podcast",
  theater_live: "Teatro / ao vivo",
  tiktok_reel: "TikTok / Reel",
  youtube_video: "Vídeo do YouTube",
};

export const contentStatusLabels: Record<ContentItemStatus, string> = {
  abandoned: "Abandonado",
  consumed: "Concluído",
  consuming: "Em andamento",
  paused: "Pausado",
  want_to_consume: "Quero consumir",
};

export const contentPriorityLabels: Record<ContentItemPriority, string> = {
  high: "Alta",
  low: "Baixa",
  medium: "Média",
};

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value ? value : null));

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .transform((value) => (value ? value : null))
  .pipe(
    z
      .url("Informe uma URL válida.")
      .refine((value) => /^https?:\/\//i.test(value), {
        message: "Use uma URL http ou https.",
      })
      .nullable(),
  );

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value ? value : null))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable());

export const contentItemInputSchema = z
  .object({
    creator: optionalText(180),
    description: optionalText(5000),
    finishedAt: optionalDate,
    priority: z.enum(contentItemPriorities),
    sourceLabel: optionalText(120),
    sourceUrl: optionalUrl,
    startedAt: optionalDate,
    status: z.enum(contentItemStatuses),
    tags: z.array(z.string().trim().min(1).max(48)).max(20),
    title: z.string().trim().min(1, "Informe o título.").max(240),
    type: z.enum(contentItemTypes),
    url: optionalUrl,
  })
  .refine(
    (value) =>
      !value.startedAt || !value.finishedAt || value.finishedAt >= value.startedAt,
    { message: "A data final não pode ser anterior à data inicial." },
  );

export const contentNoteInputSchema = z.object({
  context: optionalText(2000),
  noteContext: optionalText(160),
  positionLabel: optionalText(160),
  rawNote: z.string().trim().min(1, "Escreva a nota antes de salvar.").max(10000),
});

export function parseContentTags(value: unknown) {
  if (Array.isArray(value)) {
    return [...new Set(value.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
  }

  if (typeof value !== "string") return [];

  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
}

export type ContentLibraryFilters = {
  priority?: string;
  status?: string;
  type?: string;
};

export function normalizeContentLibraryFilters(
  filters: ContentLibraryFilters,
) {
  return {
    priority: contentItemPriorities.includes(filters.priority as ContentItemPriority)
      ? (filters.priority as ContentItemPriority)
      : null,
    status: contentItemStatuses.includes(filters.status as ContentItemStatus)
      ? (filters.status as ContentItemStatus)
      : null,
    type: contentItemTypes.includes(filters.type as ContentItemType)
      ? (filters.type as ContentItemType)
      : null,
  };
}
