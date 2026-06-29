import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/supabase/require-session";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  due_time: string | null;
  priority: string;
};

export default async function TasksPage() {
  const { supabase } = await requireSession();
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id,title,status,due_date,due_time,priority,created_at")
    .in("status", ["todo", "doing", "waiting"])
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<TaskRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Tasks"
        description="Leitura real das tarefas abertas. CRUD entra em um passo posterior."
      />

      <section className="mt-8">
        {tasks.length === 0 ? (
          <EmptyState
            title="Nenhuma tarefa aberta"
            description="Ainda não criamos tarefas na Fase 1. Esta tela já está pronta para listar tarefas quando o CRUD entrar."
          />
        ) : (
          <div className="grid gap-3">
            {tasks.map((task) => (
              <article
                className="rounded-md border border-zinc-200 bg-white p-4"
                key={task.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-zinc-950">
                      {task.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      {formatDate(task.due_date)}
                      {task.due_time ? ` às ${task.due_time}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge label={task.status} tone="blue" />
                    <StatusBadge label={task.priority} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
