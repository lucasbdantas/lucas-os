"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BookOpen,
  CheckSquare2,
  CornerDownLeft,
  FolderKanban,
  Inbox,
  Layers3,
  Navigation,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  searchCommandPalette,
} from "@/lib/navigation/command-search-actions";
import {
  commandPaletteCommands,
  commandPaletteSuggestions,
  filterCommandPaletteResults,
  shouldOpenCommandPaletteShortcut,
  type CommandPaletteResult,
} from "@/lib/navigation/command-palette";

type CommandPaletteContextValue = {
  open: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function getResultTypeLabel(type: CommandPaletteResult["type"]) {
  return {
    capture: "Captura",
    command: "Comando",
    content: "Biblioteca",
    domain: "Domínio",
    project: "Projeto",
    task: "Tarefa",
  }[type];
}

function getResultIcon(type: CommandPaletteResult["type"]) {
  return {
    capture: Inbox,
    command: Navigation,
    content: BookOpen,
    domain: Layers3,
    project: FolderKanban,
    task: CheckSquare2,
  }[type];
}

function CommandPaletteDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [entityResults, setEntityResults] = useState<CommandPaletteResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const commandResults = useMemo(
    () =>
      query
        ? filterCommandPaletteResults(commandPaletteCommands, query, 10)
        : commandPaletteSuggestions.flatMap((title) => {
            const command = commandPaletteCommands.find(
              (item) => item.title === title,
            );

            return command ? [command] : [];
          }),
    [query],
  );
  const results = useMemo(
    () => (query ? [...commandResults, ...entityResults] : commandResults),
    [commandResults, entityResults, query],
  );

  const close = useCallback(() => {
    requestIdRef.current += 1;
    setQuery("");
    setEntityResults([]);
    setSelectedIndex(0);
    setIsSearching(false);
    setSearchNotice(null);
    onClose();
  }, [onClose]);

  const openResult = useCallback(
    (result: CommandPaletteResult | undefined) => {
      if (!result) return;

      router.push(result.href);
      close();
    },
    [close, router],
  );

  const updateQuery = useCallback((value: string) => {
    requestIdRef.current += 1;
    setQuery(value);
    setSelectedIndex(0);
    setSearchNotice(null);

    if (value.trim().length < 2) {
      setEntityResults([]);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timeout = window.setTimeout(() => inputRef.current?.focus(), 0);

    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const timeout = window.setTimeout(() => {
      setIsSearching(true);
      void searchCommandPalette(query)
        .then((response) => {
          if (requestId !== requestIdRef.current) return;

          setEntityResults(response.results);
          setSearchNotice(
            response.hasPartialFailure
              ? "Alguns resultados podem estar indisponíveis agora."
              : null,
          );
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;

          setEntityResults([]);
          setSearchNotice("Não foi possível atualizar a busca agora.");
        })
        .finally(() => {
          if (requestId === requestIdRef.current) {
            setIsSearching(false);
            setSelectedIndex(0);
          }
        });
    }, 160);

    return () => window.clearTimeout(timeout);
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) => (results.length ? (index + 1) % results.length : 0));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((index) =>
          results.length ? (index - 1 + results.length) % results.length : 0,
        );
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        openResult(results[selectedIndex]);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, isOpen, openResult, results, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-start bg-zinc-950/20 p-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:place-items-center">
      <button
        aria-label="Fechar busca"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={close}
        type="button"
      />
      <section
        aria-label="Busca global"
        aria-modal="true"
        className="paper-panel relative z-10 flex max-h-[min(78svh,38rem)] w-full max-w-2xl flex-col overflow-hidden"
        role="dialog"
      >
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3">
          <Search aria-hidden="true" className="size-5 shrink-0 text-zinc-600" />
          <input
            aria-activedescendant={
              results[selectedIndex] ? `command-result-${selectedIndex}` : undefined
            }
            aria-controls="command-palette-results"
            aria-expanded="true"
            aria-label="Buscar no Lucas OS"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-zinc-500"
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Buscar comandos, tarefas, projetos, conteúdos ou capturas"
            ref={inputRef}
            role="combobox"
            value={query}
          />
          <button
            aria-label="Fechar busca"
            className="ghost-button min-h-10 min-w-10 p-2"
            onClick={close}
            title="Fechar"
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div
          aria-busy={isSearching}
          className="min-h-0 overflow-y-auto p-2"
          id="command-palette-results"
          role="listbox"
        >
          {!query ? (
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Atalhos sugeridos
            </p>
          ) : null}
          {isSearching ? (
            <p className="px-3 py-4 text-sm text-zinc-600">Buscando no seu caderno...</p>
          ) : null}
          {!isSearching && searchNotice ? (
            <p className="px-3 py-3 text-sm text-amber-800">{searchNotice}</p>
          ) : null}
          {!isSearching && results.length === 0 ? (
            <div className="empty-state m-2 px-4 py-6 text-center">
              <Search aria-hidden="true" className="mx-auto h-5 w-5 text-zinc-500" />
              <p className="mt-3 text-sm font-semibold text-zinc-950">Nada encontrado</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Tente outro termo ou abra um dos atalhos sugeridos.
              </p>
            </div>
          ) : (
            <div className="grid gap-1">
              {results.map((result, index) => {
                const ResultIcon = getResultIcon(result.type);

                return (
                <button
                  aria-selected={index === selectedIndex}
                  className={`flex min-h-14 w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left ${
                    index === selectedIndex
                      ? "bg-zinc-100 text-zinc-950"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                  id={`command-result-${index}`}
                  key={`${result.type}:${result.href}:${result.title}`}
                  onClick={() => openResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="option"
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="desktop-nav-icon" aria-hidden="true">
                      <ResultIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-zinc-950">
                      {result.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-zinc-600">
                      {result.description}
                    </span>
                    </span>
                  </span>
                  <span className="status-badge shrink-0 px-2 py-1 text-xs font-medium">
                    {getResultTypeLabel(result.type)}
                  </span>
                </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600">
          <span>Setas para navegar</span>
          <span className="inline-flex items-center gap-1">
            <CornerDownLeft aria-hidden="true" className="size-3" /> abrir
          </span>
          <span>Esc para fechar</span>
        </div>
      </section>
    </div>
  );
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        shouldOpenCommandPaletteShortcut({
          ctrlKey: event.ctrlKey,
          isEditable: isEditableTarget(event.target),
          key: event.key,
          metaKey: event.metaKey,
        })
      ) {
        event.preventDefault();
        open();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <CommandPaletteContext.Provider value={{ open }}>
      {children}
      <CommandPaletteDialog isOpen={isOpen} onClose={close} />
    </CommandPaletteContext.Provider>
  );
}

export function CommandPaletteTrigger({ variant }: { variant: "desktop" | "mobile" }) {
  const context = useContext(CommandPaletteContext);

  if (!context) {
    throw new Error("CommandPaletteTrigger must be used inside CommandPaletteProvider.");
  }

  if (variant === "mobile") {
    return (
      <button
        aria-label="Abrir busca"
        className="ghost-button min-h-11 min-w-11 p-2"
        onClick={context.open}
        title="Buscar"
        type="button"
      >
        <Search aria-hidden="true" className="size-5" />
      </button>
    );
  }

  return (
    <button
      className="sidebar-search-button soft-button mt-5 w-full justify-between px-3 py-2.5 text-sm font-medium"
      onClick={context.open}
      type="button"
    >
      <span className="inline-flex items-center gap-2">
        <Search aria-hidden="true" className="size-4" />
        Buscar
      </span>
      <kbd className="rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[0.68rem] font-semibold text-zinc-600">
        Ctrl K
      </kbd>
    </button>
  );
}
