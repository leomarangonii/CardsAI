"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { getLanguageLabel } from "@/lib/catalog";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { addWordToLanguageDeck } from "@/lib/firebase/functions";
import type { CandidateWord, StudyText, ThemeOption } from "@/types";

interface StudyTextSelectorProps {
  studyText: StudyText;
  theme: ThemeOption;
}

interface SelectionPopup {
  term: string;
  translation: string;
  x: number;
  y: number;
}

function normalizeTerm(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[.,!?;:()"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Verdadeiro se `needle` aparece em `haystack` como sequência de tokens inteiros. */
function phraseContains(haystack: string, needle: string) {
  if (!needle) {
    return false;
  }
  if (haystack === needle) {
    return true;
  }
  // Espaços nas bordas garantem limite de palavra: " compartir " não contém " a ".
  return ` ${haystack} `.includes(` ${needle} `);
}

function findCandidate(term: string, candidates: CandidateWord[]) {
  const normalizedTerm = normalizeTerm(term);

  if (!normalizedTerm) {
    return undefined;
  }

  // 1. Correspondência exata tem prioridade sobre qualquer candidato.
  const exact = candidates.find(
    (candidate) => normalizeTerm(candidate.word) === normalizedTerm,
  );
  if (exact) {
    return exact;
  }

  // 2. Candidatos contidos na seleção (palavra inteira): escolhe o mais
  //    específico, isto é, o mais longo. Assim "Las redes sociales" casa
  //    "redes sociales", não o artigo "las".
  let best: CandidateWord | undefined;
  let bestLength = 0;
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeTerm(candidate.word);
    if (phraseContains(normalizedTerm, normalizedCandidate) && normalizedCandidate.length > bestLength) {
      best = candidate;
      bestLength = normalizedCandidate.length;
    }
  }
  if (best) {
    return best;
  }

  // 3. Seleção é uma sub-expressão (palavra inteira) de um candidato maior.
  return candidates.find((candidate) =>
    phraseContains(normalizeTerm(candidate.word), normalizedTerm),
  );
}

export function StudyTextSelector({ studyText, theme }: StudyTextSelectorProps) {
  const articleRef = useRef<HTMLParagraphElement>(null);
  const initialWords = useMemo(() => new Set(studyText.addedWords), [studyText.addedWords]);
  const [addedWords, setAddedWords] = useState(initialWords);
  const [popup, setPopup] = useState<SelectionPopup | null>(null);
  const [pendingWords, setPendingWords] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const targetLanguageLabel = getLanguageLabel(studyText.targetLang);

  async function addWord(term: string) {
    const word = term.trim();
    const candidate = findCandidate(word, studyText.candidateWords);
    const displayWord = candidate?.word ?? word;
    const wasAlreadyAdded = addedWords.has(displayWord);

    if (!word || pendingWords.has(displayWord)) {
      return;
    }

    setAddedWords((current) => {
      const next = new Set(current);
      next.add(displayWord);
      return next;
    });
    setPendingWords((current) => {
      const next = new Set(current);
      next.add(displayWord);
      return next;
    });
    setPopup(null);
    setStatus(null);
    setError(null);

    try {
      const result = await addWordToLanguageDeck({
        textId: studyText.id,
        sourceThemeId: studyText.themeId,
        targetLang: studyText.targetLang,
        nativeLang: studyText.nativeLang,
        word,
        translation: candidate?.translation,
      });

      setAddedWords((current) => {
        const next = new Set(current);
        next.delete(displayWord);
        next.add(result.card.word);
        return next;
      });
      setStatus(result.created ? "Palavra adicionada ao deck." : "Essa palavra já estava no deck.");
    } catch (caughtError) {
      if (!wasAlreadyAdded) {
        setAddedWords((current) => {
          const next = new Set(current);
          next.delete(displayWord);
          return next;
        });
      }
      setError(getFirebaseErrorMessage(caughtError, "Não foi possível adicionar a palavra ao deck."));
    } finally {
      setPendingWords((current) => {
        const next = new Set(current);
        next.delete(displayWord);
        return next;
      });
    }
  }

  function handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    const anchorNode = selection?.anchorNode;

    if (!selection || !selectedText || !anchorNode || !articleRef.current?.contains(anchorNode)) {
      setPopup(null);
      return;
    }

    if (selectedText.length > 48) {
      setPopup(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const candidate = findCandidate(selectedText, studyText.candidateWords);

    setPopup({
      term: selectedText,
      translation: candidate?.translation ?? "Tradução será gerada pela IA",
      x: rect.left + rect.width / 2,
      y: Math.max(rect.top - 12, 12),
    });
  }

  const addedWordList = Array.from(addedWords);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <Link
          className="text-sm font-black text-orange-600 hover:text-orange-700"
          href="/study"
        >
          ← Trocar tema
        </Link>
      </div>

      <section className="mb-5 rounded-[24px] border border-[#ece4da] bg-white p-5 shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
        <p className="text-sm font-black text-orange-500">
          {theme.emoji} {theme.label}
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight">
          Selecione palavras novas no texto
        </h1>
        <p className="mt-3 text-sm font-bold leading-6 text-[#6b6258] dark:text-[#d8c8bc]">
          Marque uma palavra ou expressão com o mouse/toque. O CardsAI mostra a tradução e
          adiciona ao seu deck pessoal de {targetLanguageLabel}.
        </p>
        <p
          className="mt-5 select-text rounded-[20px] bg-[#fff8ef] p-4 text-base font-bold leading-8 text-[#3a3028] dark:bg-[#2b2420] dark:text-[#f4ede4]"
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
          ref={articleRef}
        >
          {studyText.text}
        </p>
      </section>

      {popup ? (
        <div
          className="fixed z-50 w-[min(280px,calc(100vw-32px))] -translate-x-1/2 -translate-y-full rounded-2xl border border-[#ece4da] bg-white p-4 text-left shadow-[0_18px_40px_rgba(45,30,20,0.2)] dark:border-[#342c26] dark:bg-[#211c18]"
          style={{ left: popup.x, top: popup.y }}
        >
          <p className="text-xs font-black uppercase text-orange-500">Adicionar ao deck</p>
          <p className="mt-1 text-lg font-black">{popup.term}</p>
          <p className="mt-1 text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
            {popup.translation}
          </p>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <button
              className="h-10 rounded-xl bg-orange-500 px-3 text-sm font-black text-white shadow-[0_3px_0_#d9531f] disabled:opacity-60"
              disabled={pendingWords.has(popup.term)}
              onClick={() => addWord(popup.term)}
              type="button"
            >
              Adicionar
            </button>
            <button
              aria-label="Fechar tradução"
              className="h-10 w-10 rounded-xl bg-[#f4efe9] text-sm font-black dark:bg-[#2b2420]"
              onClick={() => setPopup(null)}
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-[24px] border border-[#ece4da] bg-white p-5 shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Seu deck pessoal</h2>
            <p className="mt-1 text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
              {addedWords.size} palavras no deck de {targetLanguageLabel}.
            </p>
          </div>
        </div>

        {status ? (
          <p className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700 dark:bg-green-950/30 dark:text-green-300">
            {status}
          </p>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        <div className="mb-5 flex flex-wrap gap-2">
          {addedWordList.map((word) => (
            <span
              className="rounded-full bg-orange-100 px-3 py-2 text-sm font-black text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
              key={word}
            >
              {word}
            </span>
          ))}
        </div>

        <div className="mb-5">
          <p className="mb-2 text-xs font-black uppercase text-[#a89e93]">Sugestões da IA</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {studyText.candidateWords.map((candidate) => {
              const isAdded = addedWords.has(candidate.word);
              const isPending = pendingWords.has(candidate.word);

              return (
                <button
                  className={`rounded-2xl border-2 px-4 py-3 text-left transition ${
                    isAdded
                      ? "border-orange-500 bg-orange-50 shadow-[0_4px_0_#d9531f] dark:bg-orange-950/30"
                      : "border-[#ece4da] bg-white shadow-[0_4px_0_#ece4da] hover:border-orange-400 dark:border-[#342c26] dark:bg-[#211c18] dark:shadow-[0_4px_0_#342c26]"
                  }`}
                  key={candidate.word}
                  disabled={isPending}
                  onClick={() => addWord(candidate.word)}
                  type="button"
                >
                  <span className="block text-base font-black">{candidate.word}</span>
                  <span className="mt-1 block text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">
                    {isPending ? "Sincronizando..." : candidate.translation}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
          <Link
            className="flex h-14 items-center justify-center rounded-2xl border border-[#ece4da] bg-white px-4 text-sm font-black shadow-[0_4px_0_#ece4da] dark:border-[#342c26] dark:bg-[#2b2420] dark:shadow-[0_4px_0_#342c26]"
            href="/study"
          >
            Ler outro texto
          </Link>
          <Link
            className="flex h-14 items-center justify-center rounded-2xl bg-orange-500 px-4 text-sm font-black text-white shadow-[0_5px_0_#d9531f]"
            href={`/study/preparing/${studyText.targetLang}`}
          >
            Estudar deck de {targetLanguageLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
