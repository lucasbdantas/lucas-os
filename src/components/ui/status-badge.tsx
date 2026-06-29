type StatusBadgeProps = {
  label: string;
  tone?: "default" | "green" | "amber" | "red" | "blue";
};

const toneClassName: Record<NonNullable<StatusBadgeProps["tone"]>, string> = {
  default: "border-zinc-200 bg-zinc-100 text-zinc-700",
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
};

export function StatusBadge({ label, tone = "default" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${toneClassName[tone]}`}
    >
      {label}
    </span>
  );
}
