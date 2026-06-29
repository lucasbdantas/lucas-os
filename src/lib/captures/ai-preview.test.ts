import { describe, expect, it } from "vitest";
import {
  aiCaptureSuggestionSchema,
  buildAICapturePreviewState,
  validateAICaptureSuggestion,
  type AICaptureSuggestion,
} from "./ai-preview";

const domains = [
  {
    id: "domain-inbox",
    name: "Inbox",
  },
  {
    id: "domain-feec",
    name: "Faculdade FEEC",
  },
];

const projects = [
  {
    domainId: "domain-feec",
    id: "project-controle",
    name: "Controle",
  },
];

const validTaskSuggestion: AICaptureSuggestion = {
  confidence: 0.9,
  domain_name: "Faculdade FEEC",
  due_date: "2026-06-30",
  due_time: "15:00",
  kind: "task",
  notes: "Ler antes da aula.",
  priority: "medium",
  project_name: "Controle",
  reason: "A captura descreve uma tarefa objetiva.",
  title: "Revisar relatório de controle",
};

describe("AI capture suggestion validation", () => {
  it("accepts a valid task response", () => {
    expect(aiCaptureSuggestionSchema.safeParse(validTaskSuggestion).success).toBe(
      true,
    );
  });

  it("accepts a valid none response", () => {
    expect(
      aiCaptureSuggestionSchema.safeParse({
        confidence: 0.2,
        domain_name: null,
        due_date: null,
        due_time: null,
        kind: "none",
        notes: null,
        priority: null,
        project_name: null,
        reason: "Não há tarefa clara.",
        title: null,
      }).success,
    ).toBe(true);
  });

  it("does not turn low confidence into a ready preview", () => {
    const state = buildAICapturePreviewState(
      {
        ...validTaskSuggestion,
        confidence: 0.5,
      },
      { domains, projects },
    );

    expect(state.status).toBe("low_confidence");
    expect(state.preview).toBeUndefined();
  });

  it("rejects nonexistent domain as a real id", () => {
    const state = buildAICapturePreviewState(
      {
        ...validTaskSuggestion,
        domain_name: "Dominio Inventado",
      },
      { domains, projects },
    );

    expect(state.status).toBe("low_confidence");
    expect(state.preview).toBeUndefined();
  });

  it("rejects nonexistent project as a real id", () => {
    const state = buildAICapturePreviewState(
      {
        ...validTaskSuggestion,
        project_name: "Projeto Inventado",
      },
      { domains, projects },
    );

    expect(state.status).toBe("low_confidence");
    expect(state.preview).toBeUndefined();
  });

  it("maps valid domain and project names to real ids", () => {
    const state = buildAICapturePreviewState(validTaskSuggestion, {
      domains,
      projects,
    });

    expect(state.status).toBe("task");
    expect(state.preview?.domainId).toBe("domain-feec");
    expect(state.preview?.projectId).toBe("project-controle");
  });

  it("returns a friendly fallback for invalid responses", () => {
    const result = validateAICaptureSuggestion({
      confidence: 2,
      kind: "task",
      reason: "inválido",
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.state).toMatchObject({
      message: "A IA nao retornou uma sugestao estruturada valida.",
      status: "error",
    });
  });
});
