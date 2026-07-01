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
        className="soft-button px-3 py-2 text-sm font-semibold"
        href={`/tasks?edit=${taskId}#edit-task`}
      >
        Editar
      </Link>
      {showStatusActions ? (
        <>
          <form action={completeTask}>
            <input name="taskId" type="hidden" value={taskId} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <button className="soft-button px-3 py-2 text-sm font-semibold">
              Concluir
            </button>
          </form>
          <form action={cancelTask}>
            <input name="taskId" type="hidden" value={taskId} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <button className="danger-button px-3 py-2 text-sm font-semibold">
              Cancelar
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}
