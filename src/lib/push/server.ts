import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { getWebPushEnv } from "@/lib/push/env";
import {
  buildPushPayload,
  getDuePushReminders,
  getPendingPushDeliveryTargets,
  type PushDeliveryRecord,
  type PushReminderNotification,
  type PushSubscriptionTarget,
} from "@/lib/push/reminder-dispatch";

type DeliveryInsertResult = {
  id: string;
};

type ProcessDuePushRemindersResult = {
  delivered: number;
  failed: number;
  missingConfiguration: boolean;
  pendingReminders: number;
  skipped: number;
  subscriptions: number;
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

function getSafeErrorMessage(error: unknown) {
  const statusCode = getPushError(error).statusCode;

  if (statusCode) {
    return `web_push_${statusCode}`;
  }

  return "web_push_failed";
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
      missingConfiguration: true,
      pendingReminders: 0,
      skipped: 0,
      subscriptions: 0,
    };
  }

  const [subscriptionsResult, notificationsResult] = await Promise.all([
    input.supabase
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", input.userId)
      .is("revoked_at", null)
      .returns<PushSubscriptionTarget[]>(),
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

  const subscriptions = subscriptionsResult.data;
  const dueReminders = getDuePushReminders(
    notificationsResult.data,
    (input.now ?? new Date()).toISOString(),
  );

  if (subscriptions.length === 0 || dueReminders.length === 0) {
    return {
      delivered: 0,
      failed: 0,
      missingConfiguration: false,
      pendingReminders: dueReminders.length,
      skipped: 0,
      subscriptions: subscriptions.length,
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
      subscriptions.map((subscription) => subscription.id),
    )
    .returns<PushDeliveryRecord[]>();

  if (deliveriesError) {
    throw new Error(deliveriesError.message);
  }

  const targets = getPendingPushDeliveryTargets({
    deliveries,
    notifications: dueReminders,
    subscriptions,
  });
  let delivered = 0;
  let failed = 0;
  let skipped = dueReminders.length * subscriptions.length - targets.length;

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
        skipped += 1;
        continue;
      }

      throw new Error(insertError.message);
    }

    if (!delivery) {
      skipped += 1;
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

      await input.supabase
        .from("push_notification_deliveries")
        .update({
          error: getSafeErrorMessage(error),
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
    missingConfiguration: false,
    pendingReminders: dueReminders.length,
    skipped,
    subscriptions: subscriptions.length,
  };
}
