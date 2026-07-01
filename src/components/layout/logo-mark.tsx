interface LogoMarkProps {
  size?: "sm" | "md";
}

export function LogoMark({ size = "md" }: LogoMarkProps) {
  const sizeClass = size === "sm" ? "h-7 w-7 rounded-lg" : "h-9 w-9 rounded-xl";

  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} relative inline-flex rotate-[-6deg] bg-gradient-to-br from-orange-500 to-[#f7b801] shadow-[0_4px_0_#d9531f]`}
    >
      <span className="absolute left-[24%] right-[24%] top-[30%] h-1 rounded-full bg-white/85 shadow-[0_8px_0_rgba(255,255,255,0.55)]" />
    </span>
  );
}
