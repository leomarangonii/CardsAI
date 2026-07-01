import { Suspense } from "react";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Mascot } from "@/components/mascot";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingForm />
    </Suspense>
  );
}

function OnboardingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff8ef] text-[#251f1c] dark:bg-[#17110e] dark:text-[#fff8ef]">
      <div className="flex flex-col items-center text-center">
        <Mascot mood="thinking" size={88} className="mb-4" />
        <p className="text-sm font-black text-[#6f6259] dark:text-[#d8c8bc]">
          Carregando onboarding...
        </p>
      </div>
    </div>
  );
}
