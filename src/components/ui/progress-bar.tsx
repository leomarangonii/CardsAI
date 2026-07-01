interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

export function ProgressBar({ value, max, className = "" }: ProgressBarProps) {
  const width = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={`h-2 overflow-hidden rounded-full bg-[#f4efe9] dark:bg-[#2b2420] ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#36c46b] to-[#6fd98a]"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
