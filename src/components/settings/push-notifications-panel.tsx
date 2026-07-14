"use client";

import { useEffect, useState } from "react";

type PushNotificationsPanelProps = {
  activeSubscriptionCount: number;
};

type PublicKeyResponse = {
  enabled: boolean;
  error?: string;
  publicKey?: string;
};

function getBrowserSupportMessage() {
  if (typeof window === "undefined") {
    return "Carregando suporte do navegador.";
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "Push nao esta disponivel neste navegador. Use notificacoes internas por enquanto.";
  }

  return null;
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

export function PushNotificationsPanel({
  activeSubscriptionCount,
}: PushNotificationsPanelProps) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initializePushState() {
      const supportMessage = getBrowserSupportMessage();

      if (supportMessage) {
        if (!cancelled) {
          setPermission("unsupported");
          setIsSupported(false);
          setError(supportMessage);
        }
        return;
      }

      try {
        await navigator.serviceWorker.register("/sw.js");
        const subscription = await getCurrentSubscription();

        if (!cancelled) {
          setIsSupported(true);
          setPermission(Notification.permission);
          setIsSubscribed(Boolean(subscription));
        }
      } catch {
        if (!cancelled) {
          setError("Nao foi possivel preparar notificacoes neste navegador.");
        }
      }
    }

    void initializePushState();

    return () => {
      cancelled = true;
    };
  }, []);

  async function getPublicKey() {
    const response = await fetch("/api/push/public-key", {
      cache: "no-store",
    });
    const payload = (await response.json()) as PublicKeyResponse;

    if (!response.ok || !payload.enabled || !payload.publicKey) {
      throw new Error(payload.error ?? "Web Push nao configurado.");
    }

    return payload.publicKey;
  }

  async function activate() {
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (!isSupported) {
        throw new Error("Push nao esta disponivel neste navegador.");
      }

      const publicKey = await getPublicKey();
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        throw new Error("Permissao de notificacao nao concedida.");
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(publicKey),
          userVisibleOnly: true,
        }));

      const response = await fetch("/api/push/subscribe", {
        body: JSON.stringify(subscription.toJSON()),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel salvar este dispositivo.");
      }

      setIsSubscribed(true);
      setMessage("Notificacoes ativadas neste dispositivo.");
    } catch (activateError) {
      setError(
        activateError instanceof Error
          ? activateError.message
          : "Erro ao ativar notificacoes.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function deactivate() {
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const subscription = await getCurrentSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        setMessage("Este dispositivo ja estava sem subscription ativa.");
        return;
      }

      await fetch("/api/push/revoke", {
        body: JSON.stringify(subscription.toJSON()),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      await subscription.unsubscribe();
      setIsSubscribed(false);
      setMessage("Notificacoes desativadas neste dispositivo.");
    } catch {
      setError("Nao foi possivel desativar notificacoes neste dispositivo.");
    } finally {
      setIsBusy(false);
    }
  }

  async function processDueReminders() {
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/push/process", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        result?: {
          delivered: number;
          failed: number;
          pendingReminders: number;
          skipped: number;
          subscriptions: number;
        };
      };

      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? "Nao foi possivel processar lembretes.");
      }

      setMessage(
        `Processado: ${payload.result.delivered} enviados, ${payload.result.skipped} ja registrados, ${payload.result.failed} falharam.`,
      );
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : "Erro ao processar lembretes.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="app-card p-5">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            Push notifications
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Ative push apenas quando quiser. O Lucas OS nao pede permissao no
            primeiro carregamento e nao envia notificacoes sem consentimento.
          </p>
        </div>
        <div className="text-sm leading-6 text-zinc-600">
          <p>Permissao: {permission}</p>
          <p>Este dispositivo: {isSubscribed ? "ativo" : "inativo"}</p>
          <p>Subscriptions ativas: {activeSubscriptionCount}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="primary-button px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          disabled={!isSupported || isBusy || permission === "denied"}
          onClick={activate}
          type="button"
        >
          Ativar notificacoes
        </button>
        <button
          className="soft-button px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          disabled={!isSupported || isBusy}
          onClick={deactivate}
          type="button"
        >
          Desativar neste dispositivo
        </button>
        <button
          className="ghost-button px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          disabled={!isSupported || isBusy}
          onClick={processDueReminders}
          type="button"
        >
          Verificar lembretes vencidos agora
        </button>
      </div>

      {permission === "denied" ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          O navegador bloqueou notificacoes. Reative nas configuracoes do site
          se quiser usar push neste dispositivo.
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

      <div className="mt-5 app-card-muted p-4 text-sm leading-6 text-zinc-600">
        <p>
          Envio automatico em segundo plano depende de scheduler/cron. Nesta V1,
          a infraestrutura de subscription e envio real esta pronta; o
          processamento automatico deve ser ligado com um job seguro antes de
          prometer push sem o app aberto.
        </p>
      </div>
    </div>
  );
}
