import React, { useState } from 'react';
import { UserCircle, Plus } from 'lucide-react';
import HelpButton from '../../common/HelpButton';
import Modal from '../../common/Modal';
import DynamicForm from '../../forms/DynamicForm';
import type { FormSchema } from '../../forms/DynamicForm';

const CUSTOMER_SCHEMA: FormSchema = {
  id: 'add-customer',
  title: 'Add a Customer',
  submitLabel: 'Save Customer',
  sections: [
    {
      title: 'Customer Details',
      fields: [
        { id: 'first_name', type: 'text',  label: 'First Name', placeholder: 'e.g. Chisom', required: true },
        { id: 'last_name',  type: 'text',  label: 'Last Name',  placeholder: 'e.g. Nwosu',  required: true },
        { id: 'email',      type: 'email', label: 'Email',      placeholder: 'chisom@email.com' },
        { id: 'phone',      type: 'phone', label: 'Phone',      placeholder: '+234 800 000 0000', required: true },
        { id: 'notes',      type: 'textarea', label: 'Notes', placeholder: 'Any preferences or special notes...' },
      ],
    },
  ],
};

export default function CustomersModule() {
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  async function handleAdd(data: Record<string, unknown>) {
    setCustomers(c => [...c, data]);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">👤</span>
            People Who Use Your Service
          </h1>
          <p className="text-slate-400 text-sm mt-1">Everyone who has ever booked with you</p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton module="customers" variant="inline" size="md" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {customers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {customers.map((c, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                {String(c.first_name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold">{c.first_name} {c.last_name}</div>
                <div className="text-slate-400 text-xs mt-0.5">{c.phone}</div>
                {c.notes && <div className="text-slate-500 text-xs mt-0.5 truncate max-w-[200px]">{c.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center space-y-4">
          <div className="text-6xl">🙋</div>
          <div>
            <h3 className="text-white font-semibold text-lg">No Customers Yet</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">When people book your services, they'll appear here automatically.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Customer Manually
          </button>
        </div>
      )}

      {showForm && (
        <Modal title="Add a Customer" onClose={() => setShowForm(false)}>
          <DynamicForm schema={CUSTOMER_SCHEMA} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
