"use client";

import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare2,
  Cloud,
  Download,
  FolderKanban,
  HeartPulse,
  Inbox,
  Layers3,
  Menu,
  SearchCheck,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

type AppNavProps = {
  items: NavItem[];
  notificationCount?: number;
  variant: "desktop" | "mobile";
};

const mobilePrimaryHrefs = new Set([
  "/today",
  "/quick-capture",
  "/capture",
  "/inbox",
]);

const navIcons: Record<string, LucideIcon> = {
  "/capture": Download,
  "/domains": Layers3,
  "/inbox": Inbox,
  "/library": BookOpen,
  "/notifications": Bell,
  "/planning": Sparkles,
  "/projects": FolderKanban,
  "/quick-capture": Zap,
  "/review": SearchCheck,
  "/settings": Settings,
  "/settings/backup": Cloud,
  "/settings/health": HeartPulse,
  "/settings/data": Layers3,
  "/settings/integrations": SlidersHorizontal,
  "/settings/notifications": Bell,
  "/tasks": CheckSquare2,
  "/today": CalendarDays,
};

const mobileMenuCards = [
  {
    href: "/today",
    label: "Hoje",
    description: "Painel do dia",
  },
  {
    href: "/quick-capture",
    label: "Captura rápida",
    description: "Capturar em um toque",
  },
  {
    href: "/capture",
    label: "Capturas",
    description: "Triar pendências",
  },
  {
    href: "/inbox",
    label: "Inbox",
    description: "Email e entrada operacional",
  },
  {
    href: "/tasks",
    label: "Tarefas",
    description: "Criar e editar tarefas",
  },
  {
    href: "/projects",
    label: "Projetos",
    description: "Projetos e marcos",
  },
  {
    href: "/library",
    label: "Biblioteca",
    description: "Conteúdos e notas pessoais",
  },
  {
    href: "/domains",
    label: "Domínios",
    description: "Áreas da vida",
  },
  {
    href: "/planning",
    label: "Planejamento",
    description: "Planos diários salvos",
  },
  {
    href: "/review",
    label: "Revisão",
    description: "Revisão semanal",
  },
  {
    href: "/notifications",
    label: "Notificações",
    description: "Lembretes internos",
  },
  {
    href: "/settings",
    label: "Configurações",
    description: "Preferências do app",
  },
  {
    href: "/settings/integrations",
    label: "Integrações",
    description: "Google e contas conectadas",
  },
  {
    href: "/settings/backup",
    label: "Backup",
    description: "Exportar dados",
  },
  {
    href: "/settings/notifications",
    label: "Notificações push",
    description: "Push por dispositivo",
  },
  {
    href: "/settings/health",
    label: "Saúde do sistema",
    description: "Status e checklist do setup",
  },
  {
    href: "/settings/data",
    label: "Dados do workspace",
    description: "Prévia e limpeza segura",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/today") {
    return pathname === "/" || pathname === "/today";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({
  items,
  notificationCount = 0,
  variant,
}: AppNavProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (variant === "mobile") {
    const mobileItems = items.filter((item) => mobilePrimaryHrefs.has(item.href));

    return (
      <>
        {isMenuOpen ? (
          <div className="mobile-menu-overlay fixed inset-0 z-40 md:hidden">
            <button
              aria-label="Fechar menu"
              className="absolute inset-0 h-full w-full cursor-default"
              onClick={() => setIsMenuOpen(false)}
              type="button"
            />
            <section
              aria-label="Menu mobile"
              className="mobile-menu-panel paper-panel absolute inset-x-3 bottom-24 max-h-[min(76svh,42rem)] overflow-y-auto p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-kicker">Lucas OS</p>
                  <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
                    Central mobile
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Atalhos grandes para navegar sem espremer a barra inferior.
                  </p>
                </div>
                <button
                  className="ghost-button min-h-11 px-3 py-2 text-sm font-semibold"
                  onClick={() => setIsMenuOpen(false)}
                  type="button"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {mobileMenuCards.map((item) => {
                  const active =
                    item.href === "/settings"
                      ? pathname === "/settings"
                      : isActivePath(pathname, item.href);
                  const Icon = navIcons[item.href] ?? Layers3;
                  const label =
                    item.href === "/notifications" && notificationCount > 0
                      ? `${item.label} (${notificationCount})`
                      : item.label;

                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`mobile-menu-card app-card-interactive p-3 ${
                        active ? "mobile-menu-card-active" : ""
                      }`}
                      href={item.href}
                      key={item.href}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="flex items-start gap-2.5">
                        <span className="mobile-menu-card-icon" aria-hidden="true">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-zinc-950">
                            {label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-zinc-600">
                            {item.description}
                          </span>
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}

        <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-zinc-200 bg-white shadow-[0_-10px_26px_rgb(44_45_38/0.08)] backdrop-blur md:hidden">
          {mobileItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = navIcons[item.href] ?? Layers3;
            const label =
              item.href === "/quick-capture"
                ? "Rápida"
                : item.href === "/capture"
                  ? "Capturas"
                  : item.label;

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`mobile-nav-link px-1 py-2 text-center text-[0.72rem] font-semibold ${
                  active ? "text-zinc-950" : "text-zinc-600"
                }`}
                href={item.href}
                key={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            aria-expanded={isMenuOpen}
            className={`mobile-nav-link px-1 py-2 text-center text-[0.72rem] font-semibold ${
              isMenuOpen ? "text-zinc-950" : "text-zinc-600"
            }`}
            onClick={() => setIsMenuOpen((current) => !current)}
            type="button"
          >
            <Menu aria-hidden="true" className="h-4 w-4" />
            <span>Menu</span>
          </button>
        </nav>
      </>
    );
  }

  return (
    <nav className="desktop-app-nav mt-6 flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = navIcons[item.href] ?? Layers3;
        const label =
          item.href === "/notifications" && notificationCount > 0
            ? `${item.label} (${notificationCount})`
            : item.label;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`desktop-nav-item ${
              active ? "desktop-nav-item-active" : ""
            }`}
            href={item.href}
            key={item.href}
          >
            <span className="desktop-nav-icon" aria-hidden="true">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
