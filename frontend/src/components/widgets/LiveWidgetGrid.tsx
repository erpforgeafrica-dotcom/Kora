import type { ReactNode } from "react";

interface LiveWidgetGridProps {
  children: ReactNode;
  columns?: number;
}

export function LiveWidgetGrid({ children, columns = 4 }: LiveWidgetGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 4 ? "240px" : "280px"}, 1fr))`,
        gap: 16,
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}
