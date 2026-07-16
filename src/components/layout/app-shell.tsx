import { AppNav } from "@/components/layout/app-nav";
import { LogOut } from "lucide-react";
import {
  CommandPaletteProvider,
  CommandPaletteTrigger,
} from "@/components/navigation/command-palette";
import type { AppAppearance } from "@/lib/app-settings/preferences";
import { logout } from "@/lib/auth/actions";

const navItems = [
  { href: "/today", label: "Hoje" },
  { href: "/quick-capture", label: "Captura rápida" },
  { href: "/planning", label: "Planejamento" },
  { href: "/review", label: "Revisão" },
  { href: "/notifications", label: "Notificações" },
  { href: "/capture", label: "Capturas" },
  { href: "/inbox", label: "Inbox" },
  { href: "/domains", label: "Domínios" },
  { href: "/projects", label: "Projetos" },
  { href: "/tasks", label: "Tarefas" },
  { href: "/library", label: "Biblioteca" },
  { href: "/settings", label: "Configurações" },
];

type AppShellProps = {
  appearance?: AppAppearance;
  children: React.ReactNode;
  notificationCount?: number;
  userEmail?: string;
};

export function AppShell({
  appearance = "light",
  children,
  notificationCount = 0,
  userEmail,
}: AppShellProps) {
  return (
    <CommandPaletteProvider>
    <div className="app-shell-surface min-h-screen" data-theme={appearance}>
      <aside className="app-sidebar fixed inset-y-0 left-0 hidden w-72 border-r px-5 py-6 md:flex md:flex-col">
        <div className="app-sidebar-brand app-card-soft p-4">
          <p className="section-kicker">Lucas OS</p>
          <p className="mt-2 text-lg font-semibold text-zinc-950">
            Caderno operacional
          </p>
          <p className="mt-2 truncate text-sm text-zinc-600">{userEmail}</p>
        </div>

        <CommandPaletteTrigger variant="desktop" />

        <AppNav
          items={navItems}
          notificationCount={notificationCount}
          variant="desktop"
        />

        <form action={logout} className="app-sidebar-footer pt-3">
          <button className="app-sidebar-logout soft-button w-full gap-2 px-3 py-2.5 text-left text-sm font-medium">
            <LogOut aria-hidden="true" className="h-4 w-4" /> Sair
          </button>
        </form>
      </aside>

      <header className="app-mobile-header sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white px-4 pb-3 backdrop-blur md:hidden">
        <div>
          <p className="section-kicker">Lucas OS</p>
          <p className="max-w-48 truncate text-xs text-zinc-600">{userEmail}</p>
        </div>
        <div className="flex items-center gap-1">
          <CommandPaletteTrigger variant="mobile" />
          <form action={logout}>
            <button aria-label="Sair" className="soft-button min-h-11 min-w-11 p-2" title="Sair">
              <LogOut aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <div className="min-h-screen pb-32 md:pl-72 md:pb-0">{children}</div>

      <AppNav
        items={navItems}
        notificationCount={notificationCount}
        variant="mobile"
      />
    </div>
    </CommandPaletteProvider>
  );
}
