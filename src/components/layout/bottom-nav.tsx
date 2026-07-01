"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/layout/nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#ece4da] bg-white/95 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-[#342c26] dark:bg-[#211c18]/95 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-extrabold ${
                isActive ? "text-orange-500" : "text-[#a89e93] dark:text-[#7c7064]"
              }`}
              href={item.href}
              key={item.href}
            >
              <span className="text-xl" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
              {item.badge ? (
                <span className="absolute right-6 top-0 h-2 w-2 rounded-full bg-rose-500" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
