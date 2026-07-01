import { pushSubscriptionSchema } from "@/lib/push/subscription-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Response.json(
      { error: "Configuracao Supabase incompleta no servidor." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "Faca login para desativar notificacoes." },
      { status: 401 },
    );
  }

  const parsed = pushSubscriptionSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      { error: "Subscription de push invalida." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("endpoint", parsed.data.endpoint);

  if (error) {
    return Response.json(
      { error: "Nao foi possivel desativar este dispositivo." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
