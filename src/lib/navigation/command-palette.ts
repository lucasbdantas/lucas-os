export type CommandPaletteResultType =
  | "command"
  | "task"
  | "project"
  | "domain"
  | "capture"
  | "content";

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
  { description: "Painel operacional do dia", href: "/today", title: "Hoje", type: "command" },
  { description: "Capturar texto em um toque", href: "/quick-capture", title: "Captura rápida", type: "command" },
  { description: "Triar capturas pendentes", href: "/capture", title: "Capturas", type: "command" },
  { description: "Email e entrada operacional", href: "/inbox", title: "Inbox", type: "command" },
  { description: "Criar e organizar tarefas", href: "/tasks", title: "Tarefas", type: "command" },
  { description: "Projetos e marcos", href: "/projects", title: "Projetos", type: "command" },
  { description: "Conteúdos, referências e notas", href: "/library", title: "Biblioteca", type: "command" },
  { description: "Áreas e domínios", href: "/domains", title: "Domínios", type: "command" },
  { description: "Revisão semanal", href: "/review", title: "Revisão", type: "command" },
  { description: "Histórico de planos diários", href: "/planning", title: "Planejamento", type: "command" },
  { description: "Lembretes internos", href: "/notifications", title: "Notificações", type: "command" },
  { description: "Preferências do app", href: "/settings", title: "Configurações", type: "command" },
  { description: "Contas Google conectadas", href: "/settings/integrations", title: "Integrações", type: "command" },
  { description: "Exportação e recuperação", href: "/settings/backup", title: "Backup", type: "command" },
  { description: "Notificações push por dispositivo", href: "/settings/notifications", title: "Notificações push", type: "command" },
  { description: "Status seguro das configurações", href: "/settings/health", title: "Saúde do sistema", type: "command" },
  { description: "Checklist para concluir o setup", href: "/settings/health#setup", title: "Checklist do setup", type: "command" },
  { description: "Preview e limpeza segura do workspace", href: "/settings/data", title: "Dados do workspace", type: "command" },
];

export const commandPaletteSuggestions = [
  "Captura rápida",
  "Hoje",
  "Inbox",
  "Tarefas",
  "Planejamento",
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
