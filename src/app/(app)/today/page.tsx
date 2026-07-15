import Link from "next/link";
import { DailyPlanningPanel } from "@/components/today/daily-planning-panel";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  addDays,
  toDateOnlyInTimezone,
} from "@/lib/app-settings/preferences";
import { getAppPreferencesForUser } from "@/lib/app-settings/server";
import {
  getDailyPlanForDate,
  getRecentDailyPlans,
} from "@/lib/ai/daily-plan-repository";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  getGoogleCalendarAgendaForUser,
  type GoogleCalendarAgenda,
} from "@/lib/integrations/google/calendar";
import { getCalendarLanePreferencesForUser } from "@/lib/integrations/google/calendar-lane-settings";
import { splitCalendarEventsByLane } from "@/lib/integrations/google/calendar-lanes";
import type { NormalizedGoogleCalendarEvent } from "@/lib/integrations/google/calendar-events";
import {
  isReminderOverdue,
  parseReminderPayload,
  type ReminderPayload,
} from "@/lib/reminders/reminders";
import { requireSession } from "@/lib/supabase/require-session";
import { getRecurrenceLabel } from "@/lib/tasks/recurrence";

type DomainRow = {
  id: string;
  name: string;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  type: string;
  target_date: string | null;
  domain_id: string;
};

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  due_date: string | null;
  due_time: string | null;
  priority: string;
  energy_required: string | null;
  context: string | null;
  domain_id: string;
  project_id: string | null;
  recurrence_type: string | null;
};

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  source_url: string | null;
  undo_payload: unknown;
};

type ReminderRow = NotificationRow & {
  payload: ReminderPayload;
};

const openTaskStatuses = ["todo", "doing", "waiting"];

const priorityRank: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

