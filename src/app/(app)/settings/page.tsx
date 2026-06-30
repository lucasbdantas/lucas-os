import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { AppPreferencesForm } from "@/components/settings/app-preferences-form";
import { CaptureTokenForm } from "@/components/settings/capture-token-form";
import {
  CaptureTokenList,
  type CaptureTokenListItem,
} from "@/components/settings/capture-token-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAppPreferencesForUser } from "@/lib/app-settings/server";
import { requireSession } from "@/lib/supabase/require-session";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    settings?: string;
  }>;
};

const curlExample =
  'curl -X POST http://localhost:3000/api/capture -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\\"text\\":\\"comprar pilha amanhã\\",\\"source\\":\\"ios_shortcut\\"}"';

const requestBodyExample =
  '{ "text": "comprar pilha amanhã", "source": "android_shortcut" }';

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const { error: pageError, settings } = await searchParams;
  const { supabase, user } = await requireSession();
  const [captureTokensResult, preferences] = await Promise.all([
    supabase
      .from("capture_tokens")
      .select("id,name,token_prefix,created_at,last_used_at,revoked_at")
      .order("created_at", { ascending: false })
      .returns<CaptureTokenListItem[]>(),
    getAppPreferencesForUser(supabase, user.id),
  ]);

  if (captureTokensResult.error) {
    throw new Error(captureTokensResult.error.message);
  }

  return (
    <main className="px-6 py-8">
      <PageHeader
        eyebrow="Operacional"
        title="Settings"
        description="Informações básicas da sessão autenticada, preferências do app e captura externa."
      />

      {pageError ? (
        <p className="mt-6 max-w-4xl rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {pageError}
        </p>
      ) : null}

      {settings === "saved" ? (
        <p className="mt-6 max-w-4xl rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Preferências salvas.
        </p>
      ) : null}

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

      <section className="mt-8 max-w-4xl rounded-md border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-zinc-950">
              Preferências do app
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Ajustes básicos usados por Today, Weekly Review e navegação
              inicial.
            </p>
          </div>
          <StatusBadge label="app_settings" tone="blue" />
        </div>

        <AppPreferencesForm preferences={preferences} />
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
          <CaptureTokenList tokens={captureTokensResult.data} />
        </div>

        <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <h3 className="text-sm font-semibold text-zinc-950">
            Teste local com curl
          </h3>
          <code className="mt-2 block overflow-x-auto rounded bg-white px-3 py-2 text-xs text-zinc-800">
            {curlExample}
          </code>
        </div>

        <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="text-sm font-semibold text-zinc-950">
            Como usar no celular
          </h3>
          <div className="mt-3 grid gap-4 text-sm leading-6 text-zinc-700">
            <div>
              <p className="font-medium text-zinc-900">
                Modo autenticado no navegador
              </p>
              <p className="mt-2 text-zinc-700">
                Se você estiver logado no celular, use a tela rápida sem token.
              </p>
              <Link
                className="mt-2 inline-flex rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                href="/quick-capture"
              >
                Abrir Captura rápida
              </Link>
            </div>

            <div>
              <p className="font-medium text-zinc-900">
                Instalar como app simples
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Android/Chrome: abra <code>/quick-capture</code>, toque no
                  menu do navegador e escolha “Adicionar à tela inicial”.
                </li>
                <li>
                  iPhone/Safari: abra <code>/quick-capture</code>, toque em
                  compartilhar e escolha “Adicionar à Tela de Início”.
                </li>
                <li>
                  Em desenvolvimento local, use{" "}
                  <code>http://&lt;IP_DO_PC&gt;:3000/quick-capture</code>.
                </li>
                <li>Em produção futura, use o domínio real do Lucas OS.</li>
                <li>
                  Esta versão não promete modo offline e não usa notificações
                  push.
                </li>
              </ul>
            </div>

            <div>
              <p className="font-medium text-zinc-900">Segurança do token</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>O token completo aparece apenas uma vez ao criar.</li>
                <li>Se perder o token, revogue e crie outro.</li>
                <li>O prefixo mostrado na lista não autentica.</li>
                <li>O nome do token não autentica.</li>
              </ul>
            </div>

            <div>
              <p className="font-medium text-zinc-900">URLs possíveis</p>
              <div className="mt-2 grid gap-2">
                <code className="block overflow-x-auto rounded bg-white px-3 py-2 text-xs text-zinc-800">
                  http://localhost:3000/api/capture
                </code>
                <code className="block overflow-x-auto rounded bg-white px-3 py-2 text-xs text-zinc-800">
                  http://&lt;IP_DO_COMPUTADOR&gt;:3000/quick-capture
                </code>
                <code className="block overflow-x-auto rounded bg-white px-3 py-2 text-xs text-zinc-800">
                  http://&lt;IP_DO_COMPUTADOR&gt;:3000/api/capture
                </code>
                <code className="block overflow-x-auto rounded bg-white px-3 py-2 text-xs text-zinc-800">
                  https://seu-dominio.com/api/capture
                </code>
              </div>
            </div>

            <div>
              <p className="font-medium text-zinc-900">
                Desenvolvimento na rede local
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>
                  Rode o Next ouvindo na rede:
                  <code className="ml-1 rounded bg-white px-1 py-0.5 text-xs text-zinc-800">
                    npm run dev -- --hostname 0.0.0.0
                  </code>
                </li>
                <li>Descubra o IP local do PC.</li>
                <li>Garanta que celular e PC estejam na mesma rede Wi-Fi.</li>
                <li>Se não conectar, confira o firewall do Windows.</li>
              </ol>
            </div>

            <div>
              <p className="font-medium text-zinc-900">
                Requisição do atalho
              </p>
              <dl className="mt-2 grid gap-2">
                <div>
                  <dt className="font-medium text-zinc-500">Método</dt>
                  <dd>POST</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Headers</dt>
                  <dd>
                    <code>Authorization: Bearer &lt;TOKEN_COMPLETO&gt;</code>
                    <br />
                    <code>Content-Type: application/json</code>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Body</dt>
                  <dd>
                    <code className="mt-1 block overflow-x-auto rounded bg-white px-3 py-2 text-xs text-zinc-800">
                      {requestBodyExample}
                    </code>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
