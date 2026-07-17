import { describe, expect, it } from "vitest";
import {
  buildContentNoteRewritePayload,
  getContentNoteAIUnavailableMessage,
  parseContentNoteRewrite,
} from "./note-ai";

describe("content note AI", () => {
  it("sends only the minimal note context", () => {
    const payload = buildContentNoteRewritePayload({
      contentContext: "Capítulo sobre sistemas.",
      creator: "Autor",
      rawNote: "ideia bruta",
      title: "Livro",
      type: "book",
    });

    expect(payload).toEqual({
      content_context: "Capítulo sobre sistemas.",
      creator: "Autor",
      raw_note: "ideia bruta",
      title: "Livro",
      type: "book",
    });
    expect(JSON.stringify(payload)).not.toMatch(/token|secret|user_id/i);
  });

  it("parses a valid rewrite and rejects invalid output", () => {
    expect(parseContentNoteRewrite({ rewrite: "Uma ideia organizada." })).toEqual({
      ok: true,
      rewrite: "Uma ideia organizada.",
    });
    expect(parseContentNoteRewrite({ rewrite: "" }).ok).toBe(false);
  });

  it("provides friendly fallbacks without OpenAI", () => {
    expect(getContentNoteAIUnavailableMessage(false)).toContain("não está configurada");
    expect(getContentNoteAIUnavailableMessage(true)).toContain("nota original");
  });
});
