type StatCardProps = {
  label: string;
  value: number | string;
  detail?: string;
};

export function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950">{value}</p>
      {detail ? <p className="mt-2 text-sm text-zinc-600">{detail}</p> : null}
    </div>
  );
}
