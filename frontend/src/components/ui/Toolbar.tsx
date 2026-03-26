// src/components/ui/Toolbar.tsx
import React from "react";

interface ToolbarProps {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Toolbar({ search, filters, actions }: ToolbarProps) {
  return (
    <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700 flex items-center gap-4">
      {search && <div className="flex-1">{search}</div>}
      {filters && <div>{filters}</div>}
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
