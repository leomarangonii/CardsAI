"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mascot, type MascotMood } from "@/components/mascot";
import { Confetti } from "@/components/ui/confetti";
import { loadDifficultCards } from "@/lib/session-handoff";
import type { Flashcard, LanguageCode } from "@/types";

interface SessionSummaryProps {
  targetLang: LanguageCode;
  languageLabel: string;
  knowCount: number;
  almostCount: number;
  dontCount: number;
  xpEarned: number;
}

const CONFETTI_THRESHOLD = 0.7;
const CONFETTI_DURATION_MS = 3000;

function pickMood(ratio: number): MascotMood {
  if (ratio >= 0.7) {
    return "excited";
  }
  if (ratio >= 0.4) {
    return "happy";
  }
  return "thinking";
}

function pickMessage(ratio: number, total: number): string {
  if (total === 0) {
    return "Sessão concluída. Bora para a próxima!";
  }
  if (ratio >= 0.7) {
    return "Incrível! Você arrasou! 🏆";
  }
  if (ratio >= 0.4) {
    return "Bom ritmo! Continue assim. 💪";
  }
  return "Cada erro é treino. Você vai chegar lá! 🌱";
}

export function SessionSummary({
  targetLang,
  languageLabel,
  knowCount,
  almostCount,
  dontCount,
  xpEarned,
}: SessionSummaryProps) {
  const total = knowCount + almostCount + dontCount;
  const ratio = total > 0 ? knowCount / total : 0;
  const mood = pickMood(ratio);
  const [difficultCards, setDifficultCards] = useState<Flashcard[]>([]);
  // Estado inicial derivado: liga o confetti já no primeiro render do client.
  const [showConfetti, setShowConfetti] = useState(total > 0 && ratio >= CONFETTI_THRESHOLD);

  // Lê o handoff da sessão (sessionStorage) após o mount para não quebrar a
  // hidratação — servidor e primeiro render do client começam com lista vazia.
  useEffect(() => {
    if (dontCount > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura única de store externo no mount
      setDifficultCards(loadDifficultCards(targetLang));
    }
  }, [dontCount, targetLang]);

  useEffect(() => {
    if (!showConfetti) {
      return;
    }
    const timer = window.setTimeout(() => setShowConfetti(false), CONFETTI_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [showConfetti]);

  return (
    <div className="mx-auto max-w-3xl">
      {showConfetti ? <Confetti /> : null}

      <section className="mb-6 flex flex-col items-center text-center">
        <Mascot mood={mood} size={112} />
        <h1 className="mt-5 text-3xl font-black">{pickMessage(ratio, total)}</h1>
        <p className="mt-2 text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
          Você completou uma sessão do deck pessoal de {languageLabel}.
        </p>
      </section>

      <section className="mb-5 grid grid-cols-3 gap-3">
        <SummaryStat label="Sei" value={knowCount} tone="green" />
        <SummaryStat label="Quase" value={almostCount} tone="amber" />
        <SummaryStat label="Revisar" value={dontCount} tone="red" />
      </section>

      <section className="mb-5 rounded-[22px] border border-[#ece4da] bg-white p-5 text-center shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
        <p className="text-sm font-black text-[#a89e93]">XP ganho na sessão</p>
        <p className="mt-1 text-4xl font-black text-orange-500">+{xpEarned}</p>
      </section>

      {difficultCards.length > 0 ? (
        <section className="mb-6 rounded-[22px] border border-[#ece4da] bg-white p-5 shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
          <h2 className="mb-3 text-lg font-black">Palavras para revisar</h2>
          <ul className="flex flex-col gap-2">
            {difficultCards.map((card) => (
              <li
                className="flex items-center justify-between gap-3 rounded-2xl bg-[#fff8ef] px-4 py-3 dark:bg-[#2b2420]"
                key={card.id}
              >
                <span className="text-sm font-black">{card.word}</span>
                <span className="text-right text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
                  {card.translation}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mb-6 rounded-[22px] border border-[#ece4da] bg-white p-5 shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
          <h2 className="mb-2 text-lg font-black">Próxima revisão</h2>
          <p className="text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
            As datas e níveis das palavras foram recalculados no backend com SM-2. Abra Progresso
            para ver o estado real do seu vocabulário.
          </p>
        </section>
      )}

      <section className="grid gap-3">
        {difficultCards.length > 0 ? (
          <Link
            className="flex h-14 items-center justify-center rounded-2xl bg-orange-500 px-4 text-sm font-black text-white shadow-[0_5px_0_#d9531f]"
            href={`/study/deck/${targetLang}?source=difficult`}
          >
            Revisar palavras difíceis
          </Link>
        ) : null}
        <Link
          className={`flex h-14 items-center justify-center rounded-2xl px-4 text-sm font-black ${
            difficultCards.length > 0
              ? "border border-[#ece4da] bg-white shadow-[0_4px_0_#ece4da] dark:border-[#342c26] dark:bg-[#2b2420] dark:shadow-[0_4px_0_#342c26]"
              : "bg-orange-500 text-white shadow-[0_5px_0_#d9531f]"
          }`}
          href="/study"
        >
          Ler novo texto
        </Link>
        <Link
          className="flex h-14 items-center justify-center rounded-2xl border border-[#ece4da] bg-white px-4 text-sm font-black text-orange-600 shadow-[0_4px_0_#ece4da] dark:border-[#342c26] dark:bg-[#2b2420] dark:shadow-[0_4px_0_#342c26]"
          href="/progress"
        >
          Ver progresso
        </Link>
      </section>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "amber" | "red";
}) {
  const toneClasses = {
    green: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    red: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  };

  return (
    <article className={`rounded-[20px] p-4 text-center ${toneClasses[tone]}`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black">{label}</p>
    </article>
  );
}
