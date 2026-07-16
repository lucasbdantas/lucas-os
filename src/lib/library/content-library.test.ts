import { describe, expect, it } from "vitest";
import {
  contentItemInputSchema,
  normalizeContentLibraryFilters,
  parseContentTags,
} from "./content-library";

describe("content library", () => {
  it("validates a safe content item", () => {
    expect(
      contentItemInputSchema.safeParse({
        creator: "Ursula K. Le Guin",
        description: "Ficção científica",
        finishedAt: "",
        priority: "high",
        sourceLabel: "Indicação",
        sourceUrl: "",
        startedAt: "",
        status: "want_to_consume",
        tags: ["ficção", "clássico"],
        title: "A Mão Esquerda da Escuridão",
        type: "book",
        url: "https://example.com/book",
      }).success,
    ).toBe(true);
  });

  it("rejects blank title and reversed dates", () => {
    const result = contentItemInputSchema.safeParse({
      creator: "",
      description: "",
      finishedAt: "2026-07-01",
      priority: "medium",
      sourceLabel: "",
      sourceUrl: "",
      startedAt: "2026-07-10",
      status: "consuming",
      tags: [],
      title: " ",
      type: "article",
      url: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unsafe URL protocols", () => {
    const result = contentItemInputSchema.safeParse({
      creator: "",
      description: "",
      finishedAt: "",
      priority: "medium",
      sourceLabel: "",
      sourceUrl: "",
      startedAt: "",
      status: "want_to_consume",
      tags: [],
      title: "Referência",
      type: "article",
      url: "javascript:alert(1)",
    });

    expect(result.success).toBe(false);
  });

  it("normalizes filters and ignores unsupported values", () => {
    expect(
      normalizeContentLibraryFilters({
        priority: "high",
        status: "consuming",
        type: "book",
      }),
    ).toEqual({ priority: "high", status: "consuming", type: "book" });
    expect(normalizeContentLibraryFilters({ type: "secret" }).type).toBeNull();
  });

  it("deduplicates comma-separated tags", () => {
    expect(parseContentTags("livro, estudo, livro")).toEqual(["livro", "estudo"]);
  });
});
