import Link from "next/link";
import { cancelTask, completeTask } from "@/lib/tasks/actions";

type TaskActionsProps = {
  taskId: string;
  returnTo: string;
  showStatusActions?: boolean;
};

export function TaskActions({
  taskId,
  returnTo,
  showStatusActions = true,
}: TaskActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        href={`/tasks?edit=${taskId}#edit-task`}
      >
        Editar
      </Link>
      {showStatusActions ? (
        <>
          <form action={completeTask}>
            <input name="taskId" type="hidden" value={taskId} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <button className="rounded-md border border-green-200 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50">
              Concluir
            </button>
          </form>
          <form action={cancelTask}>
            <input name="taskId" type="hidden" value={taskId} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              Cancelar
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}
