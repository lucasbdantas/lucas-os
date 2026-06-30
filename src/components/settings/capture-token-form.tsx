"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  type CaptureTokenActionState,
  createCaptureToken,
} from "@/lib/capture-tokens/actions";

const initialState: CaptureTokenActionState = {
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Criando..." : "Criar token"}
    </button>
  );
}

export function CaptureTokenForm() {
  const [state, action] = useActionState(createCaptureToken, initialState);

  return (
    <form action={action} className="mt-4 grid gap-3">
      <label className="block">
        <span className="text-sm font-medium text-zinc-700">Nome</span>
        <input
          className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          maxLength={120}
          name="name"
          placeholder="iPhone Shortcut"
          required
          type="text"
        />
      </label>

      <SubmitButton />

      {state.message ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {state.token ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">
            Token completo, exibido uma unica vez:
          </p>
          <code className="mt-2 block overflow-x-auto rounded bg-white px-3 py-2 text-sm text-zinc-900">
            {state.token}
          </code>
        </div>
      ) : null}
    </form>
  );
}
