// src/components/ui/Skeleton.tsx
import React from "react";

interface SkeletonProps {
  rows?: number;
  columns?: number;
}

export default function Skeleton({ rows = 8, columns = 5 }: SkeletonProps) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 mb-4 pb-4 border-b border-slate-700 last:border-b-0">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className="flex-1 h-6 bg-slate-700 rounded animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
