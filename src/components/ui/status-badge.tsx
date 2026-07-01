type StatusBadgeProps = {
  label: string;
  tone?: "default" | "green" | "amber" | "red" | "blue";
};

export function StatusBadge({ label, tone = "default" }: StatusBadgeProps) {
  return (
    <span
      className="status-badge inline-flex px-2.5 py-1 text-xs font-semibold"
      data-tone={tone}
    >
      {label}
    </span>
  );
}
