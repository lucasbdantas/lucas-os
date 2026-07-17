import { QuickCaptureForm } from "@/components/quick-capture/quick-capture-form";
import { requireSession } from "@/lib/supabase/require-session";

export default async function QuickCapturePage() {
  await requireSession();

  return (
    <main className="app-page mx-auto max-w-2xl">
      <header className="paper-panel p-5 sm:p-8">
        <p className="section-kicker">Lucas OS</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
          Captura rápida
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600">
          Jogue aqui qualquer coisa solta. Você organiza depois em Capturas.
        </p>
      </header>

      <section className="mt-6">
        <QuickCaptureForm />
      </section>
    </main>
  );
}
