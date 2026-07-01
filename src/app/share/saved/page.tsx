import Link from "next/link";

export default function ShareSavedPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-zinc-950">
      <section className="paper-panel mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center p-6">
        <p className="section-kicker">Lucas OS</p>
        <h1 className="mt-3 text-4xl font-semibold">Captura salva</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          O conteudo compartilhado foi salvo como pending capture para triagem.
        </p>

        <div className="mt-8 grid gap-3">
          <Link
            className="primary-button px-4 py-3 text-center text-base font-semibold"
            href="/quick-capture"
          >
            Nova captura
          </Link>
          <Link
            className="soft-button px-4 py-3 text-center text-base font-semibold"
            href="/capture"
          >
            Ver inbox
          </Link>
          <Link
            className="ghost-button px-4 py-3 text-center text-base font-semibold"
            href="/today"
          >
            Voltar para Today
          </Link>
        </div>
      </section>
    </main>
  );
}
