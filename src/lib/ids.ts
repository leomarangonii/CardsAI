import type { LanguageCode } from "@/types";

export function buildDeckCacheKey({
  themeId,
  targetLang,
  nativeLang,
  level,
}: {
  themeId: string;
  targetLang: LanguageCode;
  nativeLang: LanguageCode;
  level: string;
}): string {
  return `${themeId}_${targetLang}_${nativeLang}_${level}`;
}

export function normalizeWord(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function buildWordProgressId({
  word,
  targetLang,
}: {
  word: string;
  targetLang: LanguageCode;
}): string {
  return `${targetLang}_${normalizeWord(word).replace(/[^a-z0-9]+/gi, "-")}`;
}
