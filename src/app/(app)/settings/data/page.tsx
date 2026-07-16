import { Database, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceResetPanel } from "@/components/settings/workspace-reset-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/supabase/require-session";
import {
  preservedWorkspaceData,
  workspaceResetDeletionSteps,
} from "@/lib/workspace-reset/policy";
import { getWorkspaceResetPreviewForUser } from "@/lib/workspace-reset/server";

export default async function WorkspaceDataSettingsPage() {
  const { supabase, user } = await requireSession();
  const preview = await getWorkspaceResetPreviewForUser(supabase, user.id);

  return (
    <main className="app-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Settings"
        title="Dados do workspace"
        description="Revise e limpe dados operacionais de teste sem desconectar integrações ou perder preferências."
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <Link className="muted-link text-sm font-medium" href="/settings">
          Voltar para Settings
        </Link>
        <Link className="muted-link text-sm font-medium" href="/settings/backup">
          Fazer backup antes
        </Link>
      </div>

      <section className="section-shell mt-8">
        <SectionHeader
          action={<StatusBadge label="dry-run visível" tone="blue" />}
          description="As contagens abaixo são lidas com sua sessão Supabase e RLS antes de qualquer ação."
          title="Preview da limpeza"
        />
        {!preview.dailyPlanningTablesAvailable ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            As tabelas dedicadas de planejamento não estão disponíveis pela Data API. O reset ainda removerá o histórico compatível salvo em app_settings.
          </p>
        ) : null}
        <WorkspaceResetPanel counts={preview.counts} />
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="section-shell">
          <SectionHeader
            description="Somente registros operacionais ligados ao usuário autenticado."
            title="Será apagado"
          />
          <div className="app-card-muted p-4">
            <ul className="space-y-2 text-sm leading-6 text-zinc-700">
              {workspaceResetDeletionSteps.map((step) => (
                <li className="flex items-start gap-2" key={step.key}>
                  <Database aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-amber-700" />
                  {step.label}
                </li>
              ))}
              <li className="flex items-start gap-2">
                <Database aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-amber-700" />
                Histórico `daily_planning_v2` em app_settings
              </li>
            </ul>
          </div>
        </section>

        <section className="section-shell">
          <SectionHeader
            description="Esses dados não fazem parte da operação de reset."
            title="Será preservado"
          />
          <div className="app-card-muted p-4">
            <ul className="space-y-2 text-sm leading-6 text-zinc-700">
              {preservedWorkspaceData.map((item) => (
                <li className="flex items-start gap-2" key={item}>
                  <ShieldCheck aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-green-700" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
