import { createPendingCapture } from "@/lib/captures/actions";

type CaptureFormProps = {
  returnTo: string;
};

export function CaptureForm({ returnTo }: CaptureFormProps) {
  return (
    <form
      action={createPendingCapture}
      className="rounded-md border border-zinc-200 bg-white p-4"
    >
      <input name="returnTo" type="hidden" value={returnTo} />
      <input name="source" type="hidden" value="manual" />

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">
          Texto bruto
        </span>
        <textarea
          className="mt-2 min-h-40 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-zinc-900"
          maxLength={12000}
          name="rawText"
          placeholder="Digite uma ideia, pendencia, lembrete ou qualquer captura ainda sem triagem."
          required
        />
      </label>

      <button className="mt-4 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Salvar captura
      </button>
    </form>
  );
}
