import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import HelpButton from '../../common/HelpButton';
import Modal from '../../common/Modal';
import DynamicForm from '../../forms/DynamicForm';
import { STAFF_REGISTRATION_SCHEMA } from '../../../lib/formSchemas';

export default function TeamModule() {
  const [showForm, setShowForm] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  async function handleAdd(data: Record<string, unknown>) {
    setMembers(m => [...m, data]);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">👥</span>
            People Who Work With You
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your team members and what they do</p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton module="team" variant="inline" size="md" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Team Member
          </button>
        </div>
      </div>

      {members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map((m, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 font-bold text-lg">
                {String(m.first_name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold">{m.first_name} {m.last_name}</div>
                <div className="text-slate-400 text-xs mt-0.5">{m.role} {m.department ? `• ${m.department}` : ''}</div>
                <div className="text-slate-500 text-xs">{m.email}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center space-y-4">
          <div className="text-6xl">👨‍💼</div>
          <div>
            <h3 className="text-white font-semibold text-lg">No Team Members Yet</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">Add people who work with you so they can help manage bookings.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Your First Team Member
          </button>
        </div>
      )}

      {showForm && (
        <Modal title="Add a Team Member" onClose={() => setShowForm(false)}>
          <DynamicForm schema={STAFF_REGISTRATION_SCHEMA} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
