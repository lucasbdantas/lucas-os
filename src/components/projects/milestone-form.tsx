import { createMilestone } from "@/lib/projects/actions";

type MilestoneFormProps = {
  projectId: string;
  returnTo: string;
};

export function MilestoneForm({ projectId, returnTo }: MilestoneFormProps) {
  return (
    <form action={createMilestone} className="grid gap-3 md:grid-cols-[1fr_150px_100px_auto]">
      <input name="projectId" type="hidden" value={projectId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <input
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        maxLength={180}
        name="title"
        placeholder="Nova milestone"
        required
        type="text"
      />
      <input
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        name="dueDate"
        type="date"
      />
      <input
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        min={1}
        name="weight"
        placeholder="Peso"
        type="number"
      />
      <button className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
        Adicionar
      </button>
    </form>
  );
}
