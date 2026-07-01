import { StatPill } from "@/components/ui/stat-pill";

interface HeaderStatsProps {
  streak: number;
  xp: number;
}

export function HeaderStats({ streak, xp }: HeaderStatsProps) {
  return (
    <div className="flex items-center gap-2">
      <StatPill icon="🔥" value={streak} tone="flame" />
      <StatPill icon="⚡" value={xp.toLocaleString("pt-BR")} tone="xp" />
    </div>
  );
}
