"use client";

import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Mascot } from "@/components/mascot";
import { LanguageSwitcher } from "@/components/study/language-switcher";
import { SectionTitle } from "@/components/ui/section-title";
import { ThemeCard } from "@/components/ui/theme-card";
import { THEMES } from "@/lib/constants";
import { getLanguageLabel } from "@/lib/catalog";
import { firebaseDb } from "@/lib/firebase/client";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { getReviewCards } from "@/lib/firebase/functions";

interface ThemeStat {
  studied: number;
  total: number;
}

export function StudyHome() {
  const { user, profile, loading: authLoading } = useAuth();
  const [dueCount, setDueCount] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeStats, setThemeStats] = useState<Record<string, ThemeStat>>({});
  const firstName = user?.displayName?.split(" ")[0] ?? "você";
  const targetLang = profile?.targetLang ?? "en";
  const targetLabel = getLanguageLabel(targetLang);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      if (authLoading || !user || !profile) {
        return;
      }

      setReviewLoading(true);
      setError(null);

      try {
        const result = await getReviewCards({ targetLang: profile.targetLang, limit: 20 });

        if (!cancelled) {
          setDueCount(result.count);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(getFirebaseErrorMessage(caughtError, "Não foi possível carregar revisões."));
        }
      } finally {
        if (!cancelled) {
          setReviewLoading(false);
        }
      }
    }

    void loadReviews();

    return () => {
      cancelled = true;
    };
  }, [authLoading, profile, user]);

  // Conta, por tema, quantas palavras estão dominadas vs. total no deck (THM-04).
  useEffect(() => {
    if (!user || !profile) {
      return;
    }

    const unsubscribe = onSnapshot(
      collection(firebaseDb, "users", user.uid, "languageDecks", profile.targetLang, "cards"),
      (snapshot) => {
        const stats: Record<string, ThemeStat> = {};

        for (const cardDoc of snapshot.docs) {
          const data = cardDoc.data();
          const themeId = typeof data.sourceThemeId === "string" ? data.sourceThemeId : null;
          if (!themeId) {
            continue;
          }

          const entry = stats[themeId] ?? { studied: 0, total: 0 };
          entry.total += 1;
          if (data.masteryLevel === "mastered") {
            entry.studied += 1;
          }
          stats[themeId] = entry;
        }

        setThemeStats(stats);
      },
    );

    return () => unsubscribe();
  }, [profile, user]);

  return (
    <div>
      <section className="mb-4 flex items-center gap-4 lg:hidden">
        <Mascot mood="wave" size={64} />
        <div>
          <p className="text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
            Bom te ver de novo,
          </p>
          <h1 className="text-2xl font-black">{firstName} 👋</h1>
        </div>
      </section>

      <div className="mb-6 flex lg:hidden">
        <LanguageSwitcher variant="surface" className="ml-auto" />
      </div>

      <section className="mb-7 hidden items-center justify-between gap-6 lg:flex">
        <div>
          <p className="text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
            Bom te ver de novo, {firstName}
          </p>
          <h1 className="text-3xl font-black">Estudar</h1>
        </div>
        <LanguageSwitcher variant="surface" />
      </section>

      <section className="mb-7 overflow-hidden rounded-[24px] bg-gradient-to-br from-orange-500 to-[#ff8a4c] p-5 text-white shadow-[0_16px_35px_rgba(255,107,53,0.32)] lg:flex lg:items-center lg:gap-5">
        <div className="flex items-center gap-4">
          <Mascot mood="happy" size={70} />
          <div>
            <p className="text-2xl font-black leading-tight">
              {reviewLoading ? "Carregando" : dueCount} palavras para
              <br className="sm:hidden" /> revisar hoje
            </p>
            <p className="mt-1 text-sm font-bold text-white/90">
              {error ?? `Seu deck pessoal de ${targetLabel} está sincronizado.`}
            </p>
          </div>
        </div>
        <Link
          className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-orange-600 shadow-[0_4px_0_rgba(0,0,0,0.12)] lg:ml-auto lg:mt-0 lg:w-auto lg:min-w-48"
          href={`/study/deck/${targetLang}`}
        >
          Revisar agora
        </Link>
      </section>

      <SectionTitle>Escolha um tema para estudar</SectionTitle>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {THEMES.map((theme) => {
          const stat = themeStats[theme.id] ?? { studied: 0, total: 0 };
          return (
            <ThemeCard key={theme.id} theme={theme} studied={stat.studied} total={stat.total} />
          );
        })}
      </section>
    </div>
  );
}
