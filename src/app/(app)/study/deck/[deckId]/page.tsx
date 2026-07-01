import { notFound } from "next/navigation";
import { FlashcardSessionLoader } from "@/components/flashcard/flashcard-session-loader";
import { getLanguageLabel, isSupportedTargetLang } from "@/lib/catalog";

export default async function DeckPage({
  params,
  searchParams,
}: {
  params: Promise<{ deckId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { deckId } = await params;
  const { source } = await searchParams;

  if (!isSupportedTargetLang(deckId)) {
    notFound();
  }

  const languageLabel = getLanguageLabel(deckId);
  const isDifficult = source === "difficult";

  return (
    <FlashcardSessionLoader
      deckLabel={
        isDifficult
          ? `Revisão de difíceis · ${languageLabel}`
          : `Deck pessoal · ${languageLabel}`
      }
      targetLang={deckId}
      source={isDifficult ? "difficult" : "deck"}
    />
  );
}
