type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="app-card-soft px-5 py-8">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
        {description}
      </p>
    </div>
  );
}
