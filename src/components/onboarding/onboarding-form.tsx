"use client";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Mascot } from "@/components/mascot";
import { LANGUAGES, LEVELS } from "@/lib/constants";
import { getUserTimezone } from "@/lib/date";
import { firebaseDb } from "@/lib/firebase/client";
import type { LanguageCode, ProficiencyLevel } from "@/types";

export function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();
  const [nativeLang, setNativeLang] = useState<LanguageCode>(profile?.nativeLang ?? "pt");
  const [targetLang, setTargetLang] = useState<LanguageCode>(profile?.targetLang ?? "en");
  const [level, setLevel] = useState<ProficiencyLevel>(profile?.level ?? "intermediate");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextPath = useMemo(() => {
    const next = searchParams.get("next");
    return next && next !== "/onboarding" ? next : "/study";
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/?next=${encodeURIComponent("/onboarding")}`);
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!loading && user && profile?.onboardingCompleted) {
      router.replace(nextPath);
    }
  }, [loading, nextPath, profile?.onboardingCompleted, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!user) {
      setError("Entre na sua conta para continuar.");
      return;
    }

    if (nativeLang === targetLang) {
      setError("Escolha idiomas diferentes para tradução e estudo.");
      return;
    }

    setSubmitting(true);

    try {
      await setDoc(
        doc(firebaseDb, "users", user.uid),
        {
          nativeLang,
          targetLang,
          level,
          onboardingCompleted: true,
          timezone: getUserTimezone(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      router.replace(nextPath);
    } catch {
      setError("Não foi possível salvar suas preferências agora.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNativeLangChange(language: LanguageCode) {
    setNativeLang(language);

    if (language === targetLang) {
      setTargetLang(LANGUAGES.find((item) => item.code !== language)?.code ?? "en");
    }
  }

  if (loading || !user || profile?.onboardingCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8ef] text-[#251f1c] dark:bg-[#17110e] dark:text-[#fff8ef]">
        <div className="flex flex-col items-center text-center">
          <Mascot mood="thinking" size={88} className="mb-4" />
          <p className="text-sm font-black text-[#6f6259] dark:text-[#d8c8bc]">
            Preparando sua experiência...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8ef] px-5 py-8 text-[#251f1c] dark:bg-[#17110e] dark:text-[#fff8ef]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col justify-center">
        <div className="mb-7 flex items-center gap-4">
          <Mascot mood="wave" size={78} />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.08em] text-orange-500">
              Primeiro acesso
            </p>
            <h1 className="text-3xl font-black leading-tight">Vamos configurar seu estudo</h1>
          </div>
        </div>

        <form
          className="rounded-[24px] border border-[#eadfd3] bg-white p-5 shadow-[0_12px_35px_rgba(72,45,24,0.08)] dark:border-[#352821] dark:bg-[#211814]"
          onSubmit={handleSubmit}
        >
          <FieldLabel title="Qual é sua língua nativa?">
            <LanguageGrid selected={nativeLang} onSelect={handleNativeLangChange} />
          </FieldLabel>

          <FieldLabel title="Qual idioma você quer aprender agora?">
            <LanguageGrid excluded={nativeLang} selected={targetLang} onSelect={setTargetLang} />
          </FieldLabel>

          <FieldLabel title="Qual nível combina com você?">
            <div className="grid gap-3 sm:grid-cols-3">
              {LEVELS.map((item) => (
                <button
                  className={`rounded-[18px] border p-4 text-left transition ${
                    level === item.id
                      ? "border-orange-500 bg-orange-50 text-orange-700 shadow-[0_4px_0_#ffb27f] dark:bg-orange-950/30 dark:text-orange-300"
                      : "border-[#eadfd3] bg-[#fffaf4] dark:border-[#3d3028] dark:bg-[#2a211c]"
                  }`}
                  key={item.id}
                  onClick={() => setLevel(item.id)}
                  type="button"
                >
                  <span className="text-xl" aria-hidden="true">
                    {item.icon}
                  </span>
                  <strong className="mt-2 block text-sm font-black">{item.label}</strong>
                  <span className="mt-1 block text-xs font-bold text-[#6f6259] dark:text-[#d8c8bc]">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
          </FieldLabel>

          {error ? (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          <button
            className="mt-5 h-14 w-full rounded-2xl bg-orange-500 px-4 text-base font-black text-white shadow-[0_5px_0_#d94a22] transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/25 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Salvando..." : "Começar a estudar"}
          </button>
        </form>
      </section>
    </main>
  );
}

function FieldLabel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mb-6 last:mb-0">
      <legend className="mb-3 text-sm font-black">{title}</legend>
      {children}
    </fieldset>
  );
}

function LanguageGrid({
  excluded,
  selected,
  onSelect,
}: {
  excluded?: LanguageCode;
  selected: LanguageCode;
  onSelect: (language: LanguageCode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {LANGUAGES.filter((language) => language.code !== excluded).map((language) => (
        <button
          className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-left transition ${
            selected === language.code
              ? "border-orange-500 bg-orange-50 text-orange-700 shadow-[0_4px_0_#ffb27f] dark:bg-orange-950/30 dark:text-orange-300"
              : "border-[#eadfd3] bg-[#fffaf4] dark:border-[#3d3028] dark:bg-[#2a211c]"
          }`}
          key={language.code}
          onClick={() => onSelect(language.code)}
          type="button"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black dark:bg-[#3a2d26]">
            {language.shortLabel}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-black">{language.label}</strong>
            <span className="block truncate text-xs font-bold text-[#6f6259] dark:text-[#d8c8bc]">
              {language.nativeLabel}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
