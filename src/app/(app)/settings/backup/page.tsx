import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { BackupRestorePanel } from "@/components/settings/backup-restore-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/supabase/require-session";

export default async function BackupSettingsPage() {
  await requireSession();

  return (
    <main className="app-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Seguranca"
        title="Backup e export"
        description="Exporte seus dados do Lucas OS em JSON para backup manual e recuperacao basica."
      />

      <div className="mt-4">
        <Link className="muted-link text-sm font-medium" href="/settings">
          Voltar para Settings
        </Link>
      </div>

      <section className="section-shell mt-8">
        <SectionHeader
          description="O export usa sua sessao autenticada, respeita RLS e nunca inclui secrets, tokens OAuth descriptografados ou hashes de tokens de captura."
          title="Exportar meus dados"
        />

        <div className="app-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-zinc-950">
                  Export JSON
                </h2>
                <StatusBadge label="manual" tone="blue" />
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                O arquivo contem dados pessoais como tarefas, projetos,
                capturas, notificacoes e preferencias. Guarde em um local seguro
                e nao compartilhe publicamente.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                className="primary-button px-4 py-2.5 text-sm font-semibold"
                href="/api/backup/export"
              >
                Exportar dados
              </a>
              <a
                className="soft-button px-4 py-2.5 text-sm font-semibold"
                href="#recovery-plan"
              >
                Ver plano de recuperacao
              </a>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="app-card-muted p-4">
              <h3 className="text-sm font-semibold text-zinc-950">
                Entra no export
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-600">
                <li>domains, projects, milestones e tasks;</li>
                <li>conteúdos e notas da Biblioteca;</li>
                <li>pending captures e notifications;</li>
                <li>app settings/preferences;</li>
                <li>metadados seguros de capture tokens;</li>
                <li>metadados seguros de contas Google conectadas.</li>
              </ul>
            </div>

            <div className="app-card-muted p-4">
              <h3 className="text-sm font-semibold text-zinc-950">
                Fica fora por seguranca
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-zinc-600">
                <li>OPENAI_API_KEY, Supabase keys e qualquer `.env`;</li>
                <li>access tokens e refresh tokens Google;</li>
                <li>tokens externos completos;</li>
                <li>hash de capture tokens;</li>
                <li>service role key.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell mt-10">
        <SectionHeader
          description="Analise um backup antes de qualquer restauração. O preview compara identidades com sua conta atual e bloqueia campos sensíveis."
          title="Importar com segurança"
        />
        <BackupRestorePanel />
      </section>

      <section className="section-shell mt-10" id="recovery-plan">
        <SectionHeader
          description="Restore automatico fica para uma versao futura. Esta versao documenta uma recuperacao manual e auditavel."
          title="Plano de recuperacao manual"
        />

        <div className="app-card p-5">
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-zinc-700">
            <li>Clonar o repositorio do Lucas OS.</li>
            <li>Configurar as variaveis de ambiente sem commitar secrets.</li>
            <li>Aplicar todas as migrations no Supabase alvo.</li>
            <li>Criar e confirmar o usuario em Supabase Auth.</li>
            <li>Rodar seed apenas se o ambiente estiver vazio.</li>
            <li>Recriar ou reconectar integracoes Google manualmente.</li>
            <li>
              Usar o JSON exportado como referencia para restauracao manual de
              dados, respeitando o novo `user_id`.
            </li>
            <li>Validar `/api/health`, login, `/today`, `/tasks` e `/inbox`.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
