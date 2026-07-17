import Link from "next/link";

export default function ShareSavedPage() {
  return (
    <main className="min-h-[100svh] bg-background px-4 py-4 text-zinc-950 sm:px-5 sm:py-8">
      <section className="paper-panel mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-md flex-col justify-center p-5 sm:min-h-[calc(100vh-4rem)] sm:p-6">
        <p className="section-kicker">Lucas OS</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Captura salva
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          O conteúdo compartilhado foi salvo como captura pendente para triagem.
        </p>

        <div className="mt-8 grid gap-3">
          <Link
            className="primary-button min-h-12 px-4 py-3 text-center text-base font-semibold"
            href="/quick-capture"
          >
            Nova captura
          </Link>
          <Link
            className="soft-button min-h-12 px-4 py-3 text-center text-base font-semibold"
            href="/capture"
          >
            Ver Capturas
          </Link>
          <Link
            className="ghost-button min-h-12 px-4 py-3 text-center text-base font-semibold"
            href="/today"
          >
            Voltar para Hoje
          </Link>
        </div>
      </section>
    </main>
  );
}
