import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PushNotificationsPanel } from "@/components/settings/push-notifications-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/supabase/require-session";

export default async function NotificationSettingsPage() {
  const { supabase, user } = await requireSession();
  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("revoked_at", null);

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="app-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Settings"
        title="Notificacoes"
        description="Configure push notifications para lembretes de tasks com permissao explicita por dispositivo."
      />

      <div className="mt-4">
        <Link className="muted-link text-sm font-medium" href="/settings">
          Voltar para Settings
        </Link>
      </div>

      <section className="section-shell mt-8">
        <SectionHeader
          action={<StatusBadge label="opt-in" tone="blue" />}
          description="Push depende do navegador, do dispositivo e das VAPID keys do servidor. iOS, Android e desktop podem se comportar de formas diferentes."
          title="Push Notifications V1"
        />

        <PushNotificationsPanel activeSubscriptionCount={count ?? 0} />
      </section>

      <section className="section-shell mt-10">
        <SectionHeader
          description="O Lucas OS tambem mantem notificacoes internas em /notifications. Push e apenas uma camada extra."
          title="Regras de seguranca"
        />

        <div className="app-card-muted p-4">
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-600">
            <li>Permissao so e solicitada ao clicar em ativar.</li>
            <li>Lembretes lidos ou dispensados nao sao enviados como push.</li>
            <li>Cada lembrete so e enviado uma vez por dispositivo registrado.</li>
            <li>Nenhum segredo ou token de push aparece no client alem da public key VAPID.</li>
            <li>Nao ha push automatico sem scheduler seguro configurado.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
