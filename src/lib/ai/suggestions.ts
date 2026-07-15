import type { NormalizedGmailMessage } from "@/lib/integrations/google/gmail-messages";

export const AI_SUGGESTION_MAX_TEXT_LENGTH = 6000;

export function sanitizeTextForAI(value: string | null | undefined, maxLength = AI_SUGGESTION_MAX_TEXT_LENGTH) {
  return (value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function buildEmailSuggestionText(
  message: Pick<
    NormalizedGmailMessage,
    | "accountEmail"
    | "date"
    | "from"
    | "gmailUrl"
    | "hasAttachment"
    | "labelIds"
    | "snippet"
    | "subject"
  >,
) {
  return [
    "Email para avaliar como possível ação.",
    `Assunto: ${sanitizeTextForAI(message.subject, 500)}`,
    `Remetente: ${sanitizeTextForAI(message.from, 500)}`,
    `Conta de origem: ${sanitizeTextForAI(message.accountEmail, 320)}`,
    message.date ? `Data: ${sanitizeTextForAI(message.date, 80)}` : null,
    message.snippet
      ? `Snippet: ${sanitizeTextForAI(message.snippet, 1200)}`
      : null,
    message.labelIds.length > 0
      ? `Labels: ${message.labelIds.slice(0, 10).map((label) => sanitizeTextForAI(label, 80)).join(", ")}`
      : null,
    `Com anexo: ${message.hasAttachment ? "sim" : "não"}`,
    `Link do Gmail: ${sanitizeTextForAI(message.gmailUrl, 1200)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildAISuggestionPayload(input: {
  rawText: string;
  currentDate: string;
  timezone: string;
  domains: Array<{ name: string }>;
  projects: Array<{ name: string; domainName: string }>;
  source?: "capture" | "email";
}) {
  return {
    source: input.source ?? "capture",
    raw_text: sanitizeTextForAI(input.rawText),
    current_date: input.currentDate,
    timezone: input.timezone,
    domains: input.domains
      .slice(0, 50)
      .map((domain) => ({ name: sanitizeTextForAI(domain.name, 160) })),
    projects: input.projects.slice(0, 100).map((project) => ({
      domainName: sanitizeTextForAI(project.domainName, 160),
      name: sanitizeTextForAI(project.name, 220),
    })),
  };
}
