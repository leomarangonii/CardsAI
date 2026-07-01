"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LanguageCode } from "@/types";

interface GenerationStepsProps {
  targetLang: LanguageCode;
}

export function GenerationSteps({ targetLang }: GenerationStepsProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    "Carregando seu deck pessoal...",
    "Priorizando revisões e palavras novas...",
    "Preparando a sessão de estudo...",
  ];

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setActiveStep(1), 700),
      window.setTimeout(() => setActiveStep(2), 1600),
      window.setTimeout(() => setActiveStep(3), 2500),
      window.setTimeout(() => setActiveStep(4), 3100),
      window.setTimeout(() => {
        router.push(`/study/deck/${targetLang}`);
      }, 3700),
    ];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [router, targetLang]);

  return (
    <div className="w-full max-w-sm">
      <div className="space-y-3">
        {steps.map((step, index) => (
          <GenerationLine
            index={index + 1}
            key={step}
            status={getStepStatus(activeStep, index)}
            text={step}
          />
        ))}
      </div>

      <Link
        className="mt-6 flex h-12 items-center justify-center rounded-2xl border border-[#ece4da] bg-white px-4 text-sm font-black text-orange-600 shadow-[0_4px_0_#ece4da] dark:border-[#342c26] dark:bg-[#2b2420] dark:shadow-[0_4px_0_#342c26]"
        href={`/study/deck/${targetLang}`}
      >
        Ir para sessão
      </Link>
    </div>
  );
}

function getStepStatus(activeStep: number, stepIndex: number): "done" | "active" | "pending" {
  if (activeStep > stepIndex) {
    return "done";
  }

  if (activeStep === stepIndex) {
    return "active";
  }

  return "pending";
}

function GenerationLine({
  index,
  status,
  text,
}: {
  index: number;
  status: "done" | "active" | "pending";
  text: string;
}) {
  const statusClasses = {
    done: "border-[#ece4da] bg-white text-[#6b6258] dark:border-[#342c26] dark:bg-[#211c18]",
    active:
      "border-orange-500 bg-white text-[#2b2622] dark:border-orange-500 dark:bg-[#211c18] dark:text-[#f4ede4]",
    pending:
      "border-[#ece4da] bg-white/60 text-[#a89e93] dark:border-[#342c26] dark:bg-[#211c18]/50",
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 text-sm font-black transition-all duration-300 ${statusClasses[status]} ${
        status === "active" ? "scale-[1.02] shadow-[0_10px_24px_rgba(255,107,53,0.16)]" : ""
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs text-white ${
          status === "done"
            ? "bg-[#36c46b]"
            : status === "active"
              ? "bg-orange-500"
              : "bg-[#f4efe9] text-[#a89e93] dark:bg-[#2b2420]"
        }`}
      >
        {status === "done" ? "✓" : status === "active" ? <Spinner /> : index}
      </span>
      {text}
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
  );
}
