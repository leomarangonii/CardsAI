import type { CSSProperties } from "react";

export type MascotMood = "happy" | "excited" | "thinking" | "wave" | "proud";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

const moods: Record<
  MascotMood,
  { mouth: "smile" | "open" | "flat" | "grin"; rotation: number; squint: number }
> = {
  happy: { mouth: "smile", rotation: 0, squint: 1 },
  excited: { mouth: "open", rotation: 0, squint: 1 },
  thinking: { mouth: "flat", rotation: -5, squint: 0.7 },
  wave: { mouth: "smile", rotation: 0, squint: 1 },
  proud: { mouth: "grin", rotation: 0, squint: 1 },
};

export function Mascot({ mood = "happy", size = 96, className }: MascotProps) {
  const currentMood = moods[mood] ?? moods.happy;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size * 1.04,
        position: "relative",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: size * 0.26,
          background: "linear-gradient(150deg, #ff6b35, #f7b801)",
          boxShadow: `0 ${size * 0.06}px 0 #d9531f, 0 ${size * 0.14}px ${
            size * 0.2
          }px rgba(255, 107, 53, 0.32)`,
          transform: `rotate(${currentMood.rotation}deg)`,
          transition: "transform 0.3s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: size * 0.12,
            left: size * 0.16,
            right: size * 0.16,
            height: size * 0.045,
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.7)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: size * 0.34,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: size * 0.08,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: size * 0.16,
              alignItems: "center",
            }}
          >
            <Eye size={size} squint={currentMood.squint} />
            <Eye size={size} squint={currentMood.squint} />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Mouth mood={currentMood.mouth} size={size} />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: size * 0.5,
            left: size * 0.1,
            width: size * 0.13,
            height: size * 0.08,
            borderRadius: "50%",
            background: "rgba(255, 90, 60, 0.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: size * 0.5,
            right: size * 0.1,
            width: size * 0.13,
            height: size * 0.08,
            borderRadius: "50%",
            background: "rgba(255, 90, 60, 0.35)",
          }}
        />
      </div>

      {mood === "wave" ? (
        <div
          className="cardsai-wave"
          style={{
            position: "absolute",
            top: -size * 0.06,
            right: -size * 0.12,
            fontSize: size * 0.32,
            transformOrigin: "bottom left",
          }}
        >
          👋
        </div>
      ) : null}

      {mood === "proud" ? (
        <div
          style={{
            position: "absolute",
            top: -size * 0.18,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: size * 0.3,
          }}
        >
          👑
        </div>
      ) : null}
    </div>
  );
}

function Eye({ size, squint }: { size: number; squint: number }) {
  return (
    <div
      style={{
        width: size * 0.13,
        height: size * 0.13,
        borderRadius: "50%",
        background: "#2b2622",
        position: "relative",
        transform: `scaleY(${squint})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "14%",
          left: "16%",
          width: "36%",
          height: "36%",
          borderRadius: "50%",
          background: "#fff",
        }}
      />
    </div>
  );
}

function Mouth({
  mood,
  size,
}: {
  mood: "smile" | "open" | "flat" | "grin";
  size: number;
}) {
  const baseStyle: CSSProperties = {
    background: "#2b2622",
  };

  if (mood === "smile") {
    return (
      <div
        style={{
          ...baseStyle,
          width: size * 0.3,
          height: size * 0.15,
          borderBottomLeftRadius: 999,
          borderBottomRightRadius: 999,
        }}
      />
    );
  }

  if (mood === "open") {
    return (
      <div
        style={{
          ...baseStyle,
          width: size * 0.26,
          height: size * 0.26,
          borderRadius: "0 0 999px 999px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: "45%",
            background: "#ff8a76",
            borderRadius: "999px 999px 50% 50%",
          }}
        />
      </div>
    );
  }

  if (mood === "grin") {
    return (
      <div
        style={{
          ...baseStyle,
          width: size * 0.34,
          height: size * 0.17,
          borderRadius: "0 0 999px 999px",
          border: `${size * 0.02}px solid #2b2622`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        ...baseStyle,
        width: size * 0.22,
        height: size * 0.05,
        borderRadius: 999,
      }}
    />
  );
}
