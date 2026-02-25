"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const TABS = [
  { label: "Now", href: "/now" },
  { label: "Digest", href: "/digest", phase: "P1" },
  { label: "Odds", href: "/odds", phase: "P2" },
  { label: "Admin", href: "/admin" },
];

export function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-zinc-800">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-b-2 border-orange-400 text-orange-400"
                : "text-zinc-400 hover:text-zinc-100"
            )}
          >
            {tab.label}
            {tab.phase && (
              <span className="ml-1 text-xs text-zinc-600">({tab.phase})</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
