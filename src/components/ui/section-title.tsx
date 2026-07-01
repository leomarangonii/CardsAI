import type { ReactNode } from "react";

interface SectionTitleProps {
  children: ReactNode;
  action?: ReactNode;
}

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-black tracking-normal">{children}</h2>
      {action}
    </div>
  );
}
