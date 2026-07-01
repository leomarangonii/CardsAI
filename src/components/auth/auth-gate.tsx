"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Mascot } from "@/components/mascot";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!loading && user && profile?.onboardingCompleted !== true) {
      router.replace(`/onboarding?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, profile?.onboardingCompleted, router, user]);

  if (loading || !user || profile?.onboardingCompleted !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8ef] text-[#251f1c] dark:bg-[#17110e] dark:text-[#fff8ef]">
        <div className="flex flex-col items-center text-center">
          <Mascot mood="thinking" size={88} className="mb-4" />
          <p className="text-sm font-black text-[#6f6259] dark:text-[#d8c8bc]">
            Carregando sua sessão...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
