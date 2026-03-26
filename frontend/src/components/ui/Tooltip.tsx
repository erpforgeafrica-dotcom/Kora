import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      
      const positions = {
        top: { x: rect.left + rect.width / 2, y: rect.top - 8 },
        bottom: { x: rect.left + rect.width / 2, y: rect.bottom + 8 },
        left: { x: rect.left - 8, y: rect.top + rect.height / 2 },
        right: { x: rect.right + 8, y: rect.top + rect.height / 2 },
      };

      setCoords(positions[position]);
    }
  }, [isVisible, position]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          className="fixed z-50 px-2 py-1 text-xs text-white bg-slate-900 border border-slate-700 rounded shadow-lg whitespace-nowrap pointer-events-none"
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            transform: position === "top" || position === "bottom"
              ? "translateX(-50%)"
              : position === "left"
              ? "translateX(-100%)"
              : "translateX(0)",
          }}
        >
          {content}
        </div>
      )}
    </>
  );
}
