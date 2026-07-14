import type { NormalizedGmailMessage } from "./gmail-messages";

export type GmailTaskDraft = {
  notes: string;
  source: "email";
  title: string;
};

function cleanLine(value: string | null | undefined, fallback: string) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned || fallback;
}

export function buildGmailTaskDraft(
  message: Pick<
    NormalizedGmailMessage,
    "accountEmail" | "date" | "from" | "gmailUrl" | "snippet" | "subject"
  >,
): GmailTaskDraft {
  const title = cleanLine(message.subject, "Email para revisar");
  const lines = [
    "Task criada a partir de email, com confirmacao humana.",
    "",
    `Conta: ${cleanLine(message.accountEmail, "Conta desconhecida")}`,
    `De: ${cleanLine(message.from, "Remetente desconhecido")}`,
    `Assunto: ${title}`,
    message.date ? `Data: ${message.date}` : null,
    `Link: ${message.gmailUrl}`,
    message.snippet
      ? `Resumo/snippet: ${cleanLine(message.snippet, "Sem snippet")}`
      : null,
  ].filter(Boolean);

  return {
    notes: lines.join("\n"),
    source: "email",
    title,
  };
}
