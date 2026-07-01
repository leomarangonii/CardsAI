import { LANGUAGES, THEMES } from "@/lib/constants";
import type { LanguageCode, ThemeId, ThemeOption } from "@/types";

export function isThemeId(value: string): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function getThemeById(themeId: ThemeId): ThemeOption {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];
}

export function isSupportedTargetLang(value: string): value is LanguageCode {
  return LANGUAGES.some((language) => language.code === value);
}

export function getLanguageLabel(languageCode: LanguageCode): string {
  return LANGUAGES.find((language) => language.code === languageCode)?.label ?? languageCode;
}
