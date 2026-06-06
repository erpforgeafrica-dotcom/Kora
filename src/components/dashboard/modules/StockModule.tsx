import React, { useState } from 'react';
import { Package, Plus, Search } from 'lucide-react';
import HelpButton from '../../common/HelpButton';
import Modal from '../../common/Modal';
import DynamicForm from '../../forms/DynamicForm';
import { PRODUCT_UPLOAD_SCHEMA } from '../../../lib/formSchemas';
import { getIndustryConfig } from '../../../lib/industryConfig';

interface Props { industry: string | null; }

export default function StockModule({ industry }: Props) {
  const config = getIndustryConfig(industry);
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  async function handleAdd(data: Record<string, unknown>) {
    setItems(i => [...i, data]);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📦</span>
            {config.labels.stock}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Keep track of what you have and what you need</p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton module="stock" variant="inline" size="md" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">{item.name_en}</div>
                <div className="text-slate-400 text-xs mt-0.5">SKU: {item.sku || '—'} • Qty: {item.stock_qty}</div>
                <div className="text-emerald-400 text-sm font-bold mt-1">₦{item.price}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs border ${Number(item.stock_qty) > 5 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                {Number(item.stock_qty) > 5 ? 'In Stock' : 'Low Stock'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center space-y-4">
          <div className="text-6xl">📦</div>
          <div>
            <h3 className="text-white font-semibold text-lg">No Items Yet</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">Add products or supplies you sell or use in your business.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Your First Item
          </button>
        </div>
      )}

      {showForm && (
        <Modal title="Add Inventory Item" onClose={() => setShowForm(false)}>
          <DynamicForm schema={PRODUCT_UPLOAD_SCHEMA} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
