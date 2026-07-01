"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/layout/logo-mark";
import { navItems } from "@/components/layout/nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[#ece4da] bg-white px-4 py-6 dark:border-[#342c26] dark:bg-[#211c18] lg:flex lg:flex-col">
      <Link className="mb-8 flex items-center gap-3 px-2 text-xl font-black" href="/study">
        <LogoMark />
        CardsAI
      </Link>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold transition ${
                isActive
                  ? "bg-orange-500 text-white shadow-[0_4px_0_#d9531f]"
                  : "text-[#6b6258] hover:bg-[#f4efe9] dark:text-[#b8aa9b] dark:hover:bg-[#2b2420]"
              }`}
              href={item.href}
              key={item.href}
            >
              <span className="text-xl" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge ? (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                    isActive ? "bg-white/20 text-white" : "bg-rose-500 text-white"
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
