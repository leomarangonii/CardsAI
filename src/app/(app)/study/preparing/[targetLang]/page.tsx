import { notFound } from "next/navigation";
import { Mascot } from "@/components/mascot";
import { GenerationSteps } from "@/components/study/generation-steps";
import { TimezoneLabel } from "@/components/study/timezone-label";
import { getLanguageLabel, isSupportedTargetLang } from "@/lib/catalog";

export default async function PreparingPage({
  params,
}: {
  params: Promise<{ targetLang: string }>;
}) {
  const { targetLang } = await params;

  if (!isSupportedTargetLang(targetLang)) {
    notFound();
  }

  const languageLabel = getLanguageLabel(targetLang);

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-2 text-center">
      <div className="flex w-full max-w-lg flex-col items-center">
        <Mascot mood="thinking" size={104} className="mb-6" />
        <h1 className="text-3xl font-black leading-tight">Preparando sua sessão...</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-[#6b6258] dark:text-[#b8aa9b]">
          Deck pessoal de <strong>{languageLabel}</strong> · <TimezoneLabel />
        </p>
        <div className="mt-8 w-full">
          <GenerationSteps targetLang={targetLang} />
        </div>
      </div>
    </div>
  );
}
