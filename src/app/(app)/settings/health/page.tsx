import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { getRecentDailyPlans } from "@/lib/ai/daily-plan-repository";
import {
  buildSetupChecklist,
  buildSystemHealthChecks,
} from "@/lib/health/system-health";
import {
  googleCalendarReadonlyScope,
  googleGmailReadonlyScope,
} from "@/lib/integrations/google/connected-account";
import { getWebPushEnv } from "@/lib/push/env";
import { requireSession } from "@/lib/supabase/require-session";

export default async function SystemHealthPage() {
  const { supabase, user } = await requireSession();
  const [accounts, subscriptions, domains, dailyTable, recentPlans] =
    await Promise.all([
      supabase
        .from("connected_accounts")
        .select("scopes")
        .eq("user_id", user.id)
        .eq("status", "active"),
      supabase
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("revoked_at", null),
      supabase
        .from("domains")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("daily_plans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      getRecentDailyPlans(supabase, user.id, 1).catch(() => []),
    ]);
  const activeAccounts = accounts.data ?? [];
  const calendarReady = activeAccounts.some(
    (account) =>
      Array.isArray(account.scopes) &&
      account.scopes.includes(googleCalendarReadonlyScope),
  );
  const gmailReady = activeAccounts.some(
    (account) =>
      Array.isArray(account.scopes) &&
      account.scopes.includes(googleGmailReadonlyScope),
  );
  const checks = buildSystemHealthChecks({
    activeGoogleAccounts: activeAccounts,
    authReady: Boolean(user.id),
    backupReady: true,
    dailyPlanningTablesReady: !dailyTable.error,
    openAIConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    pushConfigured: Boolean(getWebPushEnv()),
    schedulerConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    supabaseReady: !domains.error,
  });
  const setup = buildSetupChecklist({
    backupReady: true,
    calendarReady,
    dailyPlanCreated: recentPlans.length > 0,
    gmailReady,
    googleConnected: activeAccounts.length > 0,
    openAIConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    pushReady: (subscriptions.count ?? 0) > 0,
    schedulerReady: Boolean(process.env.CRON_SECRET?.trim()),
  });

  return (
    <main className="app-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Settings"
        title="Saúde do sistema"
        description="Checks seguros de configuração e um roteiro curto para terminar o setup. Nenhum secret ou token é exibido."
      />

      <div className="mt-4">
        <Link className="muted-link text-sm font-medium" href="/settings">
          Voltar para Settings
        </Link>
      </div>

      <section className="section-shell mt-8">
        <SectionHeader
          description="Estado observado nesta sessão. Checks externos são leves e não fazem ações destrutivas."
          title="Status interno"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {checks.map((check) => (
            <article className="app-card p-4" key={check.label}>
              <div className="flex items-start gap-3">
                <HealthIcon tone={check.tone} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-zinc-950">{check.label}</h2>
                    <span className="status-badge" data-tone={check.tone === "good" ? "green" : "amber"}>
                      {check.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{check.detail}</p>
                  {check.actionHref ? (
                    <Link className="muted-link mt-3 inline-flex text-sm font-semibold" href={check.actionHref}>
                      Abrir configuração
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell mt-10" id="setup">
        <SectionHeader
          description="Itens opcionais podem permanecer pendentes sem impedir o uso operacional básico."
          title="Checklist de setup"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {setup.map((item) => (
            <Link className="app-card-interactive flex min-h-20 items-start gap-3 p-4" href={item.href} key={item.label}>
              {item.complete ? (
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
              ) : (
                <CircleDashed aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              )}
              <span>
                <span className="block font-semibold text-zinc-950">{item.label}</span>
                <span className="mt-1 block text-sm leading-5 text-zinc-600">{item.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function HealthIcon({ tone }: { tone: "good" | "needs_attention" | "optional" }) {
  if (tone === "good") {
    return <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-green-700" />;
  }
  if (tone === "needs_attention") {
    return <CircleAlert aria-hidden="true" className="h-5 w-5 shrink-0 text-amber-700" />;
  }
  return <CircleDashed aria-hidden="true" className="h-5 w-5 shrink-0 text-zinc-500" />;
}
