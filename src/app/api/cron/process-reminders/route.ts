import webpush from "web-push";
import {
  authorizeCronRequest,
  hashCronSecret,
  processCronScheduledDeliveries,
  type CronScheduledDelivery,
} from "@/lib/push/cron-scheduler";
import { getWebPushEnv } from "@/lib/push/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ClaimRow = {
  auth: string;
  body: string | null;
  delivery_id: string | null;
  endpoint: string;
  notification_id: string;
  p256dh: string;
  source_url: string | null;
  subscription_id: string;
  title: string;
  user_id: string;
};

function schedulerUnavailableResponse() {
  return Response.json(
    {
      error: "Scheduler ainda nao esta configurado no servidor.",
      ok: false,
    },
    { status: 503 },
  );
}

async function processRemindersCron(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = authorizeCronRequest(
    request.headers.get("authorization"),
    cronSecret,
  );

  if (!authorization.ok) {
    if (authorization.reason === "missing_configuration") {
      return schedulerUnavailableResponse();
    }

    return Response.json({ error: "Nao autorizado.", ok: false }, { status: 401 });
  }

  if (!cronSecret) {
    return schedulerUnavailableResponse();
  }

  const pushEnv = getWebPushEnv();

  if (!pushEnv) {
    return Response.json(
      { error: "Web Push nao esta configurado no servidor.", ok: false },
      { status: 503 },
    );
  }

  try {
    webpush.setVapidDetails(pushEnv.subject, pushEnv.publicKey, pushEnv.privateKey);
  } catch {
    return Response.json(
      { error: "Web Push nao esta configurado corretamente no servidor.", ok: false },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Response.json(
      { error: "Configuracao Supabase incompleta no servidor.", ok: false },
      { status: 503 },
    );
  }

  const secretHash = hashCronSecret(cronSecret);
  const { data, error } = await supabase
    .rpc("claim_due_push_cron_deliveries", {
      p_now: new Date().toISOString(),
      p_secret_hash: secretHash,
    })
    .returns<ClaimRow[]>();

  if (error) {
    return schedulerUnavailableResponse();
  }

  const claimRows: ClaimRow[] = Array.isArray(data) ? data : [];

  try {
    const result = await processCronScheduledDeliveries({
      complete: async ({ deliveryId, error: deliveryError, revokeSubscription, status }) => {
        const { error: completeError } = await supabase.rpc(
          "complete_push_cron_delivery",
          {
            p_delivery_id: deliveryId,
            p_error: deliveryError,
            p_revoke_subscription: revokeSubscription,
            p_secret_hash: secretHash,
            p_status: status,
          },
        );

        if (completeError) {
          throw new Error(completeError.message);
        }
      },
      deliveries: claimRows.map((row) => ({
        ...row,
        id: row.notification_id,
      })) satisfies CronScheduledDelivery[],
      send: async ({ endpoint, payload, subscription }) => {
        await webpush.sendNotification(
          {
            endpoint,
            keys: subscription,
          },
          JSON.stringify(payload),
        );
      },
    });

    return Response.json({
      delivered: result.delivered,
      failed: result.failed,
      ok: true,
      processed: result.processed,
      reasons: {
        failed: result.failedReasons,
        skipped: result.skippedReasons,
      },
      skipped: result.skipped,
      subscriptions: result.subscriptions,
    });
  } catch {
    return Response.json(
      { error: "Nao foi possivel processar lembretes automaticamente.", ok: false },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return processRemindersCron(request);
}

export async function POST(request: Request) {
  return processRemindersCron(request);
}
