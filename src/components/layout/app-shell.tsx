import { AppNav } from "@/components/layout/app-nav";
import {
  CommandPaletteProvider,
  CommandPaletteTrigger,
} from "@/components/navigation/command-palette";
import type { AppAppearance } from "@/lib/app-settings/preferences";
import { logout } from "@/lib/auth/actions";

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/quick-capture", label: "Quick" },
  { href: "/review", label: "Review" },
  { href: "/notifications", label: "Notificações" },
  { href: "/capture", label: "Capture" },
  { href: "/inbox", label: "Inbox" },
  { href: "/domains", label: "Domains" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
  { href: "/library", label: "Biblioteca" },
  { href: "/settings", label: "Settings" },
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
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-zinc-200 bg-white px-5 py-6 md:flex md:flex-col">
        <div className="app-card-soft p-4">
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

        <form action={logout}>
          <button className="soft-button w-full px-3 py-2.5 text-left text-sm font-medium">
            Sair
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
            <button className="soft-button px-3 py-2 text-sm font-medium">
              Sair
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
