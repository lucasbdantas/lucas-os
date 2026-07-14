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
        className="field-control px-3 py-2 text-sm outline-none"
        maxLength={180}
        name="title"
        placeholder="Nova milestone"
        required
        type="text"
      />
      <input
        className="field-control px-3 py-2 text-sm outline-none"
        name="dueDate"
        type="date"
      />
      <input
        className="field-control px-3 py-2 text-sm outline-none"
        min={1}
        name="weight"
        placeholder="Peso"
        type="number"
      />
      <button className="soft-button px-3 py-2 text-sm font-semibold">
        Adicionar
      </button>
    </form>
  );
}
