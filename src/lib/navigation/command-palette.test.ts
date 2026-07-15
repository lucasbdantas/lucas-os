import { describe, expect, it } from "vitest";
import {
  buildCommandPaletteEntityResults,
  commandPaletteCommands,
  filterCommandPaletteResults,
  normalizeCommandPaletteQuery,
} from "./command-palette";

describe("command palette helpers", () => {
  it("normalizes a search query before ranking", () => {
    expect(normalizeCommandPaletteQuery("  PRoJeCtS  ")).toBe("projects");
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
});
