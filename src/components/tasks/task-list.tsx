import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { TaskActions } from "@/components/tasks/task-actions";
import { formatDate } from "@/lib/format";
import { getRecurrenceLabel } from "@/lib/tasks/recurrence";

export type TaskListItem = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  due_date: string | null;
  due_time: string | null;
  priority: string;
  energy_required: string | null;
  context: string | null;
  recurrence_type?: string | null;
  domainName?: string;
  projectName?: string;
};

type TaskListProps = {
  tasks: TaskListItem[];
  emptyTitle: string;
  emptyDescription: string;
  returnTo: string;
  showActions?: boolean;
  showStatusActions?: boolean;
};

function getPriorityTone(priority: string) {
  if (priority === "critical") return "red";
  if (priority === "high") return "amber";
  if (priority === "medium") return "blue";

  return "default";
}

function getTaskRecurrenceLabel(recurrenceType: string | null | undefined) {
  if (
    recurrenceType === "none" ||
    recurrenceType === "daily" ||
    recurrenceType === "weekly" ||
    recurrenceType === "monthly"
  ) {
    return getRecurrenceLabel(recurrenceType);
  }

  return null;
}

export function TaskList({
  tasks,
  emptyTitle,
  emptyDescription,
  returnTo,
  showActions = true,
  showStatusActions = true,
}: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <article
          className="rounded-md border border-zinc-200 bg-white p-4"
          key={task.id}
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-zinc-950">{task.title}</h2>
                <StatusBadge label={task.status} tone="blue" />
                <StatusBadge
                  label={task.priority}
                  tone={getPriorityTone(task.priority)}
                />
                {getTaskRecurrenceLabel(task.recurrence_type) ? (
                  <StatusBadge label={getTaskRecurrenceLabel(task.recurrence_type)!} />
                ) : null}
              </div>
              {task.notes ? (
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {task.notes}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                <span>
                  Prazo: {formatDate(task.due_date)}
                  {task.due_time ? ` as ${task.due_time.slice(0, 5)}` : ""}
                </span>
                {task.domainName ? (
                  <span>Dominio: {task.domainName}</span>
                ) : null}
                {task.projectName ? (
                  <span>Projeto: {task.projectName}</span>
                ) : null}
                {task.energy_required ? (
                  <span>Energia: {task.energy_required}</span>
                ) : null}
                {task.context ? <span>Contexto: {task.context}</span> : null}
              </div>
            </div>
            {showActions ? (
              <TaskActions
                returnTo={returnTo}
                showStatusActions={showStatusActions}
                taskId={task.id}
              />
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
