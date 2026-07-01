import { notFound } from "next/navigation";
import { SessionSummary } from "@/components/study/session-summary";
import { getLanguageLabel, isSupportedTargetLang } from "@/lib/catalog";

export default async function SummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ deckId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { deckId } = await params;
  const query = await searchParams;

  if (!isSupportedTargetLang(deckId)) {
    notFound();
  }

  return (
    <SessionSummary
      targetLang={deckId}
      languageLabel={getLanguageLabel(deckId)}
      knowCount={numberQuery(query.know)}
      almostCount={numberQuery(query.almost)}
      dontCount={numberQuery(query.dont)}
      xpEarned={numberQuery(query.xp)}
    />
  );
}

function numberQuery(value: string | string[] | undefined): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
