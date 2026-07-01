"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { firebaseAuth } from "@/lib/firebase/client";

export function UserSettingsCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const displayName = user?.displayName ?? "Usuário CardsAI";
  const email = user?.email ?? "email não disponível";
  const initial = displayName.trim().charAt(0).toLocaleUpperCase() || "C";

  async function handleSignOut() {
    setSigningOut(true);
    await signOut(firebaseAuth);
    router.replace("/");
  }

  return (
    <section className="mb-6 flex items-center gap-4 rounded-[22px] border border-[#ece4da] bg-white p-4 shadow-[0_10px_24px_rgba(95,70,40,0.07)] dark:border-[#342c26] dark:bg-[#211c18]">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-[#f7b801] text-2xl font-black text-white">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xl font-black">{displayName}</h2>
        <p className="truncate text-sm font-bold text-[#6b6258] dark:text-[#b8aa9b]">{email}</p>
      </div>
      <button
        className="rounded-2xl border border-[#ece4da] bg-white px-4 py-2 text-xs font-black text-orange-600 shadow-[0_3px_0_#ece4da] disabled:opacity-60 dark:border-[#342c26] dark:bg-[#2b2420] dark:shadow-[0_3px_0_#342c26]"
        disabled={signingOut}
        onClick={handleSignOut}
        type="button"
      >
        {signingOut ? "Saindo..." : "Sair"}
      </button>
    </section>
  );
}
