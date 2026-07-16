"use client";

import {
  BellOff,
  BellRing,
  FlaskConical,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getPushDiagnosticItems,
  getPushTestFailureMessage,
  type PushTestFailureReason,
} from "@/lib/push/diagnostics";
import type {
  PushFailedReasons,
  PushSafeErrorDebug,
  PushSkippedReasons,
} from "@/lib/push/reminder-dispatch";

type PushNotificationsPanelProps = {
  activeSubscriptionCount: number;
  lastDeliveryAt: string | null;
  schedulerConfigured: boolean;
};

function formatLastDelivery(value: string | null) {
  if (!value) return "Nenhum envio registrado";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Data indisponivel";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

type PublicKeyResponse = {
  enabled: boolean;
  error?: string;
  publicKey?: string;
};

type PushProcessResult = {
  delivered: number;
  failed: number;
  failedReasons: PushFailedReasons;
  pendingReminders: number;
  skipped: number;
  skippedReasons: PushSkippedReasons;
  subscriptions: number;
};

type ServiceWorkerStatus =
  | "active"
  | "error"
  | "loading"
  | "unsupported";

function getBrowserSupportMessage() {
  if (typeof window === "undefined") {
    return "Carregando suporte do navegador.";
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "Reconhecimento de push não está disponível neste navegador. Use as notificações internas por enquanto.";
  }

  return null;
}

function getPermissionLabel(permission: NotificationPermission | "unsupported") {
  if (permission === "granted") return "Permitida";
  if (permission === "denied") return "Bloqueada";
  if (permission === "unsupported") return "Indisponível";
  return "Ainda não solicitada";
}

function getServiceWorkerLabel(status: ServiceWorkerStatus) {
  if (status === "active") return "Ativo";
  if (status === "error") return "Com erro";
  if (status === "unsupported") return "Indisponível";
  return "Verificando";
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

async function getCurrentSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

async function readJsonResponse<T>(response: Response) {
  return (await response.json()) as T;
}

export function PushNotificationsPanel({
  activeSubscriptionCount,
  lastDeliveryAt,
  schedulerConfigured,
}: PushNotificationsPanelProps) {
  const router = useRouter();
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [serviceWorkerStatus, setServiceWorkerStatus] =
    useState<ServiceWorkerStatus>("loading");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isConfirmingReminder, setIsConfirmingReminder] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTestDebug, setLastTestDebug] =
    useState<PushSafeErrorDebug | null>(null);
  const [lastProcessResult, setLastProcessResult] =
    useState<PushProcessResult | null>(null);
  const [testTask, setTestTask] = useState<{
    dueDate: string;
    dueTime: string;
    taskId: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initializePushState() {
      const supportMessage = getBrowserSupportMessage();

      if (supportMessage) {
        if (!cancelled) {
          setPermission("unsupported");
          setServiceWorkerStatus("unsupported");
          setIsSupported(false);
          setError(supportMessage);
        }
        return;
      }

      try {
        await navigator.serviceWorker.register("/sw.js");
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!cancelled) {
          setIsSupported(true);
          setServiceWorkerStatus(registration.active ? "active" : "loading");
          setPermission(Notification.permission);
          setIsSubscribed(Boolean(subscription));
        }
      } catch {
        if (!cancelled) {
          setServiceWorkerStatus("error");
          setError("Não foi possível preparar notificações neste navegador.");
        }
      }
    }

    void initializePushState();

    return () => {
      cancelled = true;
    };
  }, []);

  function startOperation() {
    setIsBusy(true);
    setError(null);
    setLastTestDebug(null);
    setMessage(null);
  }

  function finishOperation() {
    setIsBusy(false);
  }

  async function getPublicKey() {
    const response = await fetch("/api/push/public-key", {
      cache: "no-store",
    });
    const payload = await readJsonResponse<PublicKeyResponse>(response);

    if (!response.ok || !payload.enabled || !payload.publicKey) {
      throw new Error(payload.error ?? "Web Push não está configurado.");
    }

    return payload.publicKey;
  }

  async function saveSubscription(subscription: PushSubscription) {
    const response = await fetch("/api/push/subscribe", {
      body: JSON.stringify(subscription.toJSON()),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const payload = await readJsonResponse<{ error?: string }>(response);
      throw new Error(payload.error ?? "Não foi possível salvar este dispositivo.");
    }
  }

  async function revokeSubscription(subscription: PushSubscription) {
    const response = await fetch("/api/push/revoke", {
      body: JSON.stringify(subscription.toJSON()),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const payload = await readJsonResponse<{ error?: string }>(response);
      throw new Error(payload.error ?? "Não foi possível revogar este dispositivo.");
    }
  }

  async function subscribeCurrentDevice(requestPermission: boolean) {
    if (!isSupported) {
      throw new Error("Push não está disponível neste navegador.");
    }

    const publicKey = await getPublicKey();
    const permissionResult = requestPermission
      ? await Notification.requestPermission()
      : Notification.permission;
    setPermission(permissionResult);

    if (permissionResult !== "granted") {
      throw new Error("Permissão de notificação não concedida.");
    }

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        applicationServerKey: urlBase64ToUint8Array(publicKey),
        userVisibleOnly: true,
      }));

    await saveSubscription(subscription);
    setIsSubscribed(true);
    setServiceWorkerStatus("active");
    router.refresh();
  }

  async function activate() {
    startOperation();

    try {
      await subscribeCurrentDevice(true);
      setMessage("Notificações ativadas neste dispositivo.");
    } catch (activateError) {
      setError(
        activateError instanceof Error
          ? activateError.message
          : "Erro ao ativar notificações.",
      );
    } finally {
      finishOperation();
    }
  }

  async function deactivate() {
    startOperation();

    try {
      const subscription = await getCurrentSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        setMessage("Este dispositivo já estava sem inscrição ativa.");
        return;
      }

      await revokeSubscription(subscription);
      await subscription.unsubscribe();
      setIsSubscribed(false);
      setMessage("Notificações desativadas neste dispositivo.");
      router.refresh();
    } catch (deactivateError) {
      setError(
        deactivateError instanceof Error
          ? deactivateError.message
          : "Não foi possível desativar notificações neste dispositivo.",
      );
    } finally {
      finishOperation();
    }
  }

  async function resetSubscription() {
    startOperation();

    try {
      const current = await getCurrentSubscription();

      if (current) {
        await revokeSubscription(current);
        await current.unsubscribe();
        setIsSubscribed(false);
      }

      await subscribeCurrentDevice(Notification.permission !== "granted");
      setMessage(
        "Inscrição resetada. Este dispositivo agora usa a configuração VAPID atual.",
      );
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Não foi possível resetar a inscrição deste dispositivo.",
      );
    } finally {
      finishOperation();
    }
  }

  async function processDueReminders() {
    startOperation();

    try {
      const response = await fetch("/api/push/process", {
        method: "POST",
      });
      const payload = await readJsonResponse<{
        error?: string;
        result?: PushProcessResult;
      }>(response);

      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? "Não foi possível processar lembretes.");
      }

      setLastProcessResult(payload.result);
      setMessage("Processamento concluído. Veja o diagnóstico abaixo.");
      router.refresh();
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : "Erro ao processar lembretes.",
      );
    } finally {
      finishOperation();
    }
  }

  async function createTestReminder() {
    startOperation();

    try {
      const response = await fetch("/api/push/test-reminder", {
        method: "POST",
      });
      const payload = await readJsonResponse<{
        dueDate?: string;
        dueTime?: string;
        error?: string;
        taskId?: string;
      }>(response);

      if (
        !response.ok ||
        !payload.taskId ||
        !payload.dueDate ||
        !payload.dueTime
      ) {
        throw new Error(payload.error ?? "Não foi possível criar o teste.");
      }

      setTestTask({
        dueDate: payload.dueDate,
        dueTime: payload.dueTime,
        taskId: payload.taskId,
      });
      setIsConfirmingReminder(false);
      setMessage(
        `Lembrete de teste criado para ${payload.dueTime}. Processe após esse horário.`,
      );
      router.refresh();
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : "Erro ao criar lembrete de teste.",
      );
    } finally {
      finishOperation();
    }
  }

  async function sendTestPush() {
    startOperation();

    try {
      const subscription = await getCurrentSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        throw new Error(
          "Este dispositivo não tem inscrição ativa. Ative ou resete as notificações.",
        );
      }

      const response = await fetch("/api/push/test", {
        body: JSON.stringify(subscription.toJSON()),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = await readJsonResponse<{
        debug?: PushSafeErrorDebug;
        error?: string;
        failureReason?: PushTestFailureReason;
        reason?: PushTestFailureReason;
      }>(response);

      if (!response.ok) {
        const reason = payload.reason ?? payload.failureReason;
        setLastTestDebug(payload.debug ?? null);

        if (reason) {
          throw new Error(getPushTestFailureMessage(reason));
        }

        throw new Error(payload.error ?? "O push de teste falhou.");
      }

      setMessage("Push de teste enviado para este dispositivo.");
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : "Não foi possível enviar o push de teste.",
      );
    } finally {
      finishOperation();
    }
  }

  const diagnostics = lastProcessResult
    ? getPushDiagnosticItems(
        lastProcessResult.skippedReasons,
        lastProcessResult.failedReasons,
      )
    : [];

  return (
    <div className="app-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BellRing aria-hidden="true" className="h-5 w-5 text-green-700" />
            <h2 className="text-lg font-semibold text-zinc-950">
              Push neste dispositivo
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Ative quando quiser. O Lucas OS só pede permissão após seu toque e
            nunca expõe a inscrição do navegador nesta tela.
          </p>
        </div>
        <span className="status-badge" data-tone={isSubscribed ? "green" : "amber"}>
          {isSubscribed ? "Dispositivo ativo" : "Dispositivo inativo"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatusItem
          label="Permissão"
          value={getPermissionLabel(permission)}
        />
        <StatusItem
          label="Service worker"
          value={getServiceWorkerLabel(serviceWorkerStatus)}
        />
        <StatusItem
          label="Este dispositivo"
          value={isSubscribed ? "Inscrito" : "Sem inscrição"}
        />
        <StatusItem
          label="Seus dispositivos ativos"
          value={String(activeSubscriptionCount)}
        />
        <StatusItem
          label="Scheduler"
          value={schedulerConfigured ? "Configurado" : "Ainda nao configurado"}
        />
        <StatusItem
          label="Ultimo processamento conhecido"
          value={formatLastDelivery(lastDeliveryAt)}
        />
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <ActionButton
          disabled={!isSupported || isBusy || permission === "denied"}
          icon={BellRing}
          label="Ativar notificações neste dispositivo"
          onClick={activate}
          tone="primary"
        />
        <ActionButton
          disabled={!isSupported || isBusy || !isSubscribed}
          icon={BellOff}
          label="Desativar neste dispositivo"
          onClick={deactivate}
        />
        <ActionButton
          disabled={!isSupported || isBusy || permission === "denied"}
          icon={RotateCcw}
          label="Resetar inscrição deste dispositivo"
          onClick={resetSubscription}
        />
        <ActionButton
          disabled={isBusy}
          icon={FlaskConical}
          label="Criar lembrete de teste"
          onClick={() => setIsConfirmingReminder(true)}
        />
        <ActionButton
          disabled={isBusy}
          icon={Play}
          label="Processar lembretes agora"
          onClick={processDueReminders}
        />
        <ActionButton
          disabled={!isSupported || !isSubscribed || isBusy}
          icon={Send}
          label="Enviar push de teste para este dispositivo"
          onClick={sendTestPush}
        />
      </div>

      {isConfirmingReminder ? (
        <div className="mt-4 app-card-muted p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <div>
              <p className="font-semibold text-zinc-950">
                Criar uma task real de teste?
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Será criada na Inbox, com horário para dois minutos no futuro e
                lembrete na hora. Depois, aguarde o horário e toque em
                “Processar lembretes agora”.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  className="primary-button min-h-11 px-4 py-2.5 text-sm font-semibold"
                  disabled={isBusy}
                  onClick={createTestReminder}
                  type="button"
                >
                  Confirmar lembrete de teste
                </button>
                <button
                  className="ghost-button min-h-11 px-4 py-2.5 text-sm font-semibold"
                  disabled={isBusy}
                  onClick={() => setIsConfirmingReminder(false)}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {permission === "denied" ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          O navegador bloqueou notificações. Reative nas configurações do site
          e volte para resetar a inscrição deste dispositivo.
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {lastTestDebug && Object.keys(lastTestDebug).length > 0 ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">
          <p className="font-semibold">Diagnostico seguro do teste</p>
          <dl className="mt-2 grid gap-1">
            {Object.entries(lastTestDebug).map(([key, value]) => (
              <div className="grid gap-1 sm:grid-cols-[140px_1fr]" key={key}>
                <dt className="font-semibold">{key}</dt>
                <dd className="break-words text-red-700">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {testTask ? (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Task de teste preparada para {testTask.dueDate} às {testTask.dueTime}.
          </span>
          <Link
            className="font-semibold underline underline-offset-4"
            href={`/tasks?edit=${testTask.taskId}#edit-task`}
          >
            Abrir task
          </Link>
        </div>
      ) : null}

      {lastProcessResult ? (
        <section className="mt-5 app-card-muted p-4" aria-live="polite">
          <div className="flex items-center gap-2">
            <RefreshCw aria-hidden="true" className="h-4 w-4 text-green-700" />
            <h3 className="font-semibold text-zinc-950">
              Último processamento
            </h3>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Enviados" value={lastProcessResult.delivered} />
            <Metric label="Falharam" value={lastProcessResult.failed} />
            <Metric label="Ignorados" value={lastProcessResult.skipped} />
            <Metric
              label="Lembretes vencidos"
              value={lastProcessResult.pendingReminders}
            />
            <Metric
              label="Dispositivos usados"
              value={lastProcessResult.subscriptions}
            />
            <Metric
              label="Resultado"
              value={lastProcessResult.delivered > 0 ? "Entregue" : "Sem envio"}
            />
          </div>

          {diagnostics.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {diagnostics.map((item) => (
                <div
                  className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-600"
                  key={item.reason}
                >
                  <strong className="text-zinc-950">{item.count}×</strong>{" "}
                  {item.message}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-600">
              Nenhum motivo de falha ou item ignorado foi registrado.
            </p>
          )}
        </section>
      ) : null}

      <div className="mt-5 app-card-muted flex items-start gap-3 p-4 text-sm leading-6 text-zinc-600">
        <Smartphone aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
        <p>
          O botao manual continua disponivel para diagnostico. Com CRON_SECRET,
          hash configurado no Supabase Vault e cron da Vercel ativo, os
          lembretes vencidos tambem sao processados automaticamente a cada 30
          minutos.
        </p>
      </div>
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="app-card-muted min-w-0 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
      <p className="text-lg font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{label}</p>
    </div>
  );
}

function ActionButton({
  disabled,
  icon: Icon,
  label,
  onClick,
  tone = "soft",
}: {
  disabled: boolean;
  icon: typeof BellRing;
  label: string;
  onClick: () => void;
  tone?: "primary" | "soft";
}) {
  return (
    <button
      className={`${tone === "primary" ? "primary-button" : "soft-button"} min-h-12 justify-start gap-2 px-4 py-3 text-left text-sm font-semibold disabled:opacity-50`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
