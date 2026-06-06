import React from 'react';
import { Store, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ContextSwitcher() {
  const { isBusinessOwner, viewMode, setViewMode } = useAuth();
  if (!isBusinessOwner) return null;

  return (
    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1">
      <button
        onClick={() => setViewMode('consumer')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          viewMode === 'consumer' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
        }`}
        title="Switch to customer shopping view"
      >
        <ShoppingBag className="w-3.5 h-3.5" /> When I'm Shopping
      </button>
      <button
        onClick={() => setViewMode('business')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          viewMode === 'business' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300'
        }`}
        title="Switch to business management view"
      >
        <Store className="w-3.5 h-3.5" /> Running My Business
      </button>
    </div>
  );
}
