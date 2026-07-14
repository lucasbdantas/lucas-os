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
        <button className="soft-button px-3 py-2 text-sm font-semibold">
          Resolvida
        </button>
      </form>
      <form action={updatePendingCaptureStatus}>
        <input name="captureId" type="hidden" value={captureId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        <input name="status" type="hidden" value="dismissed" />
        <button className="ghost-button px-3 py-2 text-sm font-semibold">
          Dispensar
        </button>
      </form>
      <form action={updatePendingCaptureStatus}>
        <input name="captureId" type="hidden" value={captureId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        <input name="status" type="hidden" value="expired" />
        <button className="soft-button px-3 py-2 text-sm font-semibold">
          Expirada
        </button>
      </form>
    </div>
  );
}
