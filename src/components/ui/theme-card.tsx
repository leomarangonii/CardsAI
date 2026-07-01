import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { ThemeOption } from "@/types";

interface ThemeCardProps {
  theme: ThemeOption;
  studied: number;
  total: number;
}

export function ThemeCard({ theme, studied, total }: ThemeCardProps) {
  return (
    <Link
      className="group flex min-h-36 flex-col rounded-[20px] border-2 border-[#ece4da] bg-white p-4 shadow-[0_4px_0_#ece4da] transition hover:-translate-y-0.5 hover:border-orange-500 dark:border-[#342c26] dark:bg-[#211c18] dark:shadow-[0_4px_0_#342c26]"
      href={`/study/text/${theme.id}`}
    >
      <span className="text-3xl" aria-hidden="true">
        {theme.emoji}
      </span>
      <span className="mt-4 text-sm font-black">{theme.label}</span>
      <div className="mt-auto w-full pt-3">
        <ProgressBar value={studied} max={total} />
        <p className="mt-2 text-xs font-bold text-[#a89e93]">
          {studied}/{total} dominadas
        </p>
      </div>
    </Link>
  );
}
