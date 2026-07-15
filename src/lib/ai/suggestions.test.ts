import { describe, expect, it } from "vitest";
import {
  buildAISuggestionPayload,
  buildEmailSuggestionText,
  sanitizeTextForAI,
} from "./suggestions";

describe("AI suggestion safety helpers", () => {
  it("removes control characters and limits text", () => {
    const sanitized = sanitizeTextForAI("  texto\u0000\n longo ", 8);

    expect(sanitized).toHaveLength(8);
    expect(sanitized).not.toContain("\u0000");
  });

  it("builds an email prompt input from safe metadata only", () => {
    const text = buildEmailSuggestionText({
      accountEmail: "lucas@example.com",
      date: "2026-07-14T12:00:00.000Z",
      from: "Professor <prof@example.com>",
      gmailUrl: "https://mail.google.com/mail/u/?authuser=lucas#all/abc",
      hasAttachment: true,
      labelIds: ["INBOX", "UNREAD"],
      snippet: "Favor revisar o relatório.",
      subject: "Revisar relatório",
    });

    expect(text).toContain("Assunto: Revisar relatório");
    expect(text).toContain("Snippet: Favor revisar o relatório.");
    expect(text).not.toContain("corpo completo");
  });

  it("builds a bounded structured payload without IDs", () => {
    const payload = buildAISuggestionPayload({
      currentDate: "2026-07-14",
      domains: [{ name: "Faculdade FEEC" }],
      projects: [{ domainName: "Faculdade FEEC", name: "Controle" }],
      rawText: "task: revisar relatório",
      source: "capture",
      timezone: "America/Sao_Paulo",
    });

    expect(payload).toMatchObject({
      source: "capture",
      raw_text: "task: revisar relatório",
      domains: [{ name: "Faculdade FEEC" }],
      projects: [{ domainName: "Faculdade FEEC", name: "Controle" }],
    });
    expect(JSON.stringify(payload)).not.toContain("domain_id");
  });
});
