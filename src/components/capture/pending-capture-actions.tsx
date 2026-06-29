import { updatePendingCaptureStatus } from "@/lib/captures/actions";

type PendingCaptureActionsProps = {
  captureId: string;
  returnTo: string;
};

export function PendingCaptureActions({
  captureId,
  returnTo,
}: PendingCaptureActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={updatePendingCaptureStatus}>
        <input name="captureId" type="hidden" value={captureId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        <input name="status" type="hidden" value="resolved" />
        <button className="rounded-md border border-green-200 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50">
          Resolvida
        </button>
      </form>
      <form action={updatePendingCaptureStatus}>
        <input name="captureId" type="hidden" value={captureId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        <input name="status" type="hidden" value="dismissed" />
        <button className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
          Dispensar
        </button>
      </form>
      <form action={updatePendingCaptureStatus}>
        <input name="captureId" type="hidden" value={captureId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        <input name="status" type="hidden" value="expired" />
        <button className="rounded-md border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50">
          Expirada
        </button>
      </form>
    </div>
  );
}