async function getCount(query: PromiseLike<CountResult>) {
  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

function sortByDueDateAndPriority<
  T extends { due_date: string | null; priority: string },
>(rows: T[]) {
  return [...rows].sort((first, second) => {
    const dateDelta = (first.due_date ?? "9999-12-31").localeCompare(
      second.due_date ?? "9999-12-31",
    );

    if (dateDelta !== 0) {
      return dateDelta;
    }

    return (
      (priorityRank[first.priority] ?? 99) -
      (priorityRank[second.priority] ?? 99)
    );
  });
}

function getPriorityTone(priority: string) {
  if (priority === "critical") return "red";
  if (priority === "high") return "amber";
  if (priority === "medium") return "blue";

  return "default";
}

function getProjectTone(status: string) {
  if (status === "active") return "green";
  if (status === "waiting") return "amber";
  if (status === "canceled") return "red";

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

function TaskSection({
  description,
  emptyDescription,
  emptyTitle,
  tasks,
  title,
  domainNameById,
  projectNameById,
}: {
  description?: string;
  emptyDescription: string;
  emptyTitle: string;
  tasks: TaskRow[];
  title: string;
  domainNameById: Map<string, string>;
  projectNameById: Map<string, string>;
}) {
  return (
    <section className="section-shell">
      <SectionHeader
        action={<StatusBadge label={`${tasks.length}`} />}
        description={description}
        title={title}
      />

      {tasks.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <article
              className="task-card app-card-interactive p-4"
              key={task.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-zinc-950">
                      {task.title}
                    </h3>
                    <StatusBadge
                      label={task.priority}
                      tone={getPriorityTone(task.priority)}
                    />
                    {getTaskRecurrenceLabel(task.recurrence_type) ? (
                      <StatusBadge
                        label={getTaskRecurrenceLabel(task.recurrence_type)!}
                      />
                    ) : null}
                    {task.status !== "todo" ? (
                      <StatusBadge label={task.status} />
                    ) : null}
                  </div>
                  {task.notes ? (
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {task.notes}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                    <span>Data: {formatDate(task.due_date)}</span>
                    {task.due_time ? (
                      <span>Horario: {task.due_time.slice(0, 5)}</span>
                    ) : null}
                    <span>
                      Dominio:{" "}
                      {domainNameById.get(task.domain_id) ?? "Sem dominio"}
                    </span>
                    {task.project_id ? (
                      <span>
                        Projeto:{" "}
                        {projectNameById.get(task.project_id) ?? "Sem projeto"}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="soft-button px-4 py-3 text-sm font-semibold"
      href={href}
    >
      {label}
    </Link>
  );
}

function getNextActionHref(project: Pick<ProjectRow, "id" | "domain_id">) {
  return `/tasks?domain=${project.domain_id}&project=${project.id}#task-form`;
}

function getCalendarEventDateOnly(
  event: NormalizedGoogleCalendarEvent,
  timezone: Parameters<typeof toDateOnlyInTimezone>[0],
) {
  if (event.isAllDay) {
    return event.start;
  }

  return toDateOnlyInTimezone(timezone, new Date(event.start));
}

function formatCalendarEventTime(
  event: NormalizedGoogleCalendarEvent,
  timezone: Parameters<typeof toDateOnlyInTimezone>[0],
) {
  if (event.isAllDay) {
    return "Dia todo";
  }

  return formatDateTime(event.start, "Sem horario", timezone);
}

function CalendarEventList({
  events,
  isContext = false,
  timezone,
}: {
  events: NormalizedGoogleCalendarEvent[];
  isContext?: boolean;
  timezone: Parameters<typeof toDateOnlyInTimezone>[0];
}) {
  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <article
          className={`event-card p-4 ${isContext ? "event-card-context" : ""}`}
          key={event.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-zinc-950">{event.title}</h3>
                {event.isAllDay ? <StatusBadge label="dia todo" /> : null}
              </div>
              <div className="mt-2 grid gap-1 text-sm text-zinc-600">
                <p>{formatCalendarEventTime(event, timezone)}</p>
                <p>Conta: {event.accountEmail}</p>
                <p>Calendario: {event.calendarSummary}</p>
                {event.location ? <p>Local: {event.location}</p> : null}
              </div>
            </div>
            {event.htmlLink ? (
              <a
                className="soft-button px-3 py-2 text-sm font-medium"
                href={event.htmlLink}
                rel="noreferrer"
                target="_blank"
              >
                Abrir no Google
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function CalendarSection({
  agenda,
  contextNextEvents,
  contextTodayEvents,
  primaryNextEvents,
  primaryTodayEvents,
  timezone,
}: {
  agenda: GoogleCalendarAgenda;
  contextNextEvents: NormalizedGoogleCalendarEvent[];
  contextTodayEvents: NormalizedGoogleCalendarEvent[];
  primaryNextEvents: NormalizedGoogleCalendarEvent[];
  primaryTodayEvents: NormalizedGoogleCalendarEvent[];
  timezone: Parameters<typeof toDateOnlyInTimezone>[0];
}) {
  const hasPrimaryEvents =
    primaryTodayEvents.length > 0 || primaryNextEvents.length > 0;
  const hasContextEvents =
    contextTodayEvents.length > 0 || contextNextEvents.length > 0;

  return (
    <section className="section-shell">
      <SectionHeader
        action={
          <Link
            className="soft-button px-3 py-2 text-sm font-medium"
            href="/settings/integrations"
          >
            Configurar Google
          </Link>
        }
        description="Eventos Google Calendar em lanes para reduzir ruido."
        title="Agenda"
      />

      {agenda.connectedAccountCount === 0 ? (
        <EmptyState
          description="Conecte uma conta Google em Settings para ver sua agenda aqui."
          title="Nenhuma conta Google conectada"
        />
      ) : null}

      {agenda.reconnectAccountEmails.length > 0 ? (
        <div className="app-card-muted mb-3 p-3 text-sm text-amber-800">
          Reconecte{" "}
          {agenda.reconnectAccountEmails.join(", ")} para conceder acesso
          somente leitura ao Calendar.
        </div>
      ) : null}

      {agenda.warnings.length > 0 ? (
        <div className="app-card-muted mb-3 p-3 text-sm text-zinc-600">
          Algumas contas Google nao puderam ser sincronizadas agora. O restante
          do Today continua funcionando.
        </div>
      ) : null}

      {agenda.connectedAccountCount > 0 &&
      !hasPrimaryEvents &&
      !hasContextEvents ? (
        <EmptyState
          description="Nenhum evento visivel encontrado para hoje ou proximos 7 dias. Calendarios ocultos ficam fora do Today."
          title="Agenda livre"
        />
      ) : null}

      {hasPrimaryEvents || hasContextEvents ? (
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)]">
          <div className="app-card-soft p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-zinc-950">
                  Agenda principal
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Aulas, reunioes, prazos e compromissos que competem pelo dia.
                </p>
              </div>
              <StatusBadge
                label={`${primaryTodayEvents.length + primaryNextEvents.length}`}
              />
            </div>

            {hasPrimaryEvents ? (
              <div className="grid gap-5">
                {primaryTodayEvents.length > 0 ? (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-zinc-700">
                      Hoje
                    </h4>
                    <CalendarEventList
                      events={primaryTodayEvents}
                      timezone={timezone}
                    />
                  </div>
                ) : null}

                {primaryNextEvents.length > 0 ? (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-zinc-700">
                      Proximos 7 dias
                    </h4>
                    <CalendarEventList
                      events={primaryNextEvents}
                      timezone={timezone}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                description="Nenhum evento marcado como agenda principal."
                title="Agenda principal livre"
              />
            )}
          </div>

          <div className="app-card-soft p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-zinc-800">
                  Contexto / Interesses
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Calendarios uteis que nao devem competir com compromissos.
                </p>
              </div>
              <StatusBadge
                label={`${contextTodayEvents.length + contextNextEvents.length}`}
              />
            </div>

            {hasContextEvents ? (
              <div className="grid gap-5">
                {contextTodayEvents.length > 0 ? (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-zinc-600">
                      Hoje
                    </h4>
                    <CalendarEventList
                      events={contextTodayEvents}
                      isContext
                      timezone={timezone}
                    />
                  </div>
                ) : null}

                {contextNextEvents.length > 0 ? (
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-zinc-600">
                      Proximos 7 dias
                    </h4>
                    <CalendarEventList
                      events={contextNextEvents}
                      isContext
                      timezone={timezone}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                description="Calendarios de contexto aparecerao aqui quando tiverem eventos visiveis."
                title="Sem contexto agora"
              />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default async function TodayPage() {
  const { supabase, user } = await requireSession();
  const preferences = await getAppPreferencesForUser(supabase, user.id);
  const now = new Date();
  const today = toDateOnlyInTimezone(preferences.timezone, now);
  const tomorrow = toDateOnlyInTimezone(preferences.timezone, addDays(now, 1));
  const nextSevenDays = toDateOnlyInTimezone(
    preferences.timezone,
    addDays(now, 7),
  );
  const nextFourteenDays = toDateOnlyInTimezone(
    preferences.timezone,
    addDays(now, 14),
  );
  const calendarTimeMin = new Date(`${today}T00:00:00.000Z`).toISOString();
  const calendarTimeMax = new Date(
    `${nextSevenDays}T23:59:59.999Z`,
  ).toISOString();
  const isCompact = preferences.todayDensity === "compact";
  const sectionGapClass = isCompact ? "mt-6 grid gap-6" : "mt-8 grid gap-8";
  const taskDisplayLimit = isCompact ? 5 : 20;
  const projectDisplayLimit = isCompact ? 5 : 10;

  const [
    pendingCapturesCount,
    overdueTasksResult,
    todayTasksResult,
    nextTasksResult,
    upcomingProjectsResult,
    activeProjectsResult,
    openProjectTasksResult,
    remindersResult,
    googleCalendarAgenda,
    calendarLanePreferences,
    domainsResult,
    projectsForNamesResult,
    dailyPlan,
    dailyPlanHistory,
  ] = await Promise.all([
    getCount(
      supabase
        .from("pending_captures")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ),
    supabase
      .from("tasks")
      .select(
        "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id,recurrence_type",
      )
      .in("status", openTaskStatuses)
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .returns<TaskRow[]>(),
    supabase
      .from("tasks")
      .select(
        "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id,recurrence_type",
      )
      .in("status", openTaskStatuses)
      .eq("due_date", today)
      .order("due_time", { ascending: true, nullsFirst: false })
      .returns<TaskRow[]>(),
    supabase
      .from("tasks")
      .select(
        "id,title,notes,status,due_date,due_time,priority,energy_required,context,domain_id,project_id,recurrence_type",
      )
      .in("status", openTaskStatuses)
      .gte("due_date", tomorrow)
      .lte("due_date", nextSevenDays)
      .order("due_date", { ascending: true })
      .order("due_time", { ascending: true, nullsFirst: false })
      .returns<TaskRow[]>(),
    supabase
      .from("projects")
      .select("id,name,status,type,target_date,domain_id")
      .in("status", ["active", "waiting"])
      .not("target_date", "is", null)
      .gte("target_date", today)
      .lte("target_date", nextFourteenDays)
      .order("target_date", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true })
      .limit(10)
      .returns<ProjectRow[]>(),
    supabase
      .from("projects")
      .select("id,name,status,type,target_date,domain_id")
      .eq("status", "active")
      .order("name", { ascending: true })
      .returns<ProjectRow[]>(),
    supabase
      .from("tasks")
      .select("project_id")
      .in("status", openTaskStatuses)
      .not("project_id", "is", null)
      .returns<Array<{ project_id: string | null }>>(),
    supabase
      .from("notifications")
      .select("id,title,body,source_url,undo_payload")
      .eq("type", "task_reminder")
      .eq("status", "unread")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<NotificationRow[]>(),
    getGoogleCalendarAgendaForUser({
      supabase,
      timeMax: calendarTimeMax,
      timeMin: calendarTimeMin,
      userId: user.id,
    }),
    getCalendarLanePreferencesForUser(supabase, user.id),
    supabase.from("domains").select("id,name").returns<DomainRow[]>(),
    supabase
      .from("projects")
      .select("id,name,status,type,target_date,domain_id")
      .returns<ProjectRow[]>(),
    getDailyPlanForDate(supabase, user.id, today, preferences.timezone),
    getRecentDailyPlans(supabase, user.id),
  ]);

  if (overdueTasksResult.error) {
    throw new Error(overdueTasksResult.error.message);
  }
  if (todayTasksResult.error) {
    throw new Error(todayTasksResult.error.message);
  }
  if (nextTasksResult.error) {
    throw new Error(nextTasksResult.error.message);
  }
  if (upcomingProjectsResult.error) {
    throw new Error(upcomingProjectsResult.error.message);
  }
  if (activeProjectsResult.error) {
    throw new Error(activeProjectsResult.error.message);
  }
  if (openProjectTasksResult.error) {
    throw new Error(openProjectTasksResult.error.message);
  }
  if (remindersResult.error) {
    throw new Error(remindersResult.error.message);
  }
  if (domainsResult.error) {
    throw new Error(domainsResult.error.message);
  }
  if (projectsForNamesResult.error) {
    throw new Error(projectsForNamesResult.error.message);
  }

  const domainNameById = new Map(
    domainsResult.data.map((domain) => [domain.id, domain.name]),
  );
  const projectNameById = new Map(
    projectsForNamesResult.data.map((project) => [project.id, project.name]),
  );
  const projectIdsWithOpenTasks = new Set(
    openProjectTasksResult.data
      .map((task) => task.project_id)
      .filter((projectId): projectId is string => Boolean(projectId)),
  );
  const projectsWithoutNextAction = activeProjectsResult.data
    .filter((project) => !projectIdsWithOpenTasks.has(project.id))
    .slice(0, 10);

  const overdueTasks = sortByDueDateAndPriority(overdueTasksResult.data);
  const todayTasks = sortByDueDateAndPriority(todayTasksResult.data);
  const nextTasks = sortByDueDateAndPriority(nextTasksResult.data);
  const displayedOverdueTasks = overdueTasks.slice(0, taskDisplayLimit);
  const displayedTodayTasks = todayTasks.slice(0, taskDisplayLimit);
  const displayedNextTasks = nextTasks.slice(0, taskDisplayLimit);
  const displayedUpcomingProjects = upcomingProjectsResult.data.slice(
    0,
    projectDisplayLimit,
  );
  const nowIso = new Date().toISOString();
  const todayReminders = remindersResult.data
    .map((notification) => ({
      ...notification,
      payload: parseReminderPayload(notification.undo_payload),
    }))
    .filter(
      (notification): notification is ReminderRow =>
        Boolean(notification.payload) &&
        (isReminderOverdue(notification.payload!.reminder_at, nowIso) ||
          toDateOnlyInTimezone(
            preferences.timezone,
            new Date(notification.payload!.reminder_at),
          ) === today),
    )
    .sort((first, second) =>
      first.payload.reminder_at.localeCompare(second.payload.reminder_at),
    )
    .slice(0, isCompact ? 3 : 5);
  const calendarEventsByLane = splitCalendarEventsByLane(
    googleCalendarAgenda.events,
    calendarLanePreferences,
  );
  const primaryTodayCalendarEvents = calendarEventsByLane.primary.filter(
    (event) => getCalendarEventDateOnly(event, preferences.timezone) === today,
  );
  const primaryNextCalendarEvents = calendarEventsByLane.primary.filter((event) => {
    const eventDate = getCalendarEventDateOnly(event, preferences.timezone);

    return eventDate > today && eventDate <= nextSevenDays;
  });
  const contextTodayCalendarEvents = calendarEventsByLane.context.filter(
    (event) => getCalendarEventDateOnly(event, preferences.timezone) === today,
  );
  const contextNextCalendarEvents = calendarEventsByLane.context.filter((event) => {
    const eventDate = getCalendarEventDateOnly(event, preferences.timezone);

    return eventDate > today && eventDate <= nextSevenDays;
  });

  return (
    <main className="app-page mx-auto max-w-7xl">
      <section className="paper-panel p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <PageHeader
            eyebrow="Lucas OS"
            title="Today"
            description={`Painel operacional do dia em ${preferences.timezone}. Um caderno curto para decidir o que merece atencao agora.`}
          />
          <div className="app-card-soft p-4">
            <p className="section-eyebrow">Inbox calma</p>
            <p className="mt-2 text-3xl font-semibold text-zinc-950">
              {pendingCapturesCount}
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              capturas pendentes aguardando triagem humana.
            </p>
            <Link
              className="primary-button mt-4 w-full px-4 py-3 text-sm font-semibold"
              href="/capture"
            >
              Abrir Capture
            </Link>
          </div>
        </div>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatCard label="Vencidas" value={overdueTasks.length} />
          <StatCard label="Hoje" value={todayTasks.length} />
          <StatCard label="Proximos 7 dias" value={nextTasks.length} />
        </section>
      </section>

      <div className={sectionGapClass}>
        <DailyPlanningPanel
          history={dailyPlanHistory}
          initialPlan={dailyPlan}
        />

        <CalendarSection
          agenda={googleCalendarAgenda}
          contextNextEvents={contextNextCalendarEvents.slice(0, isCompact ? 5 : 15)}
          contextTodayEvents={contextTodayCalendarEvents.slice(
            0,
            isCompact ? 5 : 15,
          )}
          primaryNextEvents={primaryNextCalendarEvents.slice(
            0,
            isCompact ? 5 : 15,
          )}
          primaryTodayEvents={primaryTodayCalendarEvents.slice(
            0,
            isCompact ? 5 : 15,
          )}
          timezone={preferences.timezone}
        />

        <section className="section-shell">
          <SectionHeader
            action={
              <Link
                className="soft-button px-3 py-2 text-sm font-medium"
                href="/notifications"
              >
                Abrir notificacoes
              </Link>
            }
            description="Lembretes internos vencidos ou previstos para hoje."
            title="Lembretes"
          />

          {todayReminders.length === 0 ? (
            <EmptyState
              description="Nenhum lembrete interno vencido ou para hoje."
              title="Sem lembretes"
            />
          ) : (
            <div className="grid gap-3">
              {todayReminders.map((reminder) => (
                <article
                  className="app-card-soft p-4"
                  key={reminder.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-zinc-950">
                        {reminder.title}
                      </h3>
                      {reminder.body ? (
                        <p className="mt-1 text-sm text-zinc-600">
                          {reminder.body}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-zinc-600">
                        Lembrar em{" "}
                        {formatDateTime(
                          reminder.payload.reminder_at,
                          "Sem data",
                          preferences.timezone,
                        )}
                      </p>
                    </div>
                    {reminder.source_url ? (
                      <Link
                        className="soft-button px-3 py-2 text-sm font-medium"
                        href={reminder.source_url}
                      >
                        Abrir task
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <TaskSection
          description="Tasks abertas com data anterior a hoje."
          domainNameById={domainNameById}
          emptyDescription="Nada vencido agora. Bom sinal operacional."
          emptyTitle="Nenhuma tarefa vencida"
          projectNameById={projectNameById}
          tasks={displayedOverdueTasks}
          title="Tarefas vencidas"
        />

        <TaskSection
          description="Tasks abertas com data de hoje."
          domainNameById={domainNameById}
          emptyDescription="Nenhuma tarefa com data de hoje. Use Capture ou Tasks para planejar o dia."
          emptyTitle="Nenhuma tarefa para hoje"
          projectNameById={projectNameById}
          tasks={displayedTodayTasks}
          title="Tarefas de hoje"
        />

        <TaskSection
          description="Tasks abertas entre amanha e os proximos 7 dias."
          domainNameById={domainNameById}
          emptyDescription="Nenhuma task proxima nos proximos 7 dias."
          emptyTitle="Sem proximos prazos"
          projectNameById={projectNameById}
          tasks={displayedNextTasks}
          title="Proximos 7 dias"
        />

        <section className="section-shell">
          <SectionHeader
            action={<StatusBadge label={`${displayedUpcomingProjects.length}`} />}
            description="Projetos ativos ou waiting com target nos proximos 14 dias."
            title="Projetos com prazo proximo"
          />

          {displayedUpcomingProjects.length === 0 ? (
            <EmptyState
              description="Projetos com target nos proximos 14 dias aparecerao aqui."
              title="Nenhum projeto com prazo proximo"
            />
          ) : (
            <div className="grid gap-3">
              {displayedUpcomingProjects.map((project) => (
                <article
                  className="project-card app-card-interactive p-4"
                  key={project.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-zinc-950">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        {domainNameById.get(project.domain_id) ?? "Sem dominio"}{" "}
                        - {formatDate(project.target_date)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        label={project.status}
                        tone={getProjectTone(project.status)}
                      />
                      <StatusBadge label={project.type} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {preferences.showProjectsWithoutNextAction ? (
        <section className="section-shell">
          <SectionHeader
            action={
              <StatusBadge
                label={`${projectsWithoutNextAction.slice(0, projectDisplayLimit).length}`}
              />
            }
            description="Projetos ativos que nao possuem nenhuma task aberta associada."
            title="Projetos ativos sem proxima acao"
          />

          {projectsWithoutNextAction.length === 0 ? (
            <EmptyState
              description="Todos os projetos ativos encontrados tem pelo menos uma task aberta."
              title="Nenhum projeto morto detectado"
            />
          ) : (
            <div className="grid gap-3">
              {projectsWithoutNextAction
                .slice(0, projectDisplayLimit)
                .map((project) => (
                <article
                  className="project-card app-card-interactive p-4"
                  key={project.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-zinc-950">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        {domainNameById.get(project.domain_id) ?? "Sem dominio"}
                        {project.target_date
                          ? ` - alvo ${formatDate(project.target_date)}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label="sem proxima acao" tone="amber" />
                      <Link
                        className="soft-button px-3 py-2 text-sm font-medium"
                        href={getNextActionHref(project)}
                      >
                        Criar proxima acao
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        ) : null}

        <section className="section-shell">
          <SectionHeader
            description="Atalhos curtos para capturar, revisar e ajustar o sistema."
            title="Acoes rapidas"
          />
          <div className="grid gap-3 sm:grid-cols-4">
            <QuickLink href="/capture" label="Nova captura" />
            <QuickLink href="/review" label="Weekly Review" />
            <QuickLink href="/tasks" label="Abrir Tasks" />
            <QuickLink href="/projects" label="Abrir Projects" />
          </div>
        </section>
      </div>
    </main>
  );
}
