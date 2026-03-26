interface BulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onExport?: () => void;
  onClear: () => void;
}

export default function BulkActions({ selectedCount, onDelete, onExport, onClear }: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg">
      <span className="text-sm text-gray-300">
        {selectedCount} selected
      </span>
      <div className="flex gap-2 ml-auto">
        {onExport && (
          <button
            onClick={onExport}
            className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-600"
          >
            Export
          </button>
        )}
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete
        </button>
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded hover:bg-slate-600"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
