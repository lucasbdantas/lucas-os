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
        <button className="soft-button px-3 py-2 text-sm font-semibold">
          Done
        </button>
      </form>
      <form action={updateMilestoneStatus}>
        <input name="milestoneId" type="hidden" value={milestoneId} />
        <input name="status" type="hidden" value="canceled" />
        <input name="returnTo" type="hidden" value={returnTo} />
        <button className="danger-button px-3 py-2 text-sm font-semibold">
          Cancelar
        </button>
      </form>
    </div>
  );
}
