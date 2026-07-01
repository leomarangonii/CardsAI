"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Mascot } from "@/components/mascot";
import { StudyTextSelector } from "@/components/study/study-text-selector";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { generateStudyText } from "@/lib/firebase/functions";
import type { CandidateWord, StudyText, ThemeOption } from "@/types";

interface StudyTextLoaderProps {
  theme: ThemeOption;
}

export function StudyTextLoader({ theme }: StudyTextLoaderProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const [studyText, setStudyText] = useState<StudyText | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadText() {
      if (authLoading || !user || !profile) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await generateStudyText({
          themeId: theme.id,
          targetLang: profile.targetLang,
          nativeLang: profile.nativeLang,
          level: profile.level,
        });

        if (cancelled) {
          return;
        }

        setStudyText({
          id: result.textId,
          themeId: theme.id,
          targetLang: profile.targetLang,
          nativeLang: profile.nativeLang,
          level: profile.level,
          text: result.text,
          candidateWords: normalizeCandidates(result.candidateWords),
          addedWords: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (caughtError) {
        if (!cancelled) {
          setError(getFirebaseErrorMessage(caughtError, "Não foi possível gerar o texto agora."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadText();

    return () => {
      cancelled = true;
    };
  }, [authLoading, profile, theme.id, user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center text-center">
        <div className="flex max-w-sm flex-col items-center">
          <Mascot mood="thinking" size={104} className="mb-5" />
          <h1 className="text-2xl font-black">Gerando texto de {theme.label}...</h1>
          <p className="mt-2 text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
            A IA está preparando um texto curto para você descobrir vocabulário novo.
          </p>
        </div>
      </div>
    );
  }

  if (error || !studyText) {
    return (
      <div className="mx-auto max-w-lg rounded-[24px] border border-[#ece4da] bg-white p-6 text-center shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
        <Mascot mood="thinking" size={88} className="mx-auto mb-4" />
        <h1 className="text-2xl font-black">Texto indisponível</h1>
        <p className="mt-2 text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
          {error ?? "Tente novamente em alguns instantes."}
        </p>
        <Link
          className="mt-5 flex h-12 items-center justify-center rounded-2xl bg-orange-500 px-4 text-sm font-black text-white shadow-[0_5px_0_#d9531f]"
          href="/study"
        >
          Voltar para temas
        </Link>
      </div>
    );
  }

  return <StudyTextSelector studyText={studyText} theme={theme} />;
}

function normalizeCandidates(candidates: CandidateWord[]): CandidateWord[] {
  return candidates.map((candidate) => ({
    word: candidate.word,
    translation: candidate.translation,
    phonetic: candidate.phonetic ?? null,
    example: candidate.example ?? null,
    exampleTranslation: candidate.exampleTranslation ?? null,
    tip: candidate.tip ?? null,
    startIndex: candidate.startIndex ?? null,
    endIndex: candidate.endIndex ?? null,
  }));
}
