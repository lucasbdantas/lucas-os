type StatusBadgeProps = {
  label: string;
  tone?: "default" | "green" | "amber" | "red" | "blue";
};

const humanLabels: Record<string, string> = {
  active: "Ativo",
  administrative: "Administrativo",
  canceled: "Cancelado",
  completed: "Concluído",
  critical: "Crítica",
  deadline: "Prazo",
  doing: "Em andamento",
  done: "Concluída",
  high: "Alta",
  learning: "Aprendizado",
  low: "Baixa",
  manual: "Manual",
  medium: "Média",
  ongoing: "Contínuo",
  paused: "Pausado",
  seasonal: "Sazonal",
  system: "Sistema",
  todo: "A fazer",
  waiting: "Aguardando",
};

export function StatusBadge({ label, tone = "default" }: StatusBadgeProps) {
  const displayLabel = humanLabels[label] ?? label;

  return (
    <span
      className="status-badge inline-flex px-2.5 py-1 text-xs font-semibold"
      data-tone={tone}
    >
      {displayLabel}
    </span>
  );
}
