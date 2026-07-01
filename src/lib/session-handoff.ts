import type { Flashcard, LanguageCode } from "@/types";

/**
 * Handoff leve entre a sessão de estudo e o resumo / revisão de difíceis.
 *
 * As contagens da sessão já viajam pela query string, mas a lista de cards
 * marcados como "Não sei" (para SUM-06 listar e SUM-07 reestudar) é grande
 * demais para a URL. Guardamos esses cards em `sessionStorage`, escopados por
 * idioma, e lemos no resumo / na sessão de revisão de difíceis.
 */
function storageKey(targetLang: LanguageCode): string {
  return `cardsai:difficult:${targetLang}`;
}

export function saveDifficultCards(targetLang: LanguageCode, cards: Flashcard[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey(targetLang), JSON.stringify(cards));
  } catch {
    // sessionStorage indisponível (modo privado/quota): segue sem o handoff.
  }
}

export function loadDifficultCards(targetLang: LanguageCode): Flashcard[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(storageKey(targetLang));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Flashcard[]) : [];
  } catch {
    return [];
  }
}

export function clearDifficultCards(targetLang: LanguageCode): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(storageKey(targetLang));
  } catch {
    // ignora
  }
}
