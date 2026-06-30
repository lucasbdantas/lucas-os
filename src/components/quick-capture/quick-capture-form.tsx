"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useFormStatus } from "react-dom";
import {
  createQuickCapture,
  type QuickCaptureState,
} from "@/lib/quick-capture/actions";

const initialState: QuickCaptureState = {
  status: "idle",
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((event: {
        results: ArrayLike<{
          isFinal: boolean;
          0: { transcript: string };
        }>;
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return (
    (window as SpeechWindow).SpeechRecognition ??
    (window as SpeechWindow).webkitSpeechRecognition
  );
}

function subscribeToSpeechSupport() {
  return () => {};
}

function getSpeechSupportSnapshot() {
  return Boolean(getSpeechRecognitionConstructor());
}

function getServerSpeechSupportSnapshot() {
  return true;
}

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

function appendDictationText(currentText: string, spokenText: string) {
  const cleanSpokenText = spokenText.trim();

  if (!cleanSpokenText) {
    return currentText;
  }

  const cleanCurrentText = currentText.trimEnd();

  if (!cleanCurrentText) {
    return cleanSpokenText;
  }

  return `${cleanCurrentText}\n${cleanSpokenText}`;
}

export function QuickCaptureForm() {
  const [state, action] = useActionState(createQuickCapture, initialState);
  const isVoiceSupported = useSyncExternalStore(
    subscribeToSpeechSupport,
    getSpeechSupportSnapshot,
    getServerSpeechSupportSnapshot,
  );
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      textareaRef.current?.focus();
    }
  }, [state.status]);

  function startListening() {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setVoiceMessage(
        "Reconhecimento de voz não disponível neste navegador. Use o teclado do celular ou o ditado do sistema.",
      );
      return;
    }

    recognitionRef.current?.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const finalTranscript = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (textareaRef.current && finalTranscript) {
        textareaRef.current.value = appendDictationText(
          textareaRef.current.value,
          finalTranscript,
        );
        textareaRef.current.focus();
      }
    };

    recognition.onerror = () => {
      setVoiceMessage(
        "Não consegui capturar a fala agora. Tente novamente ou use o teclado do celular.",
      );
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setVoiceMessage("Ouvindo...");
    setIsListening(true);
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceMessage("Ditado pausado. Revise o texto antes de salvar.");
  }

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

        <div className="grid gap-2">
          {isVoiceSupported ? (
            <button
              className="min-h-12 rounded-md border border-zinc-300 bg-white px-4 py-3 text-base font-semibold text-zinc-900 hover:bg-zinc-50"
              onClick={isListening ? stopListening : startListening}
              type="button"
            >
              {isListening ? "Parar" : "Falar"}
            </button>
          ) : null}

          {voiceMessage || !isVoiceSupported ? (
            <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              {voiceMessage ??
                "Reconhecimento de voz não disponível neste navegador. Use o teclado do celular ou o ditado do sistema."}
            </p>
          ) : null}
        </div>

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
