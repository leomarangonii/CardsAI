"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/mascot";
import { FlashcardSession } from "@/components/flashcard/flashcard-session";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { createStudySession } from "@/lib/firebase/functions";
import { loadDifficultCards } from "@/lib/session-handoff";
import type { Flashcard, LanguageCode } from "@/types";

interface FlashcardSessionLoaderProps {
  targetLang: LanguageCode;
  deckLabel: string;
  /** "deck" monta a sessão via backend; "difficult" reestuda as palavras "Não sei" da sessão anterior. */
  source?: "deck" | "difficult";
}

export function FlashcardSessionLoader({
  targetLang,
  deckLabel,
  source = "deck",
}: FlashcardSessionLoaderProps) {
  const { user, loading: authLoading } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      if (authLoading || !user) {
        return;
      }

      // Revisão de difíceis usa os cards guardados no handoff da sessão anterior,
      // sem nova chamada ao backend.
      if (source === "difficult") {
        setCards(loadDifficultCards(targetLang));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const session = await createStudySession({
          targetLang,
          mode: "mixed",
          limit: 10,
        });

        if (!cancelled) {
          setCards(session.cards);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(getFirebaseErrorMessage(caughtError, "Não foi possível carregar sua sessão."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [authLoading, source, targetLang, user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center text-center">
        <div className="flex max-w-sm flex-col items-center">
          <Mascot mood="thinking" size={104} className="mb-5" />
          <h1 className="text-2xl font-black">Carregando seu deck...</h1>
          <p className="mt-2 text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
            Estamos buscando suas revisões e palavras novas.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return <DeckState title="Sessão indisponível" description={error} />;
  }

  if (cards.length === 0) {
    return (
      <DeckState
        title="Nada para revisar agora"
        description="Seu deck não tem palavras vencidas pelo SM-2 neste momento. Leia um novo texto para adicionar palavras ou volte quando a próxima revisão estiver disponível."
      />
    );
  }

  return (
    <FlashcardSession
      cards={cards}
      deckLabel={deckLabel}
      summaryHref={`/study/summary/${targetLang}`}
      targetLang={targetLang}
    />
  );
}

function DeckState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-[24px] border border-[#ece4da] bg-white p-6 text-center shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
      <Mascot mood="thinking" size={88} className="mx-auto mb-4" />
      <h1 className="text-2xl font-black">{title}</h1>
      <p className="mt-2 text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
        {description}
      </p>
      <Link
        className="mt-5 flex h-12 items-center justify-center rounded-2xl bg-orange-500 px-4 text-sm font-black text-white shadow-[0_5px_0_#d9531f]"
        href="/study"
      >
        Escolher tema
      </Link>
    </div>
  );
}
