type StatCardProps = {
  label: string;
  value: number | string;
  detail?: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="metric-card p-5">
      <p className="text-sm font-semibold text-zinc-600">{label}</p>
      <p className="mt-3 font-mono text-4xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>
      {detail ? <p className="mt-2 text-sm text-zinc-600">{detail}</p> : null}
    </div>
  );
}
