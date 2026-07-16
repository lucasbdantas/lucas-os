import { describe, expect, it } from "vitest";
import {
  buildCommandPaletteEntityResults,
  collectCommandPaletteSearchResults,
  commandPaletteCommands,
  filterCommandPaletteResults,
  normalizeCommandPaletteQuery,
  shouldOpenCommandPaletteShortcut,
} from "./command-palette";

describe("command palette helpers", () => {
  it("normalizes a search query before ranking", () => {
    expect(normalizeCommandPaletteQuery("  PRoJeCtS  ")).toBe("projects");
    expect(normalizeCommandPaletteQuery("  Revisao  ")).toBe("revisao");
  });

  it("ranks exact command matches before partial matches", () => {
    const results = filterCommandPaletteResults(commandPaletteCommands, "tasks");

    expect(results[0]).toMatchObject({ title: "Tasks", type: "command" });
  });

  it("filters entities by title, type, or description", () => {
    const results = filterCommandPaletteResults(
      buildCommandPaletteEntityResults([
        {
          description: "active · Carreira",
          href: "/projects?edit=project-id",
          title: "Portfolio profissional",
          type: "project",
        },
        {
          description: "pending · web",
          href: "/capture",
          title: "Comprar cabo USB",
          type: "capture",
        },
      ]),
      "cabo",
    );

    expect(results).toEqual([
      expect.objectContaining({ title: "Comprar cabo USB", type: "capture" }),
    ]);
  });

  it("keeps successful categories when one entity search fails", () => {
    const response = collectCommandPaletteSearchResults([
      {
        status: "fulfilled",
        value: [
          {
            description: "ativo",
            href: "/projects?edit=project-id",
            title: "Projeto de revisao",
            type: "project",
          },
        ],
      },
      { reason: new Error("unavailable"), status: "rejected" },
    ]);

    expect(response).toMatchObject({ hasPartialFailure: true });
    expect(response.results).toEqual([
      expect.objectContaining({ title: "Projeto de revisao" }),
    ]);
  });

  it("does not open the shortcut while the user is editing text", () => {
    expect(
      shouldOpenCommandPaletteShortcut({
        ctrlKey: true,
        isEditable: true,
        key: "k",
        metaKey: false,
      }),
    ).toBe(false);
    expect(
      shouldOpenCommandPaletteShortcut({
        ctrlKey: false,
        isEditable: false,
        key: "K",
        metaKey: true,
      }),
    ).toBe(true);
  });
});
