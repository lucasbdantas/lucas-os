import { googleGmailReadonlyScope } from "./connected-account";

export type GmailApiMessageHeader = {
  name?: string;
  value?: string;
};

export type GmailApiMessage = {
  id: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: {
    filename?: string;
    headers?: GmailApiMessageHeader[];
    parts?: GmailApiMessagePart[];
  };
  snippet?: string;
  threadId?: string;
};

export type GmailApiMessagePart = {
  filename?: string;
  parts?: GmailApiMessagePart[];
};

export type NormalizedGmailMessage = {
  accountEmail: string;
  accountId: string;
  date: string | null;
  from: string;
  gmailUrl: string;
  hasAttachment: boolean;
  id: string;
  labelIds: string[];
  snippet: string | null;
  subject: string;
  threadId: string | null;
};

export function hasGoogleGmailReadonlyScope(scopes: unknown) {
  return (
    Array.isArray(scopes) &&
    scopes.some((scope) => scope === googleGmailReadonlyScope)
  );
}

function getHeader(headers: GmailApiMessageHeader[] | undefined, name: string) {
  return (
    headers?.find(
      (header) => header.name?.toLowerCase() === name.toLowerCase(),
    )?.value?.trim() ?? null
  );
}

function normalizeEmailDate(message: GmailApiMessage) {
  const dateHeader = getHeader(message.payload?.headers, "Date");

  if (dateHeader) {
    const parsed = new Date(dateHeader);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  if (message.internalDate && /^\d+$/.test(message.internalDate)) {
    const parsed = new Date(Number(message.internalDate));

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}

function hasAttachmentPart(part: GmailApiMessagePart | undefined): boolean {
  if (!part) {
    return false;
  }

  if (part.filename?.trim()) {
    return true;
  }

  return part.parts?.some(hasAttachmentPart) ?? false;
}

export function buildGmailMessageUrl(input: {
  accountEmail: string;
  messageId: string;
}) {
  const url = new URL("https://mail.google.com/mail/u/");
  url.searchParams.set("authuser", input.accountEmail);
  url.hash = `all/${input.messageId}`;

  return url.toString();
}

export function normalizeGmailMessage(input: {
  accountEmail: string;
  accountId: string;
  message: GmailApiMessage;
}): NormalizedGmailMessage {
  const headers = input.message.payload?.headers;

  return {
    accountEmail: input.accountEmail,
    accountId: input.accountId,
    date: normalizeEmailDate(input.message),
    from: getHeader(headers, "From") ?? "Remetente desconhecido",
    gmailUrl: buildGmailMessageUrl({
      accountEmail: input.accountEmail,
      messageId: input.message.id,
    }),
    hasAttachment: hasAttachmentPart(input.message.payload),
    id: input.message.id,
    labelIds: input.message.labelIds ?? [],
    snippet: input.message.snippet?.trim() || null,
    subject: getHeader(headers, "Subject") ?? "Sem assunto",
    threadId: input.message.threadId ?? null,
  };
}

export function sortGmailMessages(messages: NormalizedGmailMessage[]) {
  return [...messages].sort((first, second) =>
    (second.date ?? "").localeCompare(first.date ?? ""),
  );
}

export function buildGmailPendingCaptureText(
  message: Pick<
    NormalizedGmailMessage,
    "accountEmail" | "date" | "from" | "gmailUrl" | "snippet" | "subject"
  >,
) {
  const lines = [
    "Email para triagem",
    `Conta: ${message.accountEmail}`,
    `De: ${message.from}`,
    `Assunto: ${message.subject}`,
    message.date ? `Data: ${message.date}` : null,
    `Link: ${message.gmailUrl}`,
    message.snippet ? `Resumo/snippet: ${message.snippet}` : null,
  ].filter(Boolean);

  return lines.join("\n");
}
