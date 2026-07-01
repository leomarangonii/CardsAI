import type { Flashcard } from "@/types";

interface FlashcardViewProps {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
}

export function FlashcardView({ card, flipped, onFlip }: FlashcardViewProps) {
  return (
    <button
      className="relative aspect-[3/4] w-full max-w-sm cursor-pointer border-0 bg-transparent p-0 text-left outline-none [perspective:1600px] focus-visible:ring-4 focus-visible:ring-orange-500/25 lg:max-w-md lg:aspect-[4/3.4]"
      onClick={onFlip}
      type="button"
    >
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <CardFace>
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#a89e93]">
            US Palavra
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight lg:text-5xl">
            {card.word}
          </h2>
          <p className="mt-2 text-base font-black text-[#6b6258] dark:text-[#b8aa9b]">
            {card.phonetic}
          </p>
          <div className="mt-auto rounded-2xl bg-[#f4efe9] p-4 text-sm font-bold leading-6 dark:bg-[#2b2420]">
            {card.example}
          </div>
          <p className="mt-4 text-center text-sm font-black text-[#25a657]">
            👆 Toque para ver a tradução
          </p>
        </CardFace>

        <CardFace className="[transform:rotateY(180deg)]">
          <p className="text-xs font-black uppercase tracking-[0.08em] text-[#a89e93]">
            BR Tradução
          </p>
          <h2 className="mt-4 text-3xl font-black leading-tight lg:text-4xl">
            {card.translation}
          </h2>
          <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-bold leading-6 text-green-800 dark:bg-green-950/40 dark:text-green-200">
            <p className="mb-1 text-xs font-black uppercase">Exemplo</p>
            <p>{card.example}</p>
            <p className="mt-2">{card.exampleTranslation}</p>
          </div>
          <div className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <p className="mb-1 text-xs font-black uppercase">Dica</p>
            <p>{card.tip}</p>
          </div>
        </CardFace>
      </div>
    </button>
  );
}

function CardFace({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col rounded-[28px] border border-[#ece4da] bg-white p-6 shadow-[0_20px_50px_rgba(95,70,40,0.16)] [backface-visibility:hidden] dark:border-[#342c26] dark:bg-[#211c18] ${className}`}
    >
      {children}
    </div>
  );
}
