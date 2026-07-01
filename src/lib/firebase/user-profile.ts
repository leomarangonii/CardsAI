"use client";

import { doc, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getUserTimezone } from "@/lib/date";
import { firebaseDb } from "@/lib/firebase/client";
import {
  DEFAULT_LEVEL,
  DEFAULT_NATIVE_LANG,
  DEFAULT_TARGET_LANG,
} from "@/lib/learning-defaults";
import type { Theme } from "@/lib/theme";
import type { LanguageCode, ProficiencyLevel } from "@/types";

export async function updateUserTheme(uid: string, theme: Theme) {
  await setDoc(
    doc(firebaseDb, "users", uid),
    { theme, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export interface LearningPreferences {
  targetLang: LanguageCode;
  nativeLang: LanguageCode;
  level: ProficiencyLevel;
}

/**
 * Atualiza idioma alvo, idioma nativo e nível (CFG-01/02/03). Progresso e cards
 * existentes são preservados — só as preferências do perfil mudam.
 */
export async function updateUserLearning(uid: string, prefs: LearningPreferences) {
  await setDoc(
    doc(firebaseDb, "users", uid),
    { ...prefs, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Troca apenas o idioma alvo (deck de estudo ativo). Usado nos seletores de Estudar/Progresso. */
export async function updateUserTargetLang(uid: string, targetLang: LanguageCode) {
  await setDoc(
    doc(firebaseDb, "users", uid),
    { targetLang, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function ensureUserProfile(user: User) {
  const userRef = doc(firebaseDb, "users", user.uid);

  await runTransaction(firebaseDb, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const baseProfile = {
      displayName: user.displayName ?? "Usuário CardsAI",
      email: user.email ?? "",
      photoURL: user.photoURL ?? null,
      timezone: getUserTimezone(),
      updatedAt: serverTimestamp(),
    };

    if (snapshot.exists()) {
      transaction.set(userRef, baseProfile, { merge: true });
      return;
    }

    transaction.set(userRef, {
      ...baseProfile,
      nativeLang: DEFAULT_NATIVE_LANG,
      targetLang: DEFAULT_TARGET_LANG,
      level: DEFAULT_LEVEL,
      onboardingCompleted: false,
      theme: "light",
      xpTotal: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: null,
      lastStudyLocalDate: null,
      totalCardsStudied: 0,
      totalDecksCompleted: 0,
      createdAt: serverTimestamp(),
    });
  });
}
