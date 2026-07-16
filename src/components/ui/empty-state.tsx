import { CircleDashed } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state app-card-soft px-5 py-7">
      <div className="flex items-start gap-4">
        <span className="empty-state-icon shrink-0" aria-hidden="true">
          <CircleDashed className="h-5 w-5" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
