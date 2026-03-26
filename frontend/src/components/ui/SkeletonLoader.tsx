export function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-4 p-4 bg-slate-800 rounded">
      <div className="h-4 bg-slate-700 rounded w-1/4" />
      <div className="h-4 bg-slate-700 rounded w-1/3" />
      <div className="h-4 bg-slate-700 rounded w-1/5" />
      <div className="h-4 bg-slate-700 rounded w-1/6" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse p-6 bg-slate-800 rounded-lg border border-slate-700">
      <div className="h-6 bg-slate-700 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-700 rounded w-5/6" />
        <div className="h-4 bg-slate-700 rounded w-4/6" />
      </div>
    </div>
  );
}
