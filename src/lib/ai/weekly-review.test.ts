import { describe, expect, it } from "vitest";
import {
  buildWeeklyReviewPayload,
  parseAIWeeklyReview,
  type WeeklyReviewContext,
} from "./weekly-review";

const context: WeeklyReviewContext = {
  agenda: [{ start: "2026-07-16T12:00:00Z", title: "Reunião" }],
  completedTasks: [{ completedAt: "2026-07-15", title: "Entreguei relatório" }],
  dailyPlanningFeedback: ["Prioridade útil"],
  overdueTasks: [{ dueDate: "2026-07-10", priority: "high", title: "Pagar conta" }],
  pendingCaptures: [{ source: "web", text: "https://private.example item\nsolto" }],
  projectsWithoutNextAction: [{ name: "TCC", targetDate: null }],
  upcomingTasks: [{ dueDate: "2026-07-18", priority: "medium", title: "Revisar" }],
};

describe("AI weekly review", () => {
  it("limita e sanitiza o contexto enviado", () => {
    const payload = buildWeeklyReviewPayload(context);
    expect(payload.pending_captures[0].text).toBe("[link] item solto");
    expect(JSON.stringify(payload)).not.toContain("private.example");
  });

  it("aceita uma revisão estruturada válida", () => {
    expect(
      parseAIWeeklyReview({
        bottlenecks: ["Muitas pendências"],
        pending: ["Finalizar conta"],
        projectsNeedingNextAction: [{ name: "TCC", reason: "Sem task aberta" }],
        recommendations: ["Definir próxima ação"],
        summary: "Semana produtiva com um gargalo.",
        wins: ["Relatório entregue"],
      }).ok,
    ).toBe(true);
  });

  it("rejeita resposta inválida", () => {
    expect(parseAIWeeklyReview({ summary: "incompleto" }).ok).toBe(false);
  });
});
