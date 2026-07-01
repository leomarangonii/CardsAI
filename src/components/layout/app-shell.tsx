import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HeaderStatsClient } from "@/components/layout/header-stats-client";
import { LogoMark } from "@/components/layout/logo-mark";
import { Sidebar } from "@/components/layout/sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#faf7f3] text-[#2b2622] dark:bg-[#15120f] dark:text-[#f4ede4]">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ece4da]/80 bg-[#faf7f3]/90 px-5 py-4 backdrop-blur dark:border-[#342c26] dark:bg-[#15120f]/90 lg:px-8">
            <div className="flex items-center gap-2 font-black lg:hidden">
              <LogoMark size="sm" />
              CardsAI
            </div>
            <div className="hidden lg:block" />
            <HeaderStatsClient />
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
