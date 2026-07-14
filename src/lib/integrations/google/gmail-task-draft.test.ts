import { describe, expect, test } from "vitest";
import { buildGmailTaskDraft } from "./gmail-task-draft";

describe("gmail task draft", () => {
  test("uses the email subject as editable task title", () => {
    const draft = buildGmailTaskDraft({
      accountEmail: "lucas@example.com",
      date: "2026-07-01T12:00:00.000Z",
      from: "Professor <prof@example.com>",
      gmailUrl: "https://mail.google.com/mail/u/?authuser=lucas#all/msg-1",
      snippet: "Preciso do arquivo revisado.",
      subject: "Revisar relatorio de Controle",
    });

    expect(draft.title).toBe("Revisar relatorio de Controle");
    expect(draft.source).toBe("email");
  });

  test("builds safe notes without full email body", () => {
    const draft = buildGmailTaskDraft({
      accountEmail: "lucas@example.com",
      date: null,
      from: "Recrutadora <rh@example.com>",
      gmailUrl: "https://mail.google.com/mail/u/?authuser=lucas#all/msg-2",
      snippet: "Snippet curto",
      subject: " Processo seletivo ",
    });

    expect(draft.notes).toContain("Conta: lucas@example.com");
    expect(draft.notes).toContain("De: Recrutadora <rh@example.com>");
    expect(draft.notes).toContain("Assunto: Processo seletivo");
    expect(draft.notes).toContain("Resumo/snippet: Snippet curto");
    expect(draft.notes).not.toContain("Corpo completo");
  });

  test("falls back to a calm title when subject is empty", () => {
    expect(
      buildGmailTaskDraft({
        accountEmail: "lucas@example.com",
        date: null,
        from: "",
        gmailUrl: "https://mail.google.com",
        snippet: null,
        subject: "",
      }).title,
    ).toBe("Email para revisar");
  });
});
