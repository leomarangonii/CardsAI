"use client";

import { useState } from "react";
import { LANGUAGES, LEVELS } from "@/lib/constants";
import { updateUserLearning } from "@/lib/firebase/user-profile";
import type { LanguageCode, ProficiencyLevel } from "@/types";

interface LearningSettingsProps {
  uid: string;
  targetLang: LanguageCode;
  nativeLang: LanguageCode;
  level: ProficiencyLevel;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function LearningSettings({
  uid,
  targetLang: initialTarget,
  nativeLang: initialNative,
  level: initialLevel,
}: LearningSettingsProps) {
  const [targetLang, setTargetLang] = useState<LanguageCode>(initialTarget);
  const [nativeLang, setNativeLang] = useState<LanguageCode>(initialNative);
  const [level, setLevel] = useState<ProficiencyLevel>(initialLevel);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function persist(next: {
    targetLang: LanguageCode;
    nativeLang: LanguageCode;
    level: ProficiencyLevel;
  }) {
    setSaveState("saving");
    try {
      await updateUserLearning(uid, next);
      setSaveState("saved");
      window.setTimeout(() => setSaveState((state) => (state === "saved" ? "idle" : state)), 2000);
    } catch (error) {
      console.error("Falha ao salvar preferências", error);
      setSaveState("error");
    }
  }

  function changeTarget(value: LanguageCode) {
    // Idioma alvo não pode ser igual ao nativo (ONB-02).
    const nextNative = value === nativeLang ? initialTarget : nativeLang;
    setTargetLang(value);
    setNativeLang(nextNative);
    void persist({ targetLang: value, nativeLang: nextNative, level });
  }

  function changeNative(value: LanguageCode) {
    const nextTarget = value === targetLang ? initialNative : targetLang;
    setNativeLang(value);
    setTargetLang(nextTarget);
    void persist({ targetLang: nextTarget, nativeLang: value, level });
  }

  function changeLevel(value: ProficiencyLevel) {
    setLevel(value);
    void persist({ targetLang, nativeLang, level: value });
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#a89e93]">
          Aprendizado
        </h2>
        <SaveBadge state={saveState} />
      </div>
      <div className="overflow-hidden rounded-[20px] border border-[#ece4da] bg-white shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
        <SelectRow
          icon="🎯"
          title="Idioma alvo"
          subtitle="O que você está aprendendo"
          value={targetLang}
          onChange={(value) => changeTarget(value as LanguageCode)}
          options={LANGUAGES.filter((language) => language.code !== nativeLang).map((language) => ({
            value: language.code,
            label: language.label,
          }))}
        />
        <SelectRow
          icon="💬"
          title="Idioma nativo"
          subtitle="Usado em traduções e dicas"
          value={nativeLang}
          onChange={(value) => changeNative(value as LanguageCode)}
          options={LANGUAGES.filter((language) => language.code !== targetLang).map((language) => ({
            value: language.code,
            label: language.label,
          }))}
        />
        <SelectRow
          icon={LEVELS.find((item) => item.id === level)?.icon ?? "🌿"}
          title="Nível"
          subtitle="Dificuldade dos próximos textos"
          value={level}
          onChange={(value) => changeLevel(value as ProficiencyLevel)}
          options={LEVELS.map((item) => ({ value: item.id, label: item.label }))}
        />
      </div>
    </section>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === "saving") {
    return <span className="text-xs font-black text-[#a89e93]">Salvando…</span>;
  }
  if (state === "saved") {
    return <span className="text-xs font-black text-green-600">Salvo ✓</span>;
  }
  if (state === "error") {
    return <span className="text-xs font-black text-rose-600">Erro ao salvar</span>;
  }
  return null;
}

function SelectRow({
  icon,
  title,
  subtitle,
  value,
  options,
  onChange,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-[#ece4da] p-4 last:border-b-0 dark:border-[#342c26]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4efe9] text-lg dark:bg-[#2b2420]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black">{title}</h3>
        <p className="text-xs font-bold text-[#6b6258] dark:text-[#b8aa9b]">{subtitle}</p>
      </div>
      <select
        className="rounded-xl border border-[#ece4da] bg-[#fff8ef] px-3 py-2 text-sm font-black text-orange-600 outline-none focus:border-orange-400 dark:border-[#342c26] dark:bg-[#2b2420] dark:text-orange-300"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={title}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
