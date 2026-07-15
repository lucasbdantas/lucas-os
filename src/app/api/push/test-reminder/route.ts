import { getAppPreferencesForUser } from "@/lib/app-settings/server";
import { buildReminderNotifications } from "@/lib/reminders/reminders";
import { getPushTestSchedule } from "@/lib/push/test-reminder";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Response.json(
      { error: "Configuração Supabase incompleta no servidor." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "Faça login para criar um lembrete de teste." },
      { status: 401 },
    );
  }

  try {
    const [{ data: inbox, error: inboxError }, preferences] = await Promise.all([
      supabase
        .from("domains")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", "Inbox")
        .eq("is_system", true)
        .maybeSingle<{ id: string }>(),
      getAppPreferencesForUser(supabase, user.id),
    ]);

    if (inboxError) {
      throw new Error(inboxError.message);
    }

    if (!inbox) {
      return Response.json(
        { error: "O domínio Inbox não foi encontrado para este usuário." },
        { status: 409 },
      );
    }

    const schedule = getPushTestSchedule(preferences.timezone);
    const taskTitle = "Teste de notificação push";
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        context: "celular",
        domain_id: inbox.id,
        due_date: schedule.dueDate,
        due_time: schedule.dueTime,
        notes:
          "Task criada manualmente pelo painel de diagnóstico de Push Notifications V1.",
        priority: "low",
        reminder_offsets: [0],
        source: "manual",
        status: "todo",
        title: taskTitle,
        user_id: user.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (taskError) {
      throw new Error(taskError.message);
    }

    const [reminder] = buildReminderNotifications({
      dueDate: schedule.dueDate,
      dueTime: schedule.dueTime,
      offsets: [0],
      taskId: task.id,
      taskTitle,
      timezone: preferences.timezone,
    });

    if (!reminder) {
      await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id)
        .eq("user_id", user.id);

      throw new Error("Não foi possível calcular o lembrete de teste.");
    }

    const { error: reminderError } = await supabase.from("notifications").insert({
      body: reminder.body,
      source_ref: reminder.sourceRef,
      source_url: reminder.sourceUrl,
      status: "unread",
      title: reminder.title,
      type: "task_reminder",
      undo_payload: reminder.payload,
      user_id: user.id,
    });

    if (reminderError) {
      await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id)
        .eq("user_id", user.id);

      throw new Error(reminderError.message);
    }

    return Response.json({
      dueDate: schedule.dueDate,
      dueTime: schedule.dueTime,
      ok: true,
      taskId: task.id,
    });
  } catch {
    return Response.json(
      { error: "Não foi possível criar o lembrete de teste." },
      { status: 500 },
    );
  }
}
