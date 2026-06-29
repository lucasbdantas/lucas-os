import { updateMilestoneStatus } from "@/lib/projects/actions";

type MilestoneActionsProps = {
  milestoneId: string;
  returnTo: string;
};

export function MilestoneActions({ milestoneId, returnTo }: MilestoneActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={updateMilestoneStatus}>
        <input name="milestoneId" type="hidden" value={milestoneId} />
        <input name="status" type="hidden" value="done" />
        <input name="returnTo" type="hidden" value={returnTo} />
        <button className="rounded-md border border-green-200 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50">
          Done
        </button>
      </form>
      <form action={updateMilestoneStatus}>
        <input name="milestoneId" type="hidden" value={milestoneId} />
        <input name="status" type="hidden" value="canceled" />
        <input name="returnTo" type="hidden" value={returnTo} />
        <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
          Cancelar
        </button>
      </form>
    </div>
  );
}
