import { describe, expect, test } from "vitest";
import {
  addFailedReason,
  buildPushPayload,
  classifyPushFailure,
  countPushSkippedReasons,
  createEmptyPushFailedReasons,
  getDuePushReminders,
  getPendingPushDeliveryDiagnostics,
  getPendingPushDeliveryTargets,
  getPushReminderEligibilityDiagnostics,
  type DuePushReminder,
  type PushFailedExample,
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

  test("reports already delivered skips safely", () => {
    const diagnostics = getPendingPushDeliveryDiagnostics({
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
      ],
    });

    expect(diagnostics.targets).toHaveLength(0);
    expect(diagnostics.skippedReasons.already_delivered).toBe(1);
    expect(diagnostics.examples).toEqual([
      {
        notification: "cation-1",
        reason: "already_delivered",
        subscription: "iption-1",
      },
    ]);
  });

  test("reports invalid payload and not due reminders", () => {
    const diagnostics = getPushReminderEligibilityDiagnostics(
      [
        dueReminder({ id: "invalid", undo_payload: {} }),
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
      ],
      "2026-07-01T14:46:00.000Z",
    );

    expect(diagnostics.dueReminders).toHaveLength(0);
    expect(diagnostics.skippedReasons.invalid_payload).toBe(1);
    expect(diagnostics.skippedReasons.notification_not_due).toBe(1);
    expect(countPushSkippedReasons(diagnostics.skippedReasons)).toBe(2);
  });

  test("classifies provider push failures safely", () => {
    expect(classifyPushFailure({ statusCode: 401 })).toBe(
      "web_push_unauthorized",
    );
    expect(classifyPushFailure({ statusCode: 403 })).toBe(
      "web_push_unauthorized",
    );
    expect(classifyPushFailure({ statusCode: 404 })).toBe(
      "web_push_not_found",
    );
    expect(classifyPushFailure({ statusCode: 410 })).toBe("web_push_gone");
    expect(classifyPushFailure({ statusCode: 400 })).toBe(
      "web_push_bad_subscription",
    );
    expect(classifyPushFailure({ statusCode: 413 })).toBe(
      "web_push_payload_error",
    );
    expect(classifyPushFailure(new Error("network"))).toBe("web_push_unknown");
  });

  test("records failed reasons with limited safe examples", () => {
    const failedReasons = createEmptyPushFailedReasons();
    const examples: PushFailedExample[] = [];

    addFailedReason({
      examples,
      failedReasons,
      notificationId: "notification-12345678",
      reason: "web_push_gone",
      subscriptionId: "subscription-87654321",
    });

    expect(failedReasons.web_push_gone).toBe(1);
    expect(examples).toEqual([
      {
        notification: "12345678",
        reason: "web_push_gone",
        subscription: "87654321",
      },
    ]);
  });
});
