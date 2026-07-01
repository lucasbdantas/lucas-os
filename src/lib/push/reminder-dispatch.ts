import {
  isReminderOverdue,
  parseReminderPayload,
  type ReminderPayload,
} from "../reminders/reminders";

export type PushReminderNotification = {
  body: string | null;
  id: string;
  source_url: string | null;
  status: string;
  title: string;
  type: string;
  undo_payload: unknown;
  user_id: string;
};

export type DuePushReminder = PushReminderNotification & {
  payload: ReminderPayload;
};

export type PushSubscriptionTarget = {
  auth: string;
  endpoint: string;
  id: string;
  p256dh: string;
};

export type PushDeliveryRecord = {
  notification_id: string;
  subscription_id: string;
};

export type PushDeliveryTarget = {
  notification: DuePushReminder;
  subscription: PushSubscriptionTarget;
};

function sanitizeSingleLine(value: string | null | undefined, fallback: string) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned || fallback;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function safeInternalUrl(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/notifications";
  }

  return value;
}

export function getDuePushReminders(
  notifications: PushReminderNotification[],
  now = new Date().toISOString(),
): DuePushReminder[] {
  return notifications.flatMap((notification) => {
    const payload = parseReminderPayload(notification.undo_payload);

    if (
      notification.type !== "task_reminder" ||
      notification.status !== "unread" ||
      !payload?.reminder_at ||
      !isReminderOverdue(payload.reminder_at, now)
    ) {
      return [];
    }

    return [{ ...notification, payload }];
  });
}

export function buildPushPayload(notification: DuePushReminder) {
  const title = truncate(
    sanitizeSingleLine(notification.title, "Lembrete do Lucas OS"),
    90,
  );
  const body = truncate(
    sanitizeSingleLine(notification.body, "Voce tem um lembrete de task."),
    180,
  );

  return {
    body,
    notificationId: notification.id,
    tag: `lucas-os-reminder-${notification.id}`,
    title,
    url: safeInternalUrl(notification.source_url),
  };
}

export function getPendingPushDeliveryTargets(input: {
  deliveries: PushDeliveryRecord[];
  notifications: DuePushReminder[];
  subscriptions: PushSubscriptionTarget[];
}): PushDeliveryTarget[] {
  const deliveredKeys = new Set(
    input.deliveries.map(
      (delivery) =>
        `${delivery.notification_id}:${delivery.subscription_id}`,
    ),
  );
  const targets: PushDeliveryTarget[] = [];

  for (const notification of input.notifications) {
    for (const subscription of input.subscriptions) {
      const key = `${notification.id}:${subscription.id}`;

      if (!deliveredKeys.has(key)) {
        targets.push({ notification, subscription });
      }
    }
  }

  return targets;
}
