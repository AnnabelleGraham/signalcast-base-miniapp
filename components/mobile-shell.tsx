"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { WalletBar } from "./wallet-bar";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/signals", label: "Signals" },
  { href: "/profile", label: "Profile" },
  { href: "/about", label: "About" },
];

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7fbff_0%,_#eef4ff_45%,_#e5edf9_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-slate-200 bg-white/90 backdrop-blur">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="text-lg font-extrabold tracking-tight text-slate-900">
              SignalCast
            </Link>
            <WalletBar />
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 border-t border-slate-200 bg-white/98 px-2 py-2">
          <ul className="grid grid-cols-4 gap-2">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold ${
                      active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
