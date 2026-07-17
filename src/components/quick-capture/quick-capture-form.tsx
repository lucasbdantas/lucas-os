"use client";

import Link from "next/link";
import { ArrowRight, Mic, MicOff, Save } from "lucide-react";
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
      className="primary-button min-h-14 w-full gap-2 px-5 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <Save aria-hidden="true" className="h-5 w-5" />
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
      <form
        action={action}
        className="capture-card grid gap-4 p-4 sm:p-5"
        ref={formRef}
      >
        <label className="block">
          <span className="text-sm font-semibold text-zinc-800">
            Texto bruto
          </span>
          <textarea
            autoCapitalize="sentences"
            autoFocus
            className="field-control mt-2 min-h-[52svh] w-full resize-y px-4 py-4 text-base leading-7 outline-none sm:min-h-[48vh]"
            maxLength={12000}
            name="rawText"
            placeholder="Jogue aqui qualquer coisa solta. Você organiza depois em Captura."
            ref={textareaRef}
            required
            spellCheck
          />
        </label>

        <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
          {isVoiceSupported ? (
            <button
              className="soft-button min-h-12 gap-2 px-5 py-3 text-base font-semibold"
              onClick={isListening ? stopListening : startListening}
              type="button"
            >
              {isListening ? (
                <MicOff aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Mic aria-hidden="true" className="h-5 w-5" />
              )}
              {isListening ? "Parar" : "Falar"}
            </button>
          ) : null}

          {voiceMessage || !isVoiceSupported ? (
            <p className="app-card-muted px-3 py-2 text-sm leading-6 text-zinc-700">
              {voiceMessage ??
                "Reconhecimento de voz não disponível neste navegador. Use o teclado do celular ou o ditado do sistema."}
            </p>
          ) : null}
        </div>

        {state.message ? (
          <p
            className="feedback-panel"
            data-tone={state.status === "error" ? "danger" : "success"}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}

        <SubmitButton />
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          className="soft-button min-h-12 px-4 py-3 text-center text-sm font-semibold"
          href="/capture"
        >
          Ver pendências <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <Link
          className="ghost-button min-h-12 px-4 py-3 text-center text-sm font-semibold"
          href="/today"
        >
          Hoje
        </Link>
      </div>
    </div>
  );
}
