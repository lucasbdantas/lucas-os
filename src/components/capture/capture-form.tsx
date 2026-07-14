import { createPendingCapture } from "@/lib/captures/actions";

type CaptureFormProps = {
  returnTo: string;
};

export function CaptureForm({ returnTo }: CaptureFormProps) {
  return (
    <form
      action={createPendingCapture}
      className="capture-card p-4"
    >
      <input name="returnTo" type="hidden" value={returnTo} />
      <input name="source" type="hidden" value="manual" />

      <label className="block">
        <span className="text-sm font-semibold text-zinc-800">
          Texto bruto
        </span>
        <textarea
          className="field-control mt-2 min-h-40 w-full px-4 py-3 text-sm leading-6 outline-none"
          maxLength={12000}
          name="rawText"
          placeholder="Digite uma ideia, pendencia, lembrete ou qualquer captura ainda sem triagem."
          required
        />
      </label>

      <button className="primary-button mt-4 px-4 py-2.5 text-sm font-semibold">
        Salvar captura
      </button>
    </form>
  );
}
