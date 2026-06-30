import { QuickCaptureForm } from "@/components/quick-capture/quick-capture-form";
import { requireSession } from "@/lib/supabase/require-session";

export default async function QuickCapturePage() {
  await requireSession();

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <header>
        <p className="text-sm font-medium text-zinc-500">Lucas OS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
          Captura rápida
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Jogue aqui qualquer coisa solta. Você organiza depois em Captura.
        </p>
      </header>

      <section className="mt-6">
        <QuickCaptureForm />
      </section>
    </main>
  );
}
