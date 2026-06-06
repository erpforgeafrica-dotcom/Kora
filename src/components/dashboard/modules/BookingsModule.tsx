import React, { useState } from 'react';
import { CalendarCheck, Plus, Search, Filter } from 'lucide-react';
import HelpButton from '../../common/HelpButton';
import Modal from '../../common/Modal';
import DynamicForm from '../../forms/DynamicForm';
import { SERVICE_CREATION_SCHEMA } from '../../../lib/formSchemas';
import { getIndustryConfig } from '../../../lib/industryConfig';

interface Props {
  industry: string | null;
  onAddNew?: () => void;
}

export default function BookingsModule({ industry }: Props) {
  const config = getIndustryConfig(industry);
  const [showForm, setShowForm] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  async function handleAdd(data: Record<string, unknown>) {
    setBookings(b => [...b, data]);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📅</span>
            {config.labels.bookings}
          </h1>
          <p className="text-slate-400 text-sm mt-1">See who's coming, when they're coming, and what they need</p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton module="bookings" variant="inline" size="md" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500/50" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl text-slate-300 text-sm transition">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">{b.name_en}</div>
                <div className="text-slate-400 text-xs mt-0.5">{b.duration} min • {b.currency || 'NGN'} {b.price}</div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">Active</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center space-y-4">
          <div className="text-6xl">📅</div>
          <div>
            <h3 className="text-white font-semibold text-lg">No {config.labels.bookings} Yet</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">When customers book your services, they'll show up here.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Your First One
          </button>
        </div>
      )}

      {showForm && (
        <Modal title="Add a New Service" onClose={() => setShowForm(false)}>
          <DynamicForm schema={SERVICE_CREATION_SCHEMA} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
