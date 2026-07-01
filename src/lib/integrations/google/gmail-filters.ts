import type { NormalizedGmailMessage } from "./gmail-messages";

export const gmailInboxPeriods = [7, 14, 30] as const;

export const gmailInboxPresets = [
  {
    description: "Emails recentes sem restricoes extras.",
    label: "Todos recentes",
    value: "all_recent",
  },
  {
    description: "Mensagens com label UNREAD.",
    label: "Nao lidos",
    value: "unread",
  },
  {
    description: "Mensagens que o Gmail identifica com anexo.",
    label: "Com anexo",
    value: "attachments",
  },
  {
    description: "Termos simples que costumam indicar alguma acao.",
    label: "Possiveis acoes",
    value: "actions",
  },
  {
    description: "Sinais academicos da Unicamp/FEEC.",
    label: "Unicamp",
    value: "unicamp",
  },
  {
    description: "Carreira, processos e trabalho.",
    label: "Trabalho/Carreira",
    value: "career",
  },
  {
    description: "Vida pessoal, casa, familia e saude.",
    label: "Pessoal",
    value: "personal",
  },
] as const;

export type GmailInboxPeriod = (typeof gmailInboxPeriods)[number];
export type GmailInboxPreset = (typeof gmailInboxPresets)[number]["value"];

export type GmailInboxFilters = {
  accountId: string | null;
  hasAttachment: boolean;
  label: string | null;
  periodDays: GmailInboxPeriod;
  preset: GmailInboxPreset;
  query: string | null;
  unreadOnly: boolean;
};

type RawFilterValue = string | string[] | undefined;

const presetTerms: Partial<Record<GmailInboxPreset, string[]>> = {
  actions: [
    "confirmar",
    "responder",
    "revisar",
    "prazo",
    "urgente",
    "pendente",
    "tarefa",
    "envio",
    "assinatura",
  ],
  career: [
    "vaga",
    "entrevista",
    "recrutador",
    "carreira",
    "linkedin",
    "processo",
    "serena",
  ],
  personal: [
    "familia",
    "pessoal",
    "casa",
    "saude",
    "financeiro",
    "estacionamento",
  ],
  unicamp: [
    "unicamp",
    "feec",
    "dac",
    "professor",
    "disciplina",
    "relatorio",
  ],
};

function firstValue(value: RawFilterValue) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanText(value: RawFilterValue, maxLength: number) {
  const cleaned = firstValue(value)
    ?.replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, maxLength);
}

function normalizeBoolean(value: RawFilterValue) {
  const normalized = firstValue(value)?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "on";
}

function normalizePeriod(value: RawFilterValue): GmailInboxPeriod {
  const parsed = Number(firstValue(value));

  if (gmailInboxPeriods.includes(parsed as GmailInboxPeriod)) {
    return parsed as GmailInboxPeriod;
  }

  return 14;
}

function normalizePreset(value: RawFilterValue): GmailInboxPreset {
  const parsed = firstValue(value);

  if (gmailInboxPresets.some((preset) => preset.value === parsed)) {
    return parsed as GmailInboxPreset;
  }

  return "all_recent";
}

export function normalizeGmailInboxFilters(input: {
  account?: RawFilterValue;
  attachment?: RawFilterValue;
  label?: RawFilterValue;
  period?: RawFilterValue;
  preset?: RawFilterValue;
  q?: RawFilterValue;
  unread?: RawFilterValue;
}): GmailInboxFilters {
  const preset = normalizePreset(input.preset);

  return {
    accountId: cleanText(input.account, 120),
    hasAttachment: normalizeBoolean(input.attachment) || preset === "attachments",
    label: cleanText(input.label, 80),
    periodDays: normalizePeriod(input.period),
    preset,
    query: cleanText(input.q, 160),
    unreadOnly: normalizeBoolean(input.unread) || preset === "unread",
  };
}

function quoteGmailTerm(value: string) {
  return value.replace(/["\\]/g, "").trim();
}

export function buildGmailSearchQuery(filters: GmailInboxFilters) {
  const parts = [`newer_than:${filters.periodDays}d`];
  const presetQueryTerms = presetTerms[filters.preset];

  if (filters.unreadOnly) {
    parts.push("is:unread");
  }

  if (filters.hasAttachment) {
    parts.push("has:attachment");
  }

  if (presetQueryTerms?.length) {
    parts.push(`{${presetQueryTerms.map(quoteGmailTerm).join(" ")}}`);
  }

  if (filters.query) {
    parts.push(quoteGmailTerm(filters.query));
  }

  return parts.join(" ");
}

export function filterGmailMessages(
  messages: NormalizedGmailMessage[],
  filters: Pick<GmailInboxFilters, "accountId" | "label">,
) {
  return messages.filter((message) => {
    if (filters.accountId && message.accountId !== filters.accountId) {
      return false;
    }

    if (filters.label && !message.labelIds.includes(filters.label)) {
      return false;
    }

    return true;
  });
}

export function getAvailableGmailLabels(messages: NormalizedGmailMessage[]) {
  return Array.from(
    new Set(messages.flatMap((message) => message.labelIds)),
  ).sort((first, second) => first.localeCompare(second));
}

export function describeGmailFilters(filters: GmailInboxFilters) {
  const preset = gmailInboxPresets.find(
    (item) => item.value === filters.preset,
  );
  const active = [
    preset ? preset.label : null,
    `${filters.periodDays} dias`,
    filters.accountId ? "Conta selecionada" : null,
    filters.unreadOnly ? "Nao lidos" : null,
    filters.hasAttachment ? "Com anexo" : null,
    filters.label ? `Label ${filters.label}` : null,
    filters.query ? `Busca: ${filters.query}` : null,
  ].filter(Boolean);

  return active.join(" / ");
}
