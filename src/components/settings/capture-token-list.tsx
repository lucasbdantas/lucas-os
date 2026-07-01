import { revokeCaptureToken } from "@/lib/capture-tokens/actions";
import { formatDateTime } from "@/lib/format";

export type CaptureTokenListItem = {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

type CaptureTokenListProps = {
  tokens: CaptureTokenListItem[];
};

export function CaptureTokenList({ tokens }: CaptureTokenListProps) {
  if (tokens.length === 0) {
    return (
      <p className="app-card-muted mt-4 px-3 py-2 text-sm text-zinc-600">
        Nenhum token criado ainda.
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-3">
      {tokens.map((token) => (
        <article
          className="app-card-soft p-3"
          key={token.id}
        >
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-zinc-950">{token.name}</h3>
                {token.revoked_at ? (
                  <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                    revogado
                  </span>
                ) : (
                  <span className="rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                    ativo
                  </span>
                )}
              </div>
              <dl className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-3">
                <div>
                  <dt className="font-medium text-zinc-500">Prefixo</dt>
                  <dd className="mt-1 font-mono text-zinc-900">
                    {token.token_prefix}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Criado em</dt>
                  <dd className="mt-1">{formatDateTime(token.created_at)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Ultimo uso</dt>
                  <dd className="mt-1">
                    {formatDateTime(token.last_used_at, "Nunca usado")}
                  </dd>
                </div>
                {token.revoked_at ? (
                  <div>
                    <dt className="font-medium text-zinc-500">Revogado em</dt>
                    <dd className="mt-1">
                      {formatDateTime(token.revoked_at)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {!token.revoked_at ? (
              <form action={revokeCaptureToken}>
                <input name="tokenId" type="hidden" value={token.id} />
                <button className="danger-button px-3 py-2 text-sm font-semibold">
                  Revogar
                </button>
              </form>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
