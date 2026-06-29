import { describe, expect, it } from "vitest";
import { parseSimpleCapture } from "./simple-parser";

describe("parseSimpleCapture", () => {
  it("parses task prefix", () => {
    expect(parseSimpleCapture("task: Comprar cabo USB")).toEqual({
      kind: "task",
      title: "Comprar cabo USB",
    });
  });

  it("parses tarefa prefix case-insensitively", () => {
    expect(parseSimpleCapture("TAREFA: Revisar Controle")).toEqual({
      kind: "task",
      title: "Revisar Controle",
    });
  });

  it("parses todo prefix", () => {
    expect(
      parseSimpleCapture("todo: estudar mercado livre de energia"),
    ).toEqual({
      kind: "task",
      title: "estudar mercado livre de energia",
    });
  });

  it("parses lembrete prefix", () => {
    expect(parseSimpleCapture("lembrete: pagar estacionamento")).toEqual({
      kind: "task",
      title: "pagar estacionamento",
    });
  });

  it("does not preview an empty task prefix", () => {
    expect(parseSimpleCapture("task:")).toEqual({ kind: "none" });
  });

  it("does not preview text without a prefix", () => {
    expect(parseSimpleCapture("texto solto sem prefixo")).toEqual({
      kind: "none",
    });
  });

  it("does not preview multiple non-empty lines", () => {
    expect(
      parseSimpleCapture(
        [
          "task: Comprar cabo USB",
          "TAREFA: Revisar Controle",
          "todo: estudar mercado livre de energia",
        ].join("\n"),
      ),
    ).toEqual({ kind: "multiple_lines" });
  });
});
