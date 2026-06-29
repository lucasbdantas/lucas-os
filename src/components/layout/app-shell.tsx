import Link from "next/link";
import { logout } from "@/lib/auth/actions";

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/inbox", label: "Inbox" },
  { href: "/domains", label: "Domains" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
  { href: "/settings", label: "Settings" },
];

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string;
};

export function AppShell({ children, userEmail }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white px-4 py-5 md:flex md:flex-col">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Lucas OS
          </p>
          <p className="mt-2 truncate text-sm text-zinc-700">{userEmail}</p>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form action={logout}>
          <button className="w-full rounded-md border border-zinc-200 px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100">
            Sair
          </button>
        </form>
      </aside>

      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Lucas OS
          </p>
          <p className="max-w-48 truncate text-xs text-zinc-600">{userEmail}</p>
        </div>
        <form action={logout}>
          <button className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700">
            Sair
          </button>
        </form>
      </header>

      <div className="min-h-screen pb-20 md:pl-64 md:pb-0">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 grid grid-cols-6 border-t border-zinc-200 bg-white md:hidden">
        {navItems.map((item) => (
          <Link
            className="px-1 py-3 text-center text-xs font-medium text-zinc-700"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
