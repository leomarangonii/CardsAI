"use client";

import { useState } from "react";
import { UserSettingsCard } from "@/components/auth/user-settings-card";
import { useAuth } from "@/components/auth/auth-provider";
import { DeleteAccount } from "@/components/settings/delete-account";
import { LearningSettings } from "@/components/settings/learning-settings";
import { updateUserTheme } from "@/lib/firebase/user-profile";
import { applyTheme, type Theme } from "@/lib/theme";

export default function SettingsPage() {
  const { user, profile } = useAuth();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-black">Configurações</h1>
      </header>

      <UserSettingsCard />

      {user && profile ? (
        <LearningSettings
          uid={user.uid}
          targetLang={profile.targetLang}
          nativeLang={profile.nativeLang}
          level={profile.level}
        />
      ) : (
        <p className="mb-6 px-1 text-sm font-bold text-[#a89e93]">Carregando preferências…</p>
      )}

      <SettingsGroup title="Aparência">
        <DarkModeRow uid={user?.uid ?? null} theme={profile?.theme ?? "light"} />
      </SettingsGroup>

      <DeleteAccount />
    </div>
  );
}

function DarkModeRow({ uid, theme }: { uid: string | null; theme: Theme }) {
  const [saving, setSaving] = useState(false);
  const isDark = theme === "dark";

  async function toggle() {
    if (!uid || saving) {
      return;
    }

    const next: Theme = isDark ? "light" : "dark";
    applyTheme(next); // feedback imediato; perfil confirma via snapshot
    setSaving(true);

    try {
      await updateUserTheme(uid, next);
    } catch (error) {
      console.error("Falha ao salvar tema", error);
      applyTheme(theme); // reverte em caso de erro
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-4 border-b border-[#ece4da] p-4 last:border-b-0 dark:border-[#342c26]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4efe9] text-lg dark:bg-[#2b2420]">
        🌙
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-black">Modo escuro</h3>
        <p className="text-xs font-bold text-[#6b6258] dark:text-[#b8aa9b]">Tema da interface</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Alternar modo escuro"
        onClick={toggle}
        disabled={!uid || saving}
        className={`relative h-8 w-14 rounded-full border transition-colors disabled:opacity-60 ${
          isDark
            ? "border-orange-500 bg-orange-500"
            : "border-[#ece4da] bg-[#f4efe9] dark:border-[#342c26]"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
            isDark ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 px-1 text-xs font-black uppercase tracking-[0.08em] text-[#a89e93]">
        {title}
      </h2>
      <div className="overflow-hidden rounded-[20px] border border-[#ece4da] bg-white shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
        {children}
      </div>
    </section>
  );
}
