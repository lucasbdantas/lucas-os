import { describe, expect, it } from "vitest";
import {
  buildDailyPlanFeedbackSummary,
  buildDailyPlanSourceSnapshot,
  buildDailyPlanningPayload,
  getDailyPlanningErrorMessage,
  parseAIDailyPlan,
  parseStoredDailyPlan,
  resolveAIDailyPlan,
  type DailyPlanningContext,
} from "./daily-planning";

const context: DailyPlanningContext = {
  today: "2026-07-15",
  timezone: "America/Sao_Paulo",
  overdueTasks: [
    {
      id: "task-real-id",
      domain: "Faculdade FEEC",
      dueDate: "2026-07-14",
      dueTime: "15:00",
      priority: "high",
      project: "Controle",
      ref: "t1",
      title: "Revisar Controle",
    },
  ],
  todayTasks: [],
  upcomingTasks: [],
  calendarEvents: [],
  pendingCaptures: [{ ref: "c1", source: "manual", text: "task: comprar cabo" }],
  emails: [{ account: "lucas@example.com", from: "prof@example.com", ref: "e1", snippet: "Enviar arquivo", subject: "Relatório" }],
  projectsWithoutNextAction: [],
};

describe("AI daily planning", () => {
  it("builds a bounded summary payload without task IDs", () => {
    const payload = buildDailyPlanningPayload({
      ...context,
      pendingCaptures: Array.from({ length: 20 }, (_, index) => ({
        ref: `c${index}`,
        source: "manual",
        text: "x".repeat(1000),
      })),
    });

    expect(payload.pending_captures).toHaveLength(10);
    expect(payload.pending_captures[0]?.text).toHaveLength(500);
    expect(JSON.stringify(payload)).not.toContain("task-real-id");
  });

  it("uses the same bounded and sanitized shape for the persisted source snapshot", () => {
    const snapshot = buildDailyPlanSourceSnapshot({
      ...context,
      emails: [
        {
          account: "lucas@example.com",
          from: "prof@example.com",
          ref: "e1",
          snippet: "x".repeat(900),
          subject: "Relatorio\u0000",
        },
      ],
    });

    expect(snapshot.emails[0]?.snippet).toHaveLength(500);
    expect(snapshot.emails[0]?.subject).toBe("Relatorio");
    expect(JSON.stringify(snapshot)).not.toContain("task-real-id");
  });

  it("parses a valid plan and rejects malformed output", () => {
    expect(
      parseAIDailyPlan({
        frictions: ["Uma tarefa vencida"],
        next_steps: ["Abrir a tarefa principal"],
        priorities: [{ reason: "Prazo", ref: "t1", title: "Revisar Controle" }],
        rescheduling_suggestions: [],
        summary: "Dia com foco em Controle.",
        triage_suggestions: [{ kind: "capture", reason: "Parece tarefa", ref: "c1", title: "Comprar cabo" }],
      }).ok,
    ).toBe(true);
    expect(parseAIDailyPlan({ summary: "incompleto" }).ok).toBe(false);
  });

  it("discards references invented by the model while preserving safe links", () => {
    const result = resolveAIDailyPlan(
      {
        frictions: [],
        next_steps: [],
        priorities: [
          { reason: "real", ref: "t1", title: "Real" },
          { reason: "inventada", ref: "t999", title: "Nao usar" },
        ],
        rescheduling_suggestions: [],
        summary: "Resumo",
        triage_suggestions: [
          { kind: "capture", reason: "real", ref: "c1", title: "Capture" },
          { kind: "email", reason: "inventado", ref: "e999", title: "Email" },
        ],
      },
      context,
    );

    expect(result.priorities).toHaveLength(1);
    expect(result.priorities[0]?.href).toBe("/tasks?edit=task-real-id#edit-task");
    expect(result.triageSuggestions).toHaveLength(1);
    expect(result.triageSuggestions[0]?.href).toBe("/capture");
  });

  it("has a friendly fallback when OpenAI is unavailable", () => {
    expect(getDailyPlanningErrorMessage("missing_openai")).toContain(
      "OpenAI nao esta configurada",
    );
  });

  it("summarizes recent feedback without including notes or item text", () => {
    expect(
      buildDailyPlanFeedbackSummary([
        { rating: "useful", targetType: "priority" },
        { rating: "useful", targetType: "priority" },
        { rating: "wrong", targetType: "triage" },
        { rating: "ignore", targetType: "priority" },
      ]),
    ).toEqual(
      expect.arrayContaining([
        { count: 2, rating: "useful", target_type: "priority" },
        { count: 1, rating: "wrong", target_type: "triage" },
      ]),
    );
  });

  it("accepts a valid saved plan and rejects malformed persisted data", () => {
    expect(
      parseStoredDailyPlan({
        next_steps: ["Abrir a tarefa"],
        priorities: [{ reason: "Prazo", ref: "t1", title: "Revisar Controle" }],
        reschedule_suggestions: [],
        risks: ["Prazo curto"],
        summary: "Foco em Controle.",
        triage_suggestions: [],
      }),
    ).not.toBeNull();
    expect(
      parseStoredDailyPlan({
        next_steps: [],
        priorities: "invalido",
        reschedule_suggestions: [],
        risks: [],
        summary: "Resumo",
        triage_suggestions: [],
      }),
    ).toBeNull();
  });
});
