import { describe, expect, it } from "vitest";
import { normalizeShareTargetInput } from "./share-target";

describe("normalizeShareTargetInput", () => {
  it("combines title text and url into a readable capture", () => {
    expect(
      normalizeShareTargetInput({
        text: "Texto compartilhado",
        title: "Titulo",
        url: "https://example.com",
      }),
    ).toEqual({
      ok: true,
      rawText: "Titulo\n\nTexto compartilhado\n\nhttps://example.com",
    });
  });

  it("accepts url-only shares", () => {
    expect(
      normalizeShareTargetInput({ url: "https://example.com/artigo" }),
    ).toEqual({
      ok: true,
      rawText: "https://example.com/artigo",
    });
  });

  it("accepts text-only shares", () => {
    expect(normalizeShareTargetInput({ text: "Ler isso depois" })).toEqual({
      ok: true,
      rawText: "Ler isso depois",
    });
  });

  it("does not duplicate equal fields", () => {
    expect(
      normalizeShareTargetInput({
        text: "https://example.com",
        title: "https://example.com",
        url: "https://example.com",
      }),
    ).toEqual({
      ok: true,
      rawText: "https://example.com",
    });
  });

  it("rejects empty shares", () => {
    expect(normalizeShareTargetInput({ text: " ", title: "", url: "" })).toEqual(
      {
        ok: false,
        reason: "empty",
      },
    );
  });
});
