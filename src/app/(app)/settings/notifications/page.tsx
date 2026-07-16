import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PushNotificationsPanel } from "@/components/settings/push-notifications-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireSession } from "@/lib/supabase/require-session";

export default async function NotificationSettingsPage() {
  const { supabase, user } = await requireSession();
  const [subscriptionResult, deliveryResult] = await Promise.all([
    supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("revoked_at", null),
    supabase
      .from("push_notification_deliveries")
      .select("created_at,sent_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string; sent_at: string | null }>(),
  ]);

  if (subscriptionResult.error) {
    throw new Error(subscriptionResult.error.message);
  }
  if (deliveryResult.error) {
    throw new Error(deliveryResult.error.message);
  }

  return (
    <main className="app-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Settings"
        title="Notificações"
        description="Ative, teste e diagnostique push notifications para lembretes de tasks neste dispositivo."
      />

      <div className="mt-4">
        <Link className="muted-link text-sm font-medium" href="/settings">
          Voltar para Settings
        </Link>
      </div>

      <section className="section-shell mt-8">
        <SectionHeader
          action={<StatusBadge label="opt-in" tone="blue" />}
          description="Push depende do navegador, do dispositivo e das VAPID keys do servidor. O painel abaixo permite testar o fluxo sem abrir o console."
          title="Push Notifications V1"
        />

        <PushNotificationsPanel
          activeSubscriptionCount={subscriptionResult.count ?? 0}
          lastDeliveryAt={deliveryResult.data?.sent_at ?? deliveryResult.data?.created_at ?? null}
          schedulerConfigured={Boolean(process.env.CRON_SECRET?.trim())}
        />
      </section>

      <section className="section-shell mt-10">
        <SectionHeader
          description="O Lucas OS também mantém notificações internas em /notifications. Push é apenas uma camada extra."
          title="Regras de segurança"
        />

        <div className="app-card-muted p-4">
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-600">
            <li>Permissão só é solicitada ao clicar em ativar.</li>
            <li>Lembretes lidos ou dispensados não são enviados como push.</li>
            <li>Cada lembrete só é enviado uma vez por dispositivo registrado.</li>
            <li>Nenhum endpoint, segredo ou chave privada aparece no painel.</li>
            <li>Não há push automático sem scheduler seguro configurado.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
