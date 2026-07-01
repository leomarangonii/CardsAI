"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { firebaseAuth } from "@/lib/firebase/client";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { deleteAccount } from "@/lib/firebase/functions";

const CONFIRM_WORD = "DELETAR";

export function DeleteAccount() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmText.trim().toUpperCase() !== CONFIRM_WORD || deleting) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteAccount();
      await signOut(firebaseAuth);
      router.replace("/");
    } catch (caughtError) {
      setError(getFirebaseErrorMessage(caughtError, "Não foi possível deletar a conta."));
      setDeleting(false);
    }
  }

  return (
    <section className="mb-6">
      <h2 className="mb-3 px-1 text-xs font-black uppercase tracking-[0.08em] text-rose-500">
        Zona de risco
      </h2>
      <div className="rounded-[20px] border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-950/60 dark:bg-rose-950/20">
        <h3 className="text-sm font-black text-rose-700 dark:text-rose-300">Deletar conta</h3>
        <p className="mt-1 text-xs font-bold text-rose-600/80 dark:text-rose-300/70">
          Remove sua conta e todos os dados (decks, palavras, progresso e XP). Esta ação é
          permanente e não pode ser desfeita.
        </p>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 rounded-2xl border border-rose-300 bg-white px-4 py-2 text-xs font-black text-rose-700 shadow-[0_3px_0_#fecdd3] dark:border-rose-900 dark:bg-[#2b1d1d] dark:text-rose-300 dark:shadow-[0_3px_0_#7f1d1d]"
          >
            Deletar minha conta
          </button>
        ) : (
          <div className="mt-4">
            <label className="block text-xs font-bold text-rose-600 dark:text-rose-300/80">
              Digite <span className="font-black">{CONFIRM_WORD}</span> para confirmar:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm font-black outline-none focus:border-rose-500 dark:border-rose-900 dark:bg-[#2b1d1d]"
            />

            {error ? (
              <p className="mt-2 text-xs font-bold text-rose-700 dark:text-rose-300">{error}</p>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setConfirmText("");
                  setError(null);
                }}
                disabled={deleting}
                className="rounded-2xl border border-[#ece4da] bg-white px-4 py-2 text-xs font-black disabled:opacity-60 dark:border-[#342c26] dark:bg-[#2b2420]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || confirmText.trim().toUpperCase() !== CONFIRM_WORD}
                className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-black text-white shadow-[0_3px_0_#9f1239] disabled:opacity-50"
              >
                {deleting ? "Deletando…" : "Deletar definitivamente"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
