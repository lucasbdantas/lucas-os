import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { getWebPushEnv } from "@/lib/push/env";
import {
  addFailedReason,
  buildPushPayload,
  classifyPushFailure,
  countPushSkippedReasons,
  createEmptyPushFailedReasons,
  createEmptyPushSkippedReasons,
  getPendingPushDeliveryDiagnostics,
  getPushReminderEligibilityDiagnostics,
  mergePushSkippedReasons,
  type PushDeliveryRecord,
  type PushFailedExample,
  type PushFailedReasons,
  type PushReminderNotification,
  type PushSkippedExample,
  type PushSkippedReasons,
  type PushSubscriptionTarget,
} from "@/lib/push/reminder-dispatch";

type DeliveryInsertResult = {
  id: string;
};

type ProcessDuePushRemindersResult = {
  delivered: number;
  failed: number;
  failedExamples: PushFailedExample[];
  failedReasons: PushFailedReasons;
  missingConfiguration: boolean;
  pendingReminders: number;
  skipped: number;
  skippedExamples: PushSkippedExample[];
  skippedReasons: PushSkippedReasons;
  subscriptions: number;
};

type PushSubscriptionRow = PushSubscriptionTarget & {
  revoked_at: string | null;
};

function configureWebPush() {
  const env = getWebPushEnv();

  if (!env) {
    return null;
  }

  webpush.setVapidDetails(env.subject, env.publicKey, env.privateKey);
  return env;
}

function getPushError(error: unknown) {
  if (error && typeof error === "object") {
    return error as { message?: string; statusCode?: number };
  }

  return {};
}

function shouldRevokeSubscriptionAfterError(error: unknown) {
  const statusCode = getPushError(error).statusCode;
  return statusCode === 404 || statusCode === 410;
}

