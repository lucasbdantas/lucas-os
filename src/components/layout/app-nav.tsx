"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

type AppNavProps = {
  items: NavItem[];
  notificationCount?: number;
  variant: "desktop" | "mobile";
};

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

  if (variant === "mobile") {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-9 border-t border-zinc-200 bg-white shadow-[0_-10px_26px_rgb(44_45_38/0.08)] backdrop-blur md:hidden">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const label =
            item.href === "/notifications" && notificationCount > 0
              ? `${item.label} (${notificationCount})`
              : item.label;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`px-1 py-3 text-center text-[0.66rem] font-semibold ${
                active ? "text-zinc-950" : "text-zinc-600"
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
