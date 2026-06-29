type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-white px-5 py-8">
      <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
        {description}
      </p>
    </div>
  );
}