export async function processDuePushRemindersForUser(input: {
  now?: Date;
  supabase: SupabaseClient;
  userId: string;
}): Promise<ProcessDuePushRemindersResult> {
  const env = configureWebPush();

  if (!env) {
    return {
      delivered: 0,
      failed: 0,
      failedExamples: [],
      failedReasons: createEmptyPushFailedReasons(),
      missingConfiguration: true,
      pendingReminders: 0,
      skipped: 0,
      skippedExamples: [],
      skippedReasons: createEmptyPushSkippedReasons(),
      subscriptions: 0,
    };
  }

  const [subscriptionsResult, notificationsResult] = await Promise.all([
    input.supabase
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth,revoked_at")
      .eq("user_id", input.userId)
      .returns<PushSubscriptionRow[]>(),
    input.supabase
      .from("notifications")
      .select("id,user_id,type,title,body,status,source_url,undo_payload")
      .eq("user_id", input.userId)
      .eq("type", "task_reminder")
      .eq("status", "unread")
      .limit(200)
      .returns<PushReminderNotification[]>(),
  ]);

  if (subscriptionsResult.error) {
    throw new Error(subscriptionsResult.error.message);
  }

  if (notificationsResult.error) {
    throw new Error(notificationsResult.error.message);
  }

  const activeSubscriptions = subscriptionsResult.data.filter(
    (subscription) => !subscription.revoked_at,
  );
  const revokedSubscriptionCount =
    subscriptionsResult.data.length - activeSubscriptions.length;
  const eligibility = getPushReminderEligibilityDiagnostics(
    notificationsResult.data,
    (input.now ?? new Date()).toISOString(),
  );
  const taskIds = Array.from(
    new Set(eligibility.dueReminders.map((notification) => notification.payload.task_id)),
  );
  let dueReminders = eligibility.dueReminders;
  let skippedReasons = eligibility.skippedReasons;
  const skippedExamples = [...eligibility.examples];

  if (taskIds.length > 0) {
    const { data: existingTasks, error: tasksError } = await input.supabase
      .from("tasks")
      .select("id")
      .eq("user_id", input.userId)
      .in("id", taskIds)
      .returns<Array<{ id: string }>>();

    if (tasksError) {
      throw new Error(tasksError.message);
    }

    const existingTaskIds = new Set(existingTasks.map((task) => task.id));
    const validDueReminders = [];
    const missingTaskReasons = createEmptyPushSkippedReasons();

    for (const reminder of dueReminders) {
      if (existingTaskIds.has(reminder.payload.task_id)) {
        validDueReminders.push(reminder);
      } else {
        missingTaskReasons.missing_task += 1;

        if (skippedExamples.length < 5) {
          skippedExamples.push({
            notification: reminder.id.slice(-8),
            reason: "missing_task",
          });
        }
      }
    }

    dueReminders = validDueReminders;
    skippedReasons = mergePushSkippedReasons(skippedReasons, missingTaskReasons);
  }

  if (activeSubscriptions.length === 0 || dueReminders.length === 0) {
    const subscriptionReasons = createEmptyPushSkippedReasons();

    if (dueReminders.length > 0) {
      if (subscriptionsResult.data.length === 0) {
        subscriptionReasons.missing_subscription = dueReminders.length;
      } else if (revokedSubscriptionCount > 0) {
        subscriptionReasons.subscription_revoked = dueReminders.length;
      }
    }

    skippedReasons = mergePushSkippedReasons(
      skippedReasons,
      subscriptionReasons,
    );

    return {
      delivered: 0,
      failed: 0,
      failedExamples: [],
      failedReasons: createEmptyPushFailedReasons(),
      missingConfiguration: false,
      pendingReminders: dueReminders.length,
      skipped: countPushSkippedReasons(skippedReasons),
      skippedExamples,
      skippedReasons,
      subscriptions: activeSubscriptions.length,
    };
  }

  const { data: deliveries, error: deliveriesError } = await input.supabase
    .from("push_notification_deliveries")
    .select("notification_id,subscription_id")
    .eq("user_id", input.userId)
    .in(
      "notification_id",
      dueReminders.map((notification) => notification.id),
    )
    .in(
      "subscription_id",
      activeSubscriptions.map((subscription) => subscription.id),
    )
    .returns<PushDeliveryRecord[]>();

  if (deliveriesError) {
    throw new Error(deliveriesError.message);
  }

  const deliveryDiagnostics = getPendingPushDeliveryDiagnostics({
    deliveries,
    notifications: dueReminders,
    subscriptions: activeSubscriptions,
  });
  skippedReasons = mergePushSkippedReasons(
    skippedReasons,
    deliveryDiagnostics.skippedReasons,
  );
  skippedExamples.push(...deliveryDiagnostics.examples.slice(0, 5 - skippedExamples.length));
  const targets = deliveryDiagnostics.targets;
  let delivered = 0;
  let failed = 0;
  const failedExamples: PushFailedExample[] = [];
  const failedReasons = createEmptyPushFailedReasons();

  for (const target of targets) {
    const { data: delivery, error: insertError } = await input.supabase
      .from("push_notification_deliveries")
      .insert({
        notification_id: target.notification.id,
        status: "pending",
        subscription_id: target.subscription.id,
        user_id: input.userId,
      })
      .select("id")
      .maybeSingle<DeliveryInsertResult>();

    if (insertError) {
      if (insertError.code === "23505") {
        skippedReasons.already_delivered += 1;

        if (skippedExamples.length < 5) {
          skippedExamples.push({
            notification: target.notification.id.slice(-8),
            reason: "already_delivered",
            subscription: target.subscription.id.slice(-8),
          });
        }
        continue;
      }

      throw new Error(insertError.message);
    }

    if (!delivery) {
      skippedReasons.unknown += 1;

      if (skippedExamples.length < 5) {
        skippedExamples.push({
          notification: target.notification.id.slice(-8),
          reason: "unknown",
          subscription: target.subscription.id.slice(-8),
        });
      }
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: target.subscription.endpoint,
          keys: {
            auth: target.subscription.auth,
            p256dh: target.subscription.p256dh,
          },
        },
        JSON.stringify(buildPushPayload(target.notification)),
      );

      const { error: updateError } = await input.supabase
        .from("push_notification_deliveries")
        .update({ sent_at: new Date().toISOString(), status: "sent" })
        .eq("id", delivery.id)
        .eq("user_id", input.userId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      delivered += 1;
    } catch (error) {
      failed += 1;
      const failedReason = classifyPushFailure(error);

      addFailedReason({
        examples: failedExamples,
        failedReasons,
        notificationId: target.notification.id,
        reason: failedReason,
        subscriptionId: target.subscription.id,
      });

      await input.supabase
        .from("push_notification_deliveries")
        .update({
          error: failedReason,
          status: "failed",
        })
        .eq("id", delivery.id)
        .eq("user_id", input.userId);

      if (shouldRevokeSubscriptionAfterError(error)) {
        await input.supabase
          .from("push_subscriptions")
          .update({ revoked_at: new Date().toISOString() })
          .eq("id", target.subscription.id)
          .eq("user_id", input.userId);
      }
    }
  }

  return {
    delivered,
    failed,
    failedExamples,
    failedReasons,
    missingConfiguration: false,
    pendingReminders: dueReminders.length,
    skipped: countPushSkippedReasons(skippedReasons),
    skippedExamples,
    skippedReasons,
    subscriptions: activeSubscriptions.length,
  };
}
