"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { firebaseAuth, firebaseDb } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/firebase/user-profile";
import { applyTheme } from "@/lib/theme";
import {
  DEFAULT_LEVEL,
  DEFAULT_NATIVE_LANG,
  DEFAULT_TARGET_LANG,
} from "@/lib/learning-defaults";
import type { CardsAIUserProfile, LanguageCode, ProficiencyLevel } from "@/types";

interface AuthState {
  user: User | null;
  profile: CardsAIUserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CardsAIUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (nextUser) => {
      setLoading(true);
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;

      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(nextUser);

      try {
        await ensureUserProfile(nextUser);
      } catch (error) {
        console.error("Failed to ensure user profile", error);
      }

      unsubscribeProfile = onSnapshot(
        doc(firebaseDb, "users", nextUser.uid),
        (snapshot) => {
          setProfile(normalizeProfile(nextUser, snapshot.data()));
          setLoading(false);
        },
        (error) => {
          console.error("Failed to subscribe to user profile", error);
          setProfile(null);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  // Perfil e a fonte de verdade do tema entre dispositivos; aplica ao carregar.
  const profileTheme = profile?.theme ?? null;
  useEffect(() => {
    if (profileTheme) {
      applyTheme(profileTheme);
    }
  }, [profileTheme]);

  const value = useMemo(() => ({ user, profile, loading }), [loading, profile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

function normalizeProfile(
  user: User,
  data: Record<string, unknown> | undefined,
): CardsAIUserProfile {
  return {
    uid: user.uid,
    displayName: stringOr(data?.displayName, user.displayName ?? "Usuário CardsAI"),
    email: stringOr(data?.email, user.email ?? ""),
    photoURL: typeof data?.photoURL === "string" ? data.photoURL : user.photoURL,
    nativeLang: languageOr(data?.nativeLang, DEFAULT_NATIVE_LANG),
    targetLang: languageOr(data?.targetLang, DEFAULT_TARGET_LANG),
    level: levelOr(data?.level, DEFAULT_LEVEL),
    onboardingCompleted: data?.onboardingCompleted === true,
    timezone: stringOr(data?.timezone, Intl.DateTimeFormat().resolvedOptions().timeZone),
    theme: data?.theme === "dark" ? "dark" : "light",
    xpTotal: numberOr(data?.xpTotal),
    currentStreak: numberOr(data?.currentStreak),
    longestStreak: numberOr(data?.longestStreak),
    lastStudyDate: null,
    lastStudyLocalDate: typeof data?.lastStudyLocalDate === "string" ? data.lastStudyLocalDate : null,
    totalCardsStudied: numberOr(data?.totalCardsStudied),
    totalDecksCompleted: numberOr(data?.totalDecksCompleted),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberOr(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function languageOr(value: unknown, fallback: LanguageCode): LanguageCode {
  return value === "pt" ||
    value === "en" ||
    value === "es" ||
    value === "fr" ||
    value === "de" ||
    value === "it"
    ? value
    : fallback;
}

function levelOr(value: unknown, fallback: ProficiencyLevel): ProficiencyLevel {
  return value === "beginner" || value === "intermediate" || value === "advanced"
    ? value
    : fallback;
}
