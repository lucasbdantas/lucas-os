import type { PushTestFailureReason } from "@/lib/push/diagnostics";
import {
  classifyPushFailure,
  getPushFailureDebug,
  type PushSafeErrorDebug,
} from "@/lib/push/reminder-dispatch";
import { sendPushTestToSubscription } from "@/lib/push/server";
import { pushSubscriptionSchema } from "@/lib/push/subscription-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function pushTestError(
  reason: PushTestFailureReason,
  status: number,
  error = "Nao foi possivel enviar push de teste.",
  debug?: PushSafeErrorDebug,
) {
  return Response.json(
    {
      debug,
      error,
      ok: false,
      reason,
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return pushTestError("missing_configuration", 503);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json(
        {
          error: "Faca login para testar notificacoes.",
          ok: false,
        },
        { status: 401 },
      );
    }

    let requestBody: unknown;

    try {
      requestBody = await request.json();
    } catch {
      return pushTestError(
        "web_push_bad_subscription",
        400,
        "Inscricao de push invalida.",
      );
    }

    const parsed = pushSubscriptionSchema.safeParse(requestBody);

    if (!parsed.success) {
      return pushTestError(
        "web_push_bad_subscription",
        400,
        "Inscricao de push invalida.",
      );
    }

    const result = await sendPushTestToSubscription({
      endpoint: parsed.data.endpoint,
      supabase,
      userId: user.id,
    });

    if (result.missingConfiguration) {
      return pushTestError("missing_configuration", 503);
    }

    if (!result.subscriptionFound) {
      return pushTestError("missing_subscription", 404);
    }

    if (result.subscriptionRevoked) {
      return pushTestError("subscription_revoked", 409);
    }

    if (!result.ok) {
      return pushTestError(
        result.failureReason ?? "web_push_unknown",
        502,
        "Nao foi possivel enviar push de teste.",
        result.failureDebug ?? undefined,
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    return pushTestError(
      classifyPushFailure(error),
      500,
      "Nao foi possivel enviar push de teste.",
      getPushFailureDebug(error),
    );
  }
}
