"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { LANGUAGES } from "@/lib/constants";
import { updateUserTargetLang } from "@/lib/firebase/user-profile";
import type { LanguageCode } from "@/types";

interface LanguageSwitcherProps {
  /** "surface" para fundos claros (cards/headers); "onAccent" para o card laranja. */
  variant?: "surface" | "onAccent";
  className?: string;
}

/**
 * Mostra o idioma alvo ativo (deck em estudo) e permite trocar direto na página,
 * persistindo no perfil. O snapshot do AuthProvider atualiza o resto da tela.
 */
export function LanguageSwitcher({ variant = "surface", className }: LanguageSwitcherProps) {
  const { user, profile } = useAuth();
  const [saving, setSaving] = useState(false);

  if (!user || !profile) {
    return null;
  }

  const uid = user.uid;
  const current = profile.targetLang;
  const nativeLang = profile.nativeLang;
  const options = LANGUAGES.filter((language) => language.code !== nativeLang);

  async function change(value: LanguageCode) {
    if (value === current || saving) {
      return;
    }

    setSaving(true);
    try {
      await updateUserTargetLang(uid, value);
    } catch (error) {
      console.error("Falha ao trocar idioma de estudo", error);
    } finally {
      setSaving(false);
    }
  }

  const onAccent = variant === "onAccent";
  const wrapClass = onAccent
    ? "border-white/40 bg-white/15 text-white"
    : "border-[#ece4da] bg-[#fff8ef] text-[#3a3028] dark:border-[#342c26] dark:bg-[#2b2420] dark:text-[#f4ede4]";
  const captionClass = onAccent ? "text-white/80" : "text-[#a89e93]";

  return (
    <label
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 ${wrapClass} ${
        saving ? "opacity-60" : ""
      } ${className ?? ""}`}
    >
      <span className="text-base" aria-hidden="true">
        🌐
      </span>
      <span className={`text-[10px] font-black uppercase tracking-[0.08em] ${captionClass}`}>
        Estudando
      </span>
      <select
        className="cursor-pointer bg-transparent text-sm font-black outline-none"
        value={current}
        onChange={(event) => change(event.target.value as LanguageCode)}
        disabled={saving}
        aria-label="Idioma de estudo"
      >
        {options.map((language) => (
          <option className="text-[#3a3028]" key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
