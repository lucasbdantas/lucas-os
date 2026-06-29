import { cancelTask, completeTask } from "@/lib/tasks/actions";

type TaskActionsProps = {
  taskId: string;
  returnTo: string;
};

export function TaskActions({ taskId, returnTo }: TaskActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
