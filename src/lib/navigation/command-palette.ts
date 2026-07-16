export type CommandPaletteResultType =
  | "command"
  | "task"
  | "project"
  | "domain"
  | "capture";

export type CommandPaletteResult = {
  description: string;
  href: string;
  title: string;
  type: CommandPaletteResultType;
};

export type CommandPaletteEntityInput = {
  description: string;
  href: string;
  title: string;
  type: Exclude<CommandPaletteResultType, "command">;
};

export type CommandPaletteSearchResponse = {
  hasPartialFailure: boolean;
  results: CommandPaletteResult[];
};

export const commandPaletteCommands: CommandPaletteResult[] = [
  { description: "Painel operacional do dia", href: "/today", title: "Today", type: "command" },
  { description: "Capturar texto em um toque", href: "/quick-capture", title: "Quick Capture", type: "command" },
  { description: "Triar capturas pendentes", href: "/capture", title: "Capture", type: "command" },
  { description: "Email e entrada operacional", href: "/inbox", title: "Inbox", type: "command" },
  { description: "Criar e organizar tarefas", href: "/tasks", title: "Tasks", type: "command" },
  { description: "Projetos e milestones", href: "/projects", title: "Projects", type: "command" },
  { description: "Areas e dominios", href: "/domains", title: "Domains", type: "command" },
  { description: "Revisao semanal", href: "/review", title: "Review", type: "command" },
  { description: "Historico de planos diarios", href: "/planning", title: "Planning", type: "command" },
  { description: "Lembretes internos", href: "/notifications", title: "Notifications", type: "command" },
  { description: "Preferencias do app", href: "/settings", title: "Settings", type: "command" },
  { description: "Contas Google conectadas", href: "/settings/integrations", title: "Integrations", type: "command" },
  { description: "Exportacao e recuperacao", href: "/settings/backup", title: "Backup", type: "command" },
  { description: "Notificacoes push por dispositivo", href: "/settings/notifications", title: "Push Notifications", type: "command" },
];

export const commandPaletteSuggestions = [
  "Quick Capture",
  "Today",
  "Inbox",
  "Tasks",
  "Planning",
];

export function normalizeCommandPaletteQuery(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
}

export function shouldOpenCommandPaletteShortcut({
  ctrlKey,
  isEditable,
  key,
  metaKey,
}: {
  ctrlKey: boolean;
  isEditable: boolean;
  key: string;
  metaKey: boolean;
}) {
  return (
    !isEditable &&
    (ctrlKey || metaKey) &&
    key.toLocaleLowerCase("pt-BR") === "k"
  );
}

function getResultScore(result: CommandPaletteResult, query: string) {
  const title = normalizeCommandPaletteQuery(result.title);
  const type = normalizeCommandPaletteQuery(result.type);
  const description = normalizeCommandPaletteQuery(result.description);

  if (title === query) return 0;
  if (title.startsWith(query)) return 1;
  if (title.includes(query)) return 2;
  if (type.includes(query)) return 3;
  if (description.includes(query)) return 4;

  return Number.POSITIVE_INFINITY;
}

export function filterCommandPaletteResults(
  results: CommandPaletteResult[],
  rawQuery: string,
  limit = 24,
) {
  const query = normalizeCommandPaletteQuery(rawQuery);

  if (!query) {
    return results.slice(0, limit);
  }

  return results
    .map((result, index) => ({ index, result, score: getResultScore(result, query) }))
    .filter((item) => Number.isFinite(item.score))
    .sort((first, second) => first.score - second.score || first.index - second.index)
    .slice(0, limit)
    .map((item) => item.result);
}

export function buildCommandPaletteEntityResults(
  entities: CommandPaletteEntityInput[],
) {
  return entities.map((entity) => ({ ...entity }));
}

export function collectCommandPaletteSearchResults(
  settledResults: Array<PromiseSettledResult<CommandPaletteEntityInput[]>>,
) {
  const entities = settledResults.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  return {
    hasPartialFailure: settledResults.some((result) => result.status === "rejected"),
    results: buildCommandPaletteEntityResults(entities),
  } satisfies CommandPaletteSearchResponse;
}
