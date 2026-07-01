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

export type PushSkippedReason =
  | "already_delivered"
  | "invalid_payload"
  | "missing_subscription"
  | "missing_task"
  | "notification_not_due"
  | "subscription_revoked"
  | "unknown";

export type PushSkippedReasons = Record<PushSkippedReason, number>;

export type PushSkippedExample = {
  notification?: string;
  reason: PushSkippedReason;
  subscription?: string;
};

export type PushFailedReason =
  | "web_push_bad_subscription"
  | "web_push_gone"
  | "web_push_not_found"
  | "web_push_payload_error"
  | "web_push_unauthorized"
  | "web_push_unknown";

export type PushFailedReasons = Record<PushFailedReason, number>;

export type PushFailedExample = {
  notification?: string;
  reason: PushFailedReason;
  subscription?: string;
};

export type PushDeliveryRecord = {
  notification_id: string;
  subscription_id: string;
};

export type PushDeliveryTarget = {
  notification: DuePushReminder;
  subscription: PushSubscriptionTarget;
};

export function createEmptyPushSkippedReasons(): PushSkippedReasons {
  return {
    already_delivered: 0,
    invalid_payload: 0,
    missing_subscription: 0,
    missing_task: 0,
    notification_not_due: 0,
    subscription_revoked: 0,
    unknown: 0,
  };
}

export function createEmptyPushFailedReasons(): PushFailedReasons {
  return {
    web_push_bad_subscription: 0,
    web_push_gone: 0,
    web_push_not_found: 0,
    web_push_payload_error: 0,
    web_push_unauthorized: 0,
    web_push_unknown: 0,
  };
}

function safeIdSuffix(value: string | null | undefined) {
  return value ? value.slice(-8) : undefined;
}

function addSkippedReason(input: {
  examples: PushSkippedExample[];
  notificationId?: string;
  reason: PushSkippedReason;
  skippedReasons: PushSkippedReasons;
  subscriptionId?: string;
}) {
  input.skippedReasons[input.reason] += 1;

  if (input.examples.length < 5) {
    input.examples.push({
      notification: safeIdSuffix(input.notificationId),
      reason: input.reason,
      subscription: safeIdSuffix(input.subscriptionId),
    });
  }
}

export function classifyPushFailure(error: unknown): PushFailedReason {
  const statusCode =
    error && typeof error === "object" && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : null;

  if (statusCode === 401 || statusCode === 403) {
    return "web_push_unauthorized";
  }

  if (statusCode === 404) {
    return "web_push_not_found";
  }

  if (statusCode === 410) {
    return "web_push_gone";
  }

  if (statusCode === 400) {
    return "web_push_bad_subscription";
  }

  if (statusCode === 413) {
    return "web_push_payload_error";
  }

  return "web_push_unknown";
}

export function addFailedReason(input: {
  examples: PushFailedExample[];
  failedReasons: PushFailedReasons;
  notificationId?: string;
  reason: PushFailedReason;
  subscriptionId?: string;
}) {
  input.failedReasons[input.reason] += 1;

  if (input.examples.length < 5) {
    input.examples.push({
      notification: safeIdSuffix(input.notificationId),
      reason: input.reason,
      subscription: safeIdSuffix(input.subscriptionId),
    });
  }
}

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

export function getPushReminderEligibilityDiagnostics(
  notifications: PushReminderNotification[],
  now = new Date().toISOString(),
) {
  const dueReminders: DuePushReminder[] = [];
  const skippedReasons = createEmptyPushSkippedReasons();
  const examples: PushSkippedExample[] = [];

  for (const notification of notifications) {
    if (notification.type !== "task_reminder" || notification.status !== "unread") {
      addSkippedReason({
        examples,
        notificationId: notification.id,
        reason: "unknown",
        skippedReasons,
      });
      continue;
    }

    const payload = parseReminderPayload(notification.undo_payload);

    if (!payload?.reminder_at) {
      addSkippedReason({
        examples,
        notificationId: notification.id,
        reason: "invalid_payload",
        skippedReasons,
      });
      continue;
    }

    if (!isReminderOverdue(payload.reminder_at, now)) {
      addSkippedReason({
        examples,
        notificationId: notification.id,
        reason: "notification_not_due",
        skippedReasons,
      });
      continue;
    }

    dueReminders.push({ ...notification, payload });
  }

  return {
    dueReminders,
    examples,
    skippedReasons,
  };
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

export function getPendingPushDeliveryDiagnostics(input: {
  deliveries: PushDeliveryRecord[];
  notifications: DuePushReminder[];
  subscriptions: PushSubscriptionTarget[];
}) {
  const deliveredKeys = new Set(
    input.deliveries.map(
      (delivery) =>
        `${delivery.notification_id}:${delivery.subscription_id}`,
    ),
  );
  const examples: PushSkippedExample[] = [];
  const skippedReasons = createEmptyPushSkippedReasons();
  const targets: PushDeliveryTarget[] = [];

  for (const notification of input.notifications) {
    for (const subscription of input.subscriptions) {
      const key = `${notification.id}:${subscription.id}`;

      if (deliveredKeys.has(key)) {
        addSkippedReason({
          examples,
          notificationId: notification.id,
          reason: "already_delivered",
          skippedReasons,
          subscriptionId: subscription.id,
        });
      } else {
        targets.push({ notification, subscription });
      }
    }
  }

  return {
    examples,
    skippedReasons,
    targets,
  };
}

export function mergePushSkippedReasons(
  ...reasons: PushSkippedReasons[]
): PushSkippedReasons {
  return reasons.reduce((merged, current) => {
    for (const reason of Object.keys(merged) as PushSkippedReason[]) {
      merged[reason] += current[reason];
    }

    return merged;
  }, createEmptyPushSkippedReasons());
}

export function countPushSkippedReasons(reasons: PushSkippedReasons) {
  return Object.values(reasons).reduce((total, count) => total + count, 0);
}
