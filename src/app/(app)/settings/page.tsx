import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/supabase/require-session";

export default async function SettingsPage() {
  const { user } = await requireSession();

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Settings"
        description="Informações básicas da sessão autenticada."
      />

      <section className="mt-8 max-w-2xl rounded-md border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-zinc-950">Supabase Auth</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Sessão autenticada por cookies.
            </p>
          </div>
          <StatusBadge label="conectado" tone="green" />
        </div>

        <dl className="mt-6 grid gap-4 text-sm">
          <div>
            <dt className="font-medium text-zinc-500">Email</dt>
            <dd className="mt-1 text-zinc-950">{user.email}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
