import React, { useState } from 'react';
import { DollarSign, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import HelpButton from '../../common/HelpButton';
import Modal from '../../common/Modal';
import DynamicForm from '../../forms/DynamicForm';
import type { FormSchema } from '../../forms/DynamicForm';

const TRANSACTION_SCHEMA: FormSchema = {
  id: 'add-transaction',
  title: 'Record a Transaction',
  submitLabel: 'Save Transaction',
  sections: [
    {
      title: 'Transaction Details',
      fields: [
        {
          id: 'type', type: 'select', label: 'Type', required: true,
          options: [
            { label: 'Income (money coming in)', value: 'income' },
            { label: 'Expense (money going out)', value: 'expense' },
          ],
        },
        { id: 'amount',      type: 'number',   label: 'Amount (₦)', placeholder: '5000', required: true },
        { id: 'description', type: 'text',     label: 'What is it for?', placeholder: 'e.g. Hair service payment', required: true },
        {
          id: 'payment_method', type: 'select', label: 'How was it paid?',
          options: [
            { label: 'Cash',         value: 'cash' },
            { label: 'Bank Transfer', value: 'transfer' },
            { label: 'POS / Card',   value: 'card' },
            { label: 'Mobile Money', value: 'mobile_money' },
          ],
        },
        { id: 'date', type: 'date', label: 'Date', required: true },
        { id: 'notes', type: 'textarea', label: 'Notes (optional)', placeholder: 'Any extra details...' },
      ],
    },
  ],
};

export default function MoneyModule() {
  const [showForm, setShowForm] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  async function handleAdd(data: Record<string, unknown>) {
    setTransactions(t => [...t, data]);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">💰</span>
            Money You've Made
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track every naira coming in and going out</p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton module="money" variant="inline" size="md" />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Money Made',    value: `₦${income.toLocaleString()}`,   icon: <TrendingUp className="w-5 h-5" />,   color: 'emerald' },
          { label: 'Money Spent',   value: `₦${expense.toLocaleString()}`,  icon: <TrendingDown className="w-5 h-5" />, color: 'red' },
          { label: 'Balance',       value: `₦${balance.toLocaleString()}`,  icon: <DollarSign className="w-5 h-5" />,   color: 'cyan' },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className={`inline-flex p-2.5 rounded-xl text-${s.color}-400 bg-${s.color}-500/10`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-3">
          {[...transactions].reverse().map((t, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{t.description}</div>
                  <div className="text-slate-500 text-xs">{t.payment_method} • {t.date}</div>
                </div>
              </div>
              <div className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.type === 'income' ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center space-y-4">
          <div className="text-6xl">💸</div>
          <div>
            <h3 className="text-white font-semibold text-lg">No Transactions Yet</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">Start tracking your money. Add income and expenses.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Record First Transaction
          </button>
        </div>
      )}

      {showForm && (
        <Modal title="Record a Transaction" onClose={() => setShowForm(false)}>
          <DynamicForm schema={TRANSACTION_SCHEMA} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
}
