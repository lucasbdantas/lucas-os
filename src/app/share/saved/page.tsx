import Link from "next/link";

export default function ShareSavedPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-5 py-8 text-zinc-950">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Lucas OS
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Captura salva</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          O conteudo compartilhado foi salvo como pending capture para triagem.
        </p>

        <div className="mt-8 grid gap-3">
          <Link
            className="rounded-md bg-zinc-950 px-4 py-3 text-center text-base font-medium text-white hover:bg-zinc-800"
            href="/quick-capture"
          >
            Nova captura
          </Link>
          <Link
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-center text-base font-medium text-zinc-800 hover:bg-zinc-100"
            href="/capture"
          >
            Ver inbox
          </Link>
          <Link
            className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-center text-base font-medium text-zinc-800 hover:bg-zinc-100"
            href="/today"
          >
            Voltar para Today
          </Link>
        </div>
      </section>
    </main>
  );
}
