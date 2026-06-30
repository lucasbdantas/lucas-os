import { PageHeader } from "@/components/layout/page-header";
import { CaptureTokenForm } from "@/components/settings/capture-token-form";
import {
  CaptureTokenList,
  type CaptureTokenListItem,
} from "@/components/settings/capture-token-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/supabase/require-session";

const curlExample =
  'curl -X POST http://localhost:3000/api/capture -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\\"text\\":\\"comprar pilha amanha\\",\\"source\\":\\"ios_shortcut\\"}"';

export default async function SettingsPage() {
  const { supabase, user } = await requireSession();
  const { data: captureTokens, error: captureTokensError } = await supabase
    .from("capture_tokens")
    .select("id,name,token_prefix,created_at,last_used_at,revoked_at")
    .order("created_at", { ascending: false })
    .returns<CaptureTokenListItem[]>();

  if (captureTokensError) {
    throw new Error(captureTokensError.message);
  }

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Settings"
        description="Informacoes basicas da sessao autenticada e captura externa."
      />

      <section className="mt-8 max-w-2xl rounded-md border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-zinc-950">Supabase Auth</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Sessao autenticada por cookies.
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

      <section className="mt-8 max-w-4xl rounded-md border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-zinc-950">Captura externa</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Crie tokens para atalhos mobile ou webhooks simples. O token
              completo aparece apenas uma vez.
            </p>
          </div>
          <StatusBadge label="token seguro" tone="blue" />
        </div>

        <CaptureTokenForm />

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-950">
            Tokens criados
          </h3>
          <CaptureTokenList tokens={captureTokens} />
        </div>

        <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <h3 className="text-sm font-semibold text-zinc-950">
            Teste local com curl
          </h3>
          <code className="mt-2 block overflow-x-auto rounded bg-white px-3 py-2 text-xs text-zinc-800">
            {curlExample}
          </code>
        </div>
      </section>
    </main>
  );
}
