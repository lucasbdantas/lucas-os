import { describe, expect, test } from "vitest";
import {
  buildPushPayload,
  getDuePushReminders,
  getPendingPushDeliveryTargets,
  type DuePushReminder,
} from "./reminder-dispatch";

function dueReminder(overrides: Partial<DuePushReminder> = {}): DuePushReminder {
  return {
    body: "Task: Revisar relatório de Controle com bastante detalhe para truncar se precisar",
    id: "notification-1",
    payload: {
      due_at: "2026-07-01T15:00:00.000Z",
      offset_minutes: 15,
      reminder_at: "2026-07-01T14:45:00.000Z",
      task_id: "task-1",
      timezone: "America/Sao_Paulo",
    },
    source_url: "/tasks?edit=task-1#edit-task",
    status: "unread",
    title: "Lembrete: 15 minutos antes",
    type: "task_reminder",
    undo_payload: {
      due_at: "2026-07-01T15:00:00.000Z",
      offset_minutes: 15,
      reminder_at: "2026-07-01T14:45:00.000Z",
      task_id: "task-1",
      timezone: "America/Sao_Paulo",
    },
    user_id: "user-1",
    ...overrides,
  };
}

describe("push reminder dispatch helpers", () => {
  test("selects only unread due task reminders", () => {
    const due = getDuePushReminders(
      [
        dueReminder(),
        dueReminder({
          id: "future",
          undo_payload: {
            due_at: "2026-07-02T15:00:00.000Z",
            offset_minutes: 15,
            reminder_at: "2026-07-02T14:45:00.000Z",
            task_id: "task-2",
            timezone: "America/Sao_Paulo",
          },
        }),
        dueReminder({ id: "read", status: "read" }),
        dueReminder({ id: "other", type: "other" }),
      ],
      "2026-07-01T14:46:00.000Z",
    );

    expect(due.map((notification) => notification.id)).toEqual([
      "notification-1",
    ]);
  });

  test("builds a sanitized push payload", () => {
    const payload = buildPushPayload(
      dueReminder({
        body: "Task:\n\nComprar cabo USB",
        source_url: "https://evil.example.com",
        title: "  Lembrete:\n agora  ",
      }),
    );

    expect(payload).toMatchObject({
      body: "Task: Comprar cabo USB",
      notificationId: "notification-1",
      tag: "lucas-os-reminder-notification-1",
      title: "Lembrete: agora",
      url: "/notifications",
    });
  });

  test("avoids duplicate delivery targets", () => {
    const targets = getPendingPushDeliveryTargets({
      deliveries: [
        {
          notification_id: "notification-1",
          subscription_id: "subscription-1",
        },
      ],
      notifications: [dueReminder()],
      subscriptions: [
        {
          auth: "auth",
          endpoint: "https://push.example.com/1",
          id: "subscription-1",
          p256dh: "p256dh",
        },
        {
          auth: "auth",
          endpoint: "https://push.example.com/2",
          id: "subscription-2",
          p256dh: "p256dh",
        },
      ],
    });

    expect(targets).toHaveLength(1);
    expect(targets[0]?.subscription.id).toBe("subscription-2");
  });
});
