import Link from "next/link";
import { redirect } from "next/navigation";
import { createPendingCaptureFromShare } from "@/lib/share-target/actions";
import { normalizeShareTargetInput } from "@/lib/share-target/share-target";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SharePageProps = {
  searchParams: Promise<{
    error?: string;
    text?: string;
    title?: string;
    url?: string;
  }>;
};

function getErrorMessage(error: string | undefined) {
  if (error === "empty") {
    return "Nao encontrei texto ou link para salvar.";
  }

  if (error === "too_long") {
    return "O conteudo compartilhado ficou longo demais.";
  }

  if (error) {
    return "Nao foi possivel salvar a captura compartilhada.";
  }

  return null;
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  const normalized = normalizeShareTargetInput({
    text: params.text,
    title: params.title,
    url: params.url,
  });
  const errorMessage = getErrorMessage(params.error);
  const hasSharedContent = normalized.ok;
  const supabase = await createSupabaseServerClient();
  const returnParams = new URLSearchParams();

  if (params.title) returnParams.set("title", params.title);
  if (params.text) returnParams.set("text", params.text);
  if (params.url) returnParams.set("url", params.url);

  const returnTo = returnParams.size
    ? `/share?${returnParams.toString()}`
    : "/share";

  if (hasSharedContent) {
    if (!supabase) {
      redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-zinc-950">
      <section className="paper-panel mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center p-6">
        <p className="section-kicker">Lucas OS</p>
        <h1 className="mt-3 text-4xl font-semibold">Compartilhar captura</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Revise o texto recebido e salve como pending capture. Nada vira task
          automaticamente.
        </p>

        {errorMessage ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {hasSharedContent ? (
          <form action={createPendingCaptureFromShare} className="mt-6 grid gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-zinc-800">
                Conteudo
              </span>
              <textarea
                className="field-control mt-2 min-h-56 w-full px-3 py-3 text-base leading-6 outline-none"
                defaultValue={normalized.rawText}
                maxLength={12000}
                name="rawText"
                required
              />
            </label>
            <button className="primary-button px-4 py-3 text-base font-semibold">
              Salvar captura
            </button>
          </form>
        ) : (
          <div className="app-card-muted mt-6 p-4 text-sm leading-6 text-zinc-600">
            Use o menu de compartilhar do Android para enviar texto ou links
            para o Lucas OS. Se preferir, use a captura rapida.
          </div>
        )}

        <div className="mt-4 grid gap-2">
          <Link
            className="soft-button px-4 py-3 text-center text-sm font-semibold"
            href="/quick-capture"
          >
            Nova captura
          </Link>
          <Link
            className="soft-button px-4 py-3 text-center text-sm font-semibold"
            href="/capture"
          >
            Ver inbox
          </Link>
          <Link
            className="ghost-button px-4 py-3 text-center text-sm font-semibold"
            href="/today"
          >
            Voltar para Today
          </Link>
        </div>
      </section>
    </main>
  );
}
