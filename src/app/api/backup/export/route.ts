import packageJson from "../../../../../package.json";
import { getBackupExportFileName } from "@/lib/backup/export-sanitizers";
import { getBackupExportForUser } from "@/lib/backup/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return Response.json(
      { error: "Configuracao Supabase incompleta no servidor." },
      { status: 503 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json(
      { error: "Faca login para exportar seus dados." },
      { status: 401 },
    );
  }

  try {
    const exportedAt = new Date();
    const backup = await getBackupExportForUser({
      appVersion: packageJson.version,
      exportedAt,
      supabase,
      userId: user.id,
    });
    const fileName = getBackupExportFileName(exportedAt);

    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/json; charset=utf-8",
      },
      status: 200,
    });
  } catch {
    return Response.json(
      { error: "Nao foi possivel gerar o export agora." },
      { status: 500 },
    );
  }
}
