"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  createQuickCapture,
  type QuickCaptureState,
} from "@/lib/quick-capture/actions";

const initialState: QuickCaptureState = {
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="min-h-14 w-full rounded-md bg-zinc-950 px-5 py-4 text-base font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Salvando..." : "Salvar captura"}
    </button>
  );
}

export function QuickCaptureForm() {
  const [state, action] = useActionState(createQuickCapture, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      textareaRef.current?.focus();
    }
  }, [state.status]);

  return (
    <div className="grid gap-4">
      <form action={action} className="grid gap-4" ref={formRef}>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">
            Texto bruto
          </span>
          <textarea
            autoFocus
            className="mt-2 min-h-[42vh] w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-base leading-7 outline-none focus:border-zinc-900"
            maxLength={12000}
            name="rawText"
            placeholder="Jogue aqui qualquer coisa solta. Você organiza depois em Captura."
            ref={textareaRef}
            required
          />
        </label>

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

        <SubmitButton />
      </form>

      <div className="grid grid-cols-2 gap-3">
        <Link
          className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          href="/capture"
        >
          Ver pendências
        </Link>
        <Link
          className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          href="/today"
        >
          Hoje
        </Link>
      </div>
    </div>
  );
}
