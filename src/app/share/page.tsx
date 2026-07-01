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
    <main className="min-h-screen bg-zinc-50 px-5 py-8 text-zinc-950">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Lucas OS
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Compartilhar captura</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Revise o texto recebido e salve como pending capture. Nada vira task
          automaticamente.
        </p>

        {errorMessage ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {hasSharedContent ? (
          <form action={createPendingCaptureFromShare} className="mt-6 grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">
                Conteudo
              </span>
              <textarea
                className="mt-2 min-h-56 w-full rounded-md border border-zinc-300 bg-white px-3 py-3 text-base leading-6 outline-none focus:border-zinc-900"
                defaultValue={normalized.rawText}
                maxLength={12000}
                name="rawText"
                required
              />
            </label>
            <button className="rounded-md bg-zinc-950 px-4 py-3 text-base font-medium text-white hover:bg-zinc-800">
              Salvar captura
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-md border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-600">
            Use o menu de compartilhar do Android para enviar texto ou links
            para o Lucas OS. Se preferir, use a captura rapida.
          </div>
        )}

        <div className="mt-4 grid gap-2">
          <Link
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            href="/quick-capture"
          >
            Nova captura
          </Link>
          <Link
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            href="/capture"
          >
            Ver inbox
          </Link>
          <Link
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            href="/today"
          >
            Voltar para Today
          </Link>
        </div>
      </section>
    </main>
  );
}
