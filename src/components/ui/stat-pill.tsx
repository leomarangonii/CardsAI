interface StatPillProps {
  icon: string;
  value: string | number;
  tone?: "flame" | "xp" | "neutral";
}

const toneClasses = {
  flame: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300",
  xp: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  neutral: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200",
};

export function StatPill({ icon, value, tone = "neutral" }: StatPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-black ${toneClasses[tone]}`}
    >
      <span aria-hidden="true">{icon}</span>
      {value}
    </span>
  );
}
