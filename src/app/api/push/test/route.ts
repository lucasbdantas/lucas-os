import { sendPushTestToSubscription } from "@/lib/push/server";
import { pushSubscriptionSchema } from "@/lib/push/subscription-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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
      { error: "Faça login para testar notificações." },
      { status: 401 },
    );
  }

  const parsed = pushSubscriptionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      { error: "Inscrição de push inválida." },
      { status: 400 },
    );
  }

  try {
    const result = await sendPushTestToSubscription({
      endpoint: parsed.data.endpoint,
      supabase,
      userId: user.id,
    });

    if (result.missingConfiguration) {
      return Response.json(
        { error: "Web Push não está configurado no servidor." },
        { status: 503 },
      );
    }

    if (!result.subscriptionFound) {
      return Response.json(
        { error: "Este dispositivo não tem uma inscrição ativa." },
        { status: 404 },
      );
    }

    if (!result.ok) {
      return Response.json(
        {
          error: "O push de teste não pôde ser entregue.",
          failureReason: result.failureReason,
        },
        { status: 502 },
      );
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Não foi possível testar o push agora." },
      { status: 500 },
    );
  }
}
