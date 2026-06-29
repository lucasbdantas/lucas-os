"use client";

import { useFormStatus } from "react-dom";

export function CaptureTaskSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Criando..." : "Criar tarefa"}
    </button>
  );
}
