import { processDuePushRemindersForUser } from "@/lib/push/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
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
      { error: "Faca login para processar lembretes push." },
      { status: 401 },
    );
  }

  try {
    const result = await processDuePushRemindersForUser({
      supabase,
      userId: user.id,
    });

    if (result.missingConfiguration) {
      return Response.json(
        {
          error: "Web Push nao configurado no servidor.",
          result,
        },
        { status: 503 },
      );
    }

    return Response.json({ ok: true, result });
  } catch {
    return Response.json(
      { error: "Nao foi possivel processar lembretes push agora." },
      { status: 500 },
    );
  }
}
