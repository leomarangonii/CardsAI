"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { HeaderStats } from "@/components/layout/header-stats";
import { firebaseDb } from "@/lib/firebase/client";

export function HeaderStatsClient() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ streak: 0, xp: 0 });

  useEffect(() => {
    if (!user) {
      return;
    }

    return onSnapshot(doc(firebaseDb, "users", user.uid), (snapshot) => {
      const data = snapshot.data();
      setStats({
        streak: typeof data?.currentStreak === "number" ? data.currentStreak : 0,
        xp: typeof data?.xpTotal === "number" ? data.xpTotal : 0,
      });
    });
  }, [user]);

  return <HeaderStats streak={stats.streak} xp={stats.xp} />;
}
