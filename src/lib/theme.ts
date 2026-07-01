export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "cardsai-theme";

/**
 * Aplica o tema no <html> e espelha no localStorage. O localStorage e a fonte
 * usada pelo script inline do layout para evitar flash; o perfil no Firestore e
 * a fonte de verdade entre dispositivos.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("dark", theme === "dark");

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage indisponivel (modo privado): tema ainda aplica via classe.
  }
}

/** Script inline executado antes da pintura para evitar flash de tema. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;
