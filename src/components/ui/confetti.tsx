"use client";

import { useMemo } from "react";

const COLORS = ["#ff6b35", "#f7b801", "#36c46b", "#ff5a6a", "#4f9dff", "#b06bff"];

interface ConfettiProps {
  /** Quantidade de peças. Default 80. */
  pieces?: number;
  /** Duração visual em segundos (deve casar com o timer de quem usa). Default 3. */
  durationSeconds?: number;
}

/** Pseudo-aleatório determinístico (puro) por índice — evita Math.random no render. */
function seeded(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Confetti leve, sem dependência externa: peças distribuídas via pseudo-aleatório
 * determinístico que caem por animação CSS (`cardsai-confetti-fall`). Quem
 * renderiza controla por quanto tempo o componente fica montado.
 */
export function Confetti({ pieces = 80, durationSeconds = 3 }: ConfettiProps) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, index) => ({
        key: index,
        left: seeded(index + 1) * 100,
        delay: seeded(index + 7) * 0.6,
        duration: durationSeconds * (0.6 + seeded(index + 13) * 0.5),
        color: COLORS[index % COLORS.length],
        rounded: seeded(index + 19) > 0.5,
      })),
    [pieces, durationSeconds],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {items.map((item) => (
        <span
          className="cardsai-confetti"
          key={item.key}
          style={{
            left: `${item.left}%`,
            background: item.color,
            borderRadius: item.rounded ? "50%" : "2px",
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
