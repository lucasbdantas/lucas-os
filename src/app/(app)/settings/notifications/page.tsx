import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences-form";
import { PushNotificationsPanel } from "@/components/settings/push-notifications-panel";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import { revokePushDevice } from "@/lib/push/notification-actions";
import { summarizePushDevice } from "@/lib/push/device-summary";
import { getNotificationPreferencesForUser } from "@/lib/push/notification-preferences-server";
import { requireSession } from "@/lib/supabase/require-session";

type NotificationSettingsPageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function NotificationSettingsPage({
  searchParams,
}: NotificationSettingsPageProps) {
  const { supabase, user } = await requireSession();
  const params = await searchParams;
  const [subscriptionResult, deliveryResult, devicesResult, preferences] = await Promise.all([
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
    supabase
      .from("push_subscriptions")
      .select("id,user_agent,created_at,updated_at,revoked_at")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("updated_at", { ascending: false })
      .limit(20),
    getNotificationPreferencesForUser(supabase, user.id),
  ]);

  if (subscriptionResult.error) {
    throw new Error(subscriptionResult.error.message);
  }
  if (deliveryResult.error) {
    throw new Error(deliveryResult.error.message);
  }
  if (devicesResult.error) {
    throw new Error(devicesResult.error.message);
  }

  const devices = devicesResult.data.map(summarizePushDevice);

  return (
    <main className="app-page mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Configurações"
        title="Notificações"
        description="Ative, teste e acompanhe notificações push para os lembretes deste dispositivo."
      />

      <div className="mt-4">
        <Link className="muted-link text-sm font-medium" href="/settings">
          Voltar para Configurações
        </Link>
      </div>

      {params.saved ? (
        <p className="feedback-panel mt-5" data-tone="success" role="status">
          {params.saved === "device"
            ? "Dispositivo revogado."
            : "Preferências de notificação salvas."}
        </p>
      ) : null}
      {params.error ? (
        <p className="feedback-panel mt-5" data-tone="danger" role="alert">
          Não foi possível concluir a operação. Tente novamente.
        </p>
      ) : null}

      <section className="section-shell mt-8">
        <SectionHeader
          description="Controle o canal push, fins de semana e a janela em que o Lucas OS deve permanecer silencioso."
          title="Preferências e horário silencioso"
        />
        <NotificationPreferencesForm preferences={preferences} />
      </section>

      <section className="section-shell mt-10">
        <SectionHeader
          action={<StatusBadge label="Ativação manual" tone="blue" />}
          description="Push depende do navegador, do dispositivo e das VAPID keys do servidor. O painel abaixo permite testar o fluxo sem abrir o console."
          title="Notificações push neste dispositivo"
        />

        <PushNotificationsPanel
          activeSubscriptionCount={subscriptionResult.count ?? 0}
          lastDeliveryAt={deliveryResult.data?.sent_at ?? deliveryResult.data?.created_at ?? null}
          schedulerConfigured={Boolean(process.env.CRON_SECRET?.trim())}
        />
      </section>

      <section className="section-shell mt-10">
        <SectionHeader
          action={<StatusBadge label={`${devices.length} ativos`} tone="blue" />}
          description="Somente metadados seguros são exibidos. Endpoint e chaves da subscription nunca saem do servidor."
          title="Dispositivos registrados"
        />

        {devices.length === 0 ? (
          <EmptyState
            description="Use o painel acima para registrar este navegador quando quiser receber lembretes por push."
            title="Nenhum dispositivo push ativo"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {devices.map((device) => (
              <article className="app-card p-4" key={device.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-950">{device.label}</h3>
                    <p className="mt-1 text-sm text-zinc-600">{device.platform}</p>
                  </div>
                  <StatusBadge label="ativo" tone="green" />
                </div>
                <dl className="mt-3 space-y-1 text-xs text-zinc-600">
                  <div className="flex justify-between gap-3">
                    <dt>Criado</dt>
                    <dd>{formatDateTime(device.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Última atualização</dt>
                    <dd>{formatDateTime(device.updatedAt)}</dd>
                  </div>
                </dl>
                <form action={revokePushDevice} className="mt-4">
                  <input name="deviceId" type="hidden" value={device.id} />
                  <button
                    className="soft-button min-h-11 px-3 py-2 text-sm font-semibold"
                    type="submit"
                  >
                    Revogar dispositivo
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
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
