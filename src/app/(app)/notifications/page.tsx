import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAppPreferencesForUser } from "@/lib/app-settings/server";
import { formatDateTime } from "@/lib/format";
import {
  dismissNotification,
  markNotificationRead,
} from "@/lib/notifications/actions";
import {
  isReminderOverdue,
  parseReminderPayload,
  type ReminderPayload,
} from "@/lib/reminders/reminders";
import { requireSession } from "@/lib/supabase/require-session";

type NotificationsPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  status: string;
  source_ref: string | null;
  source_url: string | null;
  undo_payload: unknown;
  created_at: string;
};

type ReminderNotification = NotificationRow & {
  payload: ReminderPayload | null;
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

function getTaskEditHref(notification: ReminderNotification) {
  if (notification.source_url) {
    return notification.source_url;
  }

  if (notification.source_ref && uuidRegex.test(notification.source_ref)) {
    return `/tasks?edit=${notification.source_ref}#edit-task`;
  }

  return null;
}

function NotificationSection({
  emptyDescription,
  emptyTitle,
  notifications,
  timezone,
  title,
}: {
  emptyDescription: string;
  emptyTitle: string;
  notifications: ReminderNotification[];
  timezone: string;
  title: string;
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-zinc-950">{title}</h2>
        <StatusBadge label={`${notifications.length}`} />
      </div>

      {notifications.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-3">
          {notifications.map((notification) => {
            const taskEditHref = getTaskEditHref(notification);

            return (
              <article
                className="rounded-md border border-zinc-200 bg-white p-4"
                key={notification.id}
              >
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-zinc-950">
                        {notification.title}
                      </h3>
                      <StatusBadge label={notification.status} />
                    </div>
                    {notification.body ? (
                      <p className="mt-2 text-sm leading-6 text-zinc-600">
                        {notification.body}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                      <span>
                        Lembrar em{" "}
                        {formatDateTime(
                          notification.payload?.reminder_at,
                          "Sem data",
                          timezone,
                        )}
                      </span>
                      <span>
                        Prazo{" "}
                        {formatDateTime(
                          notification.payload?.due_at,
                          "Sem data",
                          timezone,
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {taskEditHref ? (
                      <>
                        <Link
                          className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                          href={taskEditHref}
                        >
                          Abrir task
                        </Link>
                        <Link
                          className="rounded-md border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                          href={taskEditHref}
                        >
                          Editar task
                        </Link>
                      </>
                    ) : null}
                    {notification.status === "unread" ? (
                      <>
                        <form action={markNotificationRead}>
                          <input
                            name="notificationId"
                            type="hidden"
                            value={notification.id}
                          />
                          <input
                            name="returnTo"
                            type="hidden"
                            value="/notifications"
                          />
                          <button className="rounded-md border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
                            Marcar como lida
                          </button>
                        </form>
                        <form action={dismissNotification}>
                          <input
                            name="notificationId"
                            type="hidden"
                            value={notification.id}
                          />
                          <input
                            name="returnTo"
                            type="hidden"
                            value="/notifications"
                          />
                          <button className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                            Dispensar
                          </button>
                        </form>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const { error: pageError } = await searchParams;
  const { supabase, user } = await requireSession();
  const preferences = await getAppPreferencesForUser(supabase, user.id);
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,status,source_ref,source_url,undo_payload,created_at")
    .eq("type", "task_reminder")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<NotificationRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  const now = new Date().toISOString();
  const notifications: ReminderNotification[] = data.map((notification) => ({
    ...notification,
    payload: parseReminderPayload(notification.undo_payload),
  }));
  const unread = notifications.filter(
    (notification) => notification.status === "unread",
  );
  const overdue = unread.filter(
    (notification) =>
      notification.payload?.reminder_at &&
      isReminderOverdue(notification.payload.reminder_at, now),
  );
  const pending = unread.filter(
    (notification) =>
      notification.payload?.reminder_at &&
      !isReminderOverdue(notification.payload.reminder_at, now),
  );
  const recent = notifications
    .filter((notification) => notification.status !== "unread")
    .slice(0, 20);

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Lucas OS"
        title="Notificações"
        description="Lembretes internos de tasks, sem push notifications."
      />

      {pageError ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8">
        <NotificationSection
          emptyDescription="Nenhum lembrete vencido aguardando ação."
          emptyTitle="Sem lembretes vencidos"
          notifications={overdue}
          timezone={preferences.timezone}
          title="Lembretes vencidos"
        />

        <NotificationSection
          emptyDescription="Lembretes futuros aparecerão aqui."
          emptyTitle="Sem lembretes pendentes"
          notifications={pending}
          timezone={preferences.timezone}
          title="Lembretes pendentes"
        />

        <NotificationSection
          emptyDescription="Lembretes lidos ou dispensados aparecerão aqui."
          emptyTitle="Sem lembretes recentes"
          notifications={recent}
          timezone={preferences.timezone}
          title="Recentes"
        />
      </div>
    </main>
  );
}
