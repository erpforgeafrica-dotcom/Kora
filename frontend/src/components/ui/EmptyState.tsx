// src/components/ui/EmptyState.tsx
import React from "react";

interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-6xl mb-4">📭</div>
      <p className="text-xl text-gray-300 mb-6">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
