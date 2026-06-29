import { updateProjectStatus } from "@/lib/projects/actions";

const statuses = ["active", "waiting", "paused", "completed", "canceled"];

type ProjectStatusActionsProps = {
  projectId: string;
  currentStatus: string;
  returnTo: string;
};

export function ProjectStatusActions({
  projectId,
  currentStatus,
  returnTo,
}: ProjectStatusActionsProps) {
  return (
    <form action={updateProjectStatus} className="flex flex-wrap gap-2">
      <input name="projectId" type="hidden" value={projectId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <select
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        defaultValue={currentStatus}
        name="status"
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
        Atualizar
      </button>
    </form>
  );
}
