import { describe, expect, it } from "vitest";
import {
  getCaptureRuleSuggestions,
  getEmailRuleSuggestions,
  parseAutomationDraftRules,
} from "./suggestion-rules";

const senderRule = {
  enabled: true,
  id: "00000000-0000-4000-8000-000000000001",
  kind: "sender_contains" as const,
  value: "unicamp.br",
};
const captureRule = {
  enabled: true,
  id: "00000000-0000-4000-8000-000000000002",
  kind: "capture_has_date" as const,
  value: "date_hint" as const,
};

describe("automation draft rules", () => {
  it("gera somente sugestão para remetente correspondente", () => {
    expect(
      getEmailRuleSuggestions([senderRule], {
        from: "Professor <x@unicamp.br>",
        subject: "Aviso",
      })[0]?.type,
    ).toBe("suggest_task");
  });

  it("sugere lembrete para capture com data sem executar ação", () => {
    expect(
      getCaptureRuleSuggestions([captureRule], "Pagar boleto amanhã")[0]?.type,
    ).toBe("suggest_reminder");
  });

  it("descarta configuração inválida", () => {
    expect(parseAutomationDraftRules([{ kind: "delete_email" }])).toEqual([]);
  });
});
