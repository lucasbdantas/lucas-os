import { createHash, timingSafeEqual } from "node:crypto";
import {
  addFailedReason,
  buildPushPayload,
  classifyPushFailure,
  createEmptyPushFailedReasons,
  createEmptyPushSkippedReasons,
  type PushFailedReasons,
  type PushReminderNotification,
  type PushSkippedReasons,
} from "./reminder-dispatch";

export type CronAuthorizationResult =
  | { ok: true }
  | { ok: false; reason: "missing_configuration" | "unauthorized" };

export type CronScheduledDelivery = Pick<
  PushReminderNotification,
  "body" | "id" | "source_url" | "title"
> & {
  auth: string;
  delivery_id: string | null;
  endpoint: string;
  notification_id: string;
  p256dh: string;
  subscription_id: string;
  user_id: string;
};

export type CronProcessingResult = {
  delivered: number;
  failed: number;
  failedReasons: PushFailedReasons;
  processed: number;
  skipped: number;
  skippedReasons: PushSkippedReasons;
  subscriptions: number;
};

export function hashCronSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function authorizeCronRequest(
  authorization: string | null,
  cronSecret: string | undefined,
): CronAuthorizationResult {
  const expectedSecret = cronSecret?.trim();

  if (!expectedSecret) {
    return { ok: false, reason: "missing_configuration" };
  }

  const receivedSecret = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (!receivedSecret) {
    return { ok: false, reason: "unauthorized" };
  }

  const expected = Buffer.from(expectedSecret);
  const received = Buffer.from(receivedSecret);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return { ok: false, reason: "unauthorized" };
  }

  return { ok: true };
}

export async function processCronScheduledDeliveries(input: {
  complete: (input: {
    deliveryId: string;
    error: string | null;
    revokeSubscription: boolean;
    status: "failed" | "sent";
  }) => Promise<void>;
  deliveries: CronScheduledDelivery[];
  send: (input: {
    endpoint: string;
    payload: ReturnType<typeof buildPushPayload>;
    subscription: { auth: string; p256dh: string };
  }) => Promise<void>;
}): Promise<CronProcessingResult> {
  let delivered = 0;
  let failed = 0;
  const failedReasons = createEmptyPushFailedReasons();
  const skippedReasons = createEmptyPushSkippedReasons();
  const subscriptions = new Set<string>();

  for (const delivery of input.deliveries) {
    subscriptions.add(delivery.subscription_id);

    if (!delivery.delivery_id) {
      skippedReasons.already_delivered += 1;
      continue;
    }

    try {
      await input.send({
        endpoint: delivery.endpoint,
        payload: buildPushPayload(delivery),
        subscription: { auth: delivery.auth, p256dh: delivery.p256dh },
      });
      await input.complete({
        deliveryId: delivery.delivery_id,
        error: null,
        revokeSubscription: false,
        status: "sent",
      });
      delivered += 1;
    } catch (error) {
      failed += 1;
      const reason = classifyPushFailure(error);

      addFailedReason({
        examples: [],
        failedReasons,
        notificationId: delivery.notification_id,
        reason,
        subscriptionId: delivery.subscription_id,
      });
      await input.complete({
        deliveryId: delivery.delivery_id,
        error: reason,
        revokeSubscription: reason === "web_push_gone" || reason === "web_push_not_found",
        status: "failed",
      });
    }
  }

  return {
    delivered,
    failed,
    failedReasons,
    processed: input.deliveries.length,
    skipped: Object.values(skippedReasons).reduce((total, count) => total + count, 0),
    skippedReasons,
    subscriptions: subscriptions.size,
  };
}
