"use client";

import { useFormStatus } from "react-dom";

export function CaptureTaskSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="primary-button px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Criando..." : "Criar tarefa"}
    </button>
  );
}
