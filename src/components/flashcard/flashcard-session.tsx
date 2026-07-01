"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ANSWER_CONFIG } from "@/lib/constants";
import { getUserTimezone } from "@/lib/date";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { submitCardAnswer } from "@/lib/firebase/functions";
import { saveDifficultCards } from "@/lib/session-handoff";
import { FlashcardView } from "@/components/flashcard/flashcard-view";
import type { AnswerValue, Flashcard, LanguageCode } from "@/types";

interface FlashcardSessionProps {
  cards: Flashcard[];
  deckLabel: string;
  summaryHref: string;
  targetLang: LanguageCode;
}

export function FlashcardSession({
  cards,
  deckLabel,
  summaryHref,
  targetLang,
}: FlashcardSessionProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState<AnswerValue[]>([]);
  const [sessionXp, setSessionXp] = useState(0);
  const [syncingCount, setSyncingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [xpFloats, setXpFloats] = useState<{ id: number; amount: number }[]>([]);
  const answerLockRef = useRef(false);
  const floatIdRef = useRef(0);
  const mountedRef = useRef(true);
  const currentCard = cards[currentIndex];
  const progress = Math.round(((currentIndex + 1) / cards.length) * 100);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function answerCard(answer: AnswerValue) {
    if (answerLockRef.current) {
      return;
    }

    answerLockRef.current = true;
    setError(null);

    const answeredCard = currentCard;
    const localXp = ANSWER_CONFIG[answer].xp;
    const nextAnswers = [...answers, answer];
    const nextSessionXp = sessionXp + localXp;

    setAnswers(nextAnswers);
    setSessionXp(nextSessionXp);
    setFlipped(false);

    const floatId = (floatIdRef.current += 1);
    setXpFloats((floats) => [...floats, { id: floatId, amount: localXp }]);
    window.setTimeout(() => {
      if (mountedRef.current) {
        setXpFloats((floats) => floats.filter((item) => item.id !== floatId));
      }
    }, 900);

    if (currentIndex >= cards.length - 1) {
      const know = nextAnswers.filter((value) => value === "know").length;
      const almost = nextAnswers.filter((value) => value === "almost").length;
      const dont = nextAnswers.filter((value) => value === "dont").length;
      const difficultCards = cards.filter((_, index) => nextAnswers[index] === "dont");
      saveDifficultCards(targetLang, difficultCards);
      router.push(`${summaryHref}?know=${know}&almost=${almost}&dont=${dont}&xp=${nextSessionXp}`);
    } else {
      setCurrentIndex((index) => index + 1);
    }

    window.setTimeout(() => {
      answerLockRef.current = false;
    }, 160);

    setSyncingCount((count) => count + 1);
    submitCardAnswer({
        targetLang,
        cardId: answeredCard.id,
        answer,
        timezone: getUserTimezone(),
      })
      .catch((caughtError) => {
        if (mountedRef.current) {
          setError(getFirebaseErrorMessage(caughtError, "Não foi possível salvar sua resposta."));
        }
      })
      .finally(() => {
        if (mountedRef.current) {
          setSyncingCount((count) => Math.max(0, count - 1));
        }
      });
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-9rem)] max-w-5xl flex-col">
      {xpFloats.map((float) => (
        <span
          key={float.id}
          className="cardsai-xp-float pointer-events-none absolute bottom-32 left-1/2 z-50 rounded-full bg-amber-400 px-4 py-1.5 text-base font-black text-white shadow-[0_4px_12px_rgba(247,181,0,0.45)]"
        >
          +{float.amount} XP
        </span>
      ))}
      <header className="mb-5">
        <div className="mb-3 flex items-center gap-3">
          <Link
            aria-label="Sair da sessão"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4efe9] text-lg font-black text-[#6b6258] dark:bg-[#2b2420] dark:text-[#b8aa9b]"
            href="/study"
          >
            ×
          </Link>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#f4efe9] dark:bg-[#2b2420]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#36c46b] to-[#6fd98a]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-2 text-sm font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            ⚡ + {sessionXp}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm font-black text-[#6b6258] dark:text-[#b8aa9b]">
          <span>{deckLabel}</span>
          <span>
            {currentIndex + 1} de {cards.length}
          </span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center">
        <FlashcardView
          card={currentCard}
          flipped={flipped}
          onFlip={() => setFlipped((value) => !value)}
        />
      </div>

      {flipped ? (
        <>
          {error ? (
            <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </p>
          ) : syncingCount > 0 ? (
            <p className="mt-5 text-center text-xs font-black text-[#a89e93]">
              Sincronizando progresso...
            </p>
          ) : null}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {(["dont", "almost", "know"] as AnswerValue[]).map((answer) => (
            <button
              className={`flex min-h-16 flex-col items-center justify-center rounded-2xl px-2 text-sm font-black text-white shadow-[0_4px_0_rgba(0,0,0,0.18)] ${
                answer === "dont"
                  ? "bg-[#ff5a6a]"
                  : answer === "almost"
                    ? "bg-[#f7b500]"
                    : "bg-[#36c46b]"
              }`}
              key={answer}
              onClick={() => answerCard(answer)}
              type="button"
            >
              <span className="text-xl">{ANSWER_CONFIG[answer].emoji}</span>
              {ANSWER_CONFIG[answer].label}
            </button>
          ))}
        </div>
        </>
      ) : (
        <p className="mt-5 text-center text-sm font-bold text-[#a89e93]">
          Leia a palavra, tente lembrar, e toque no card.
        </p>
      )}
    </div>
  );
}
