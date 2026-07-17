"use client";

import { Check, Copy, ShieldCheck, Watch } from "lucide-react";
import { useState } from "react";

const endpointPath = "/api/capture/watch";
const requestBody = `{
  "text": "%watch_text",
  "source": "watch",
  "device_label": "Samsung Galaxy Watch 7"
}`;

export function SamsungWatchCaptureSetup() {
  const [copied, setCopied] = useState(false);

  async function copyEndpoint() {
    const endpoint = new URL(endpointPath, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(endpoint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="app-card-muted mt-6 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden="true" className="empty-state-icon shrink-0">
            <Watch className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-semibold text-zinc-950">
              Captura pelo relógio
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600">
              Dite no Samsung Galaxy Watch 7, envie o texto pelo Tasker e
              organize depois em Capturas. Nada vira tarefa automaticamente.
            </p>
          </div>
        </div>
        <span className="status-badge px-2.5 py-1 text-xs font-semibold">
          Wear OS
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="app-card p-4">
          <p className="text-sm font-semibold text-zinc-950">Endpoint</p>
          <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
            <code className="form-input min-w-0 flex-1 overflow-x-auto text-xs">
              {endpointPath}
            </code>
            <button
              className="soft-button min-h-11 shrink-0 gap-2 px-3 py-2 text-sm font-semibold"
              onClick={() => void copyEndpoint()}
              type="button"
            >
              {copied ? (
                <Check aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Copy aria-hidden="true" className="h-4 w-4" />
              )}
              {copied ? "Copiada" : "Copiar URL"}
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            O botão copia a URL completa deste ambiente. Ele não copia nem
            revela seu token.
          </p>
        </div>

        <div className="app-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-green-700" />
            Autenticação
          </p>
          <code className="form-input mt-2 block overflow-x-auto text-xs">
            Authorization: Bearer &lt;TOKEN_COMPLETO&gt;
          </code>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Crie um token acima com um nome como “Galaxy Watch 7”. O token
            completo aparece somente uma vez.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold text-zinc-950">
            Fluxo recomendado
          </p>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-700">
            <li>AutoWear inicia o ditado no Galaxy Watch.</li>
            <li>O texto reconhecido chega a uma tarefa do Tasker.</li>
            <li>Tasker faz um HTTP POST autenticado para o Lucas OS.</li>
            <li>A captura aparece como pendente, com origem Relógio.</li>
          </ol>
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-950">
            Body JSON no Tasker
          </p>
          <pre className="form-input mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-5">
            {requestBody}
          </pre>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Substitua <code>%watch_text</code> pela variável que recebe o
            ditado na sua automação. Envie também{" "}
            <code>Content-Type: application/json</code>.
          </p>
        </div>
      </div>
    </section>
  );
}
