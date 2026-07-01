"use client";

import { collection, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { LanguageSwitcher } from "@/components/study/language-switcher";
import { SectionTitle } from "@/components/ui/section-title";
import { getLanguageLabel } from "@/lib/catalog";
import { firebaseDb } from "@/lib/firebase/client";
import type { MasteryLevel } from "@/types";

interface ProgressCard {
  id: string;
  word: string;
  translation: string;
  masteryLevel: MasteryLevel;
}

interface UserStats {
  totalCardsStudied: number;
  currentStreak: number;
  longestStreak: number;
}

const masteryLabels = {
  new: "Novo",
  learning: "Aprendendo",
  reviewing: "Revisando",
  mastered: "Dominado",
} as const;

const masteryBadgeClasses = {
  new: "bg-[#f4efe9] text-[#6b6258] dark:bg-[#2b2420] dark:text-[#f4ede4]",
  learning: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  reviewing: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  mastered: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
} as const;

const bucketConfig: Record<MasteryLevel, { label: string; colorClass: string; icon: string }> = {
  new: { label: "Novo", colorClass: "bg-[#aca49a]", icon: "🆕" },
  learning: { label: "Aprendendo", colorClass: "bg-[#36c46b]", icon: "🌱" },
  reviewing: { label: "Revisando", colorClass: "bg-[#2bb3e7]", icon: "🌿" },
  mastered: { label: "Dominado", colorClass: "bg-[#ff6b35]", icon: "🌳" },
};

export function ProgressDashboard() {
  const { user, profile } = useAuth();
  const [cards, setCards] = useState<ProgressCard[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalCardsStudied: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    if (!user || !profile) {
      return;
    }

    const unsubscribeUser = onSnapshot(doc(firebaseDb, "users", user.uid), (snapshot) => {
      const data = snapshot.data();
      setStats({
        totalCardsStudied:
          typeof data?.totalCardsStudied === "number" ? data.totalCardsStudied : 0,
        currentStreak: typeof data?.currentStreak === "number" ? data.currentStreak : 0,
        longestStreak: typeof data?.longestStreak === "number" ? data.longestStreak : 0,
      });
    });

    const unsubscribeCards = onSnapshot(
      collection(firebaseDb, "users", user.uid, "languageDecks", profile.targetLang, "cards"),
      (snapshot) => {
        setCards(
          snapshot.docs.map((cardDoc) => {
            const data = cardDoc.data();
            return {
              id: cardDoc.id,
              word: typeof data.word === "string" ? data.word : cardDoc.id,
              translation: typeof data.translation === "string" ? data.translation : "",
              masteryLevel: isMasteryLevel(data.masteryLevel) ? data.masteryLevel : "new",
            };
          }),
        );
      },
    );

    return () => {
      unsubscribeUser();
      unsubscribeCards();
    };
  }, [profile, user]);

  const buckets = useMemo(() => {
    return (["new", "learning", "reviewing", "mastered"] as MasteryLevel[]).map((level) => ({
      level,
      count: cards.filter((card) => card.masteryLevel === level).length,
      ...bucketConfig[level],
    }));
  }, [cards]);
  const totalMastery = Math.max(cards.length, 1);
  const masteredCount = buckets.find((bucket) => bucket.level === "mastered")?.count ?? 0;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Progresso</h1>
          <p className="mt-1 text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
            Deck pessoal de {getLanguageLabel(profile?.targetLang ?? "en")}
          </p>
        </div>
        <LanguageSwitcher variant="surface" />
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="📚" value={stats.totalCardsStudied} label="Palavras estudadas" />
        <StatCard icon="🌳" value={masteredCount} label="Dominadas" />
        <StatCard icon="🔥" value={stats.currentStreak} label="Streak atual" />
        <StatCard icon="🏆" value={stats.longestStreak} label="Recorde de streak" />
      </section>

      <section className="mb-6 rounded-[22px] border border-[#ece4da] bg-white p-5 shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
        <SectionTitle>Domínio do vocabulário</SectionTitle>
        <div className="flex h-4 overflow-hidden rounded-full bg-[#f4efe9] dark:bg-[#2b2420]">
          {buckets.map((bucket) => (
            <span
              className={bucket.colorClass}
              key={bucket.level}
              style={{ width: `${(bucket.count / totalMastery) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {buckets.map((bucket) => (
            <span
              className="inline-flex items-center gap-2 text-xs font-bold text-[#6b6258] dark:text-[#b8aa9b]"
              key={bucket.level}
            >
              <span className={`h-3 w-3 rounded ${bucket.colorClass}`} />
              {bucket.icon} {bucket.label} · {bucket.count}
            </span>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Meu vocabulário</SectionTitle>
        {cards.length === 0 ? (
          <div className="rounded-[20px] border border-[#ece4da] bg-white p-5 text-sm font-bold text-[#6b6258] shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18] dark:text-[#b8aa9b]">
            Seu deck ainda está vazio. Leia um texto e adicione palavras para ver progresso real.
          </div>
        ) : (
          <div className="space-y-2.5">
            {cards.map((item) => (
              <article
                className="flex min-h-[54px] items-center gap-3 rounded-2xl border border-[#ece4da] bg-white px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)] dark:border-[#342c26] dark:bg-[#211c18]"
                key={item.id}
              >
                <span className="h-3 w-3 shrink-0 rounded-full bg-orange-500" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-black leading-5">{item.word}</h3>
                  <p className="truncate text-xs font-extrabold leading-4 text-[#6b6258] dark:text-[#b8aa9b]">
                    {item.translation || "Tradução pendente"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                    masteryBadgeClasses[item.masteryLevel]
                  }`}
                >
                  {masteryLabels[item.masteryLevel]}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function isMasteryLevel(value: unknown): value is MasteryLevel {
  return value === "new" || value === "learning" || value === "reviewing" || value === "mastered";
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: string;
  value: number;
  label: string;
}) {
  return (
    <article className="rounded-[18px] border border-[#ece4da] bg-white p-4 shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
      <p className="flex items-baseline gap-2 text-3xl font-black">
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
        {value}
      </p>
      <p className="mt-1 text-xs font-bold text-[#6b6258] dark:text-[#b8aa9b]">{label}</p>
    </article>
  );
}
