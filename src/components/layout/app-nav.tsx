"use client";

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

const mobileMenuCards = [
  {
    href: "/today",
    label: "Today",
    description: "Painel do dia",
  },
  {
    href: "/quick-capture",
    label: "Quick Capture",
    description: "Capturar em um toque",
  },
  {
    href: "/capture",
    label: "Capture",
    description: "Triar pendencias",
  },
  {
    href: "/inbox",
    label: "Inbox",
    description: "Email e entrada operacional",
  },
  {
    href: "/tasks",
    label: "Tasks",
    description: "Criar e editar tarefas",
  },
  {
    href: "/projects",
    label: "Projects",
    description: "Projetos e milestones",
  },
  {
    href: "/library",
    label: "Biblioteca",
    description: "Conteúdos e notas pessoais",
  },
  {
    href: "/domains",
    label: "Domains",
    description: "Areas da vida",
  },
  {
    href: "/review",
    label: "Review",
    description: "Revisao semanal",
  },
  {
    href: "/notifications",
    label: "Notifications",
    description: "Lembretes internos",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Preferencias do app",
  },
  {
    href: "/settings/integrations",
    label: "Integrations",
    description: "Google e contas conectadas",
  },
  {
    href: "/settings/backup",
    label: "Backup",
    description: "Exportar dados",
  },
  {
    href: "/settings/notifications",
    label: "Push Notifications",
    description: "Push por dispositivo",
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
                  const active = isActivePath(pathname, item.href);
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
                      <span className="block text-sm font-semibold text-zinc-950">
                        {label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-zinc-600">
                        {item.description}
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
            const label =
              item.href === "/quick-capture" ? "Quick" : item.label;

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
                {label}
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
            Menu
          </button>
        </nav>
      </>
    );
  }

  return (
    <nav className="mt-7 flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const label =
          item.href === "/notifications" && notificationCount > 0
            ? `${item.label} (${notificationCount})`
            : item.label;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`rounded-2xl px-3 py-2.5 text-sm font-medium ${
              active
                ? "bg-zinc-100 text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            }`}
            href={item.href}
            key={item.href}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
