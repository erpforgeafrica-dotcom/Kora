import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

interface Industry {
  id: string; slug: string; label: string; emoji: string;
  description: string | null; is_active: boolean; created_at: string;
}

const DEFAULTS = { slug: '', label: '', emoji: '🏢', description: '', is_active: true };

export default function IndustriesSection() {
  const { theme: t } = useTheme();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(DEFAULTS);
  const [editing, setEditing] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase as any).from('industry_configs').select('*').order('label');
    if (error?.code === '42P01') { setTableExists(false); setLoading(false); return; }
    setIndustries(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createTable() {
    await (supabase as any).rpc('exec_sql', { sql: `
      CREATE TABLE IF NOT EXISTS industry_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug VARCHAR(100) UNIQUE NOT NULL,
        label VARCHAR(100) NOT NULL,
        emoji VARCHAR(10) NOT NULL DEFAULT '🏢',
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE industry_configs ENABLE ROW LEVEL SECURITY;
      CREATE POLICY industry_read_all ON industry_configs FOR SELECT TO authenticated USING (true);
    `});
    setTableExists(true);
    load();
  }

  async function save() {
    if (!form.slug || !form.label) return;
    if (editing) {
      await (supabase as any).from('industry_configs').update({ ...form, slug: form.slug.toLowerCase().replace(/\s+/g, '_') }).eq('id', editing);
    } else {
      await (supabase as any).from('industry_configs').insert({ ...form, slug: form.slug.toLowerCase().replace(/\s+/g, '_') });
    }
    setForm(DEFAULTS); setEditing(null); load();
  }

  async function remove(id: string) {
    if (!confirm('Delete this industry?')) return;
    await (supabase as any).from('industry_configs').delete().eq('id', id);
    setIndustries(prev => prev.filter(i => i.id !== id));
  }

  function startEdit(ind: Industry) {
    setEditing(ind.id);
    setForm({ slug: ind.slug, label: ind.label, emoji: ind.emoji, description: ind.description ?? '', is_active: ind.is_active });
  }

  if (!tableExists) return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: t.text }}>Industry Management</h2>
      <div className="rounded-2xl p-8 border text-center space-y-4" style={{ backgroundColor: t.card, borderColor: t.cardBorder }}>
        <div className="text-4xl">🏗️</div>
        <p className="text-sm" style={{ color: t.textMuted }}>The industry_configs table doesn't exist yet. Create it to manage industries dynamically.</p>
        <button onClick={createTable} className="px-6 py-2.5 rounded-xl font-bold text-sm transition hover:opacity-90" style={{ backgroundColor: t.primary, color: t.primaryText }}>
          Create industry_configs Table
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: t.text }}>Industry Management</h2>
        <p className="text-sm mt-1" style={{ color: t.textMuted }}>Add, edit or remove industries without any code deploy</p>
      </div>

      {/* Form */}
      <div className="rounded-2xl p-6 border space-y-4" style={{ backgroundColor: t.card, borderColor: t.cardBorder }}>
        <h3 className="font-bold text-sm" style={{ color: t.text }}>{editing ? 'Edit Industry' : 'Add New Industry'}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: t.textFaint }}>Emoji</label>
            <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: t.textFaint }}>Label *</label>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Healthcare"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: t.textFaint }}>Slug *</label>
            <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="e.g. healthcare"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none font-mono"
              style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: t.textFaint }}>Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description"
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: t.textMuted }}>
            <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4" />
            Active
          </label>
          <button onClick={save} className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition hover:opacity-90"
            style={{ backgroundColor: t.primary, color: t.primaryText }}>
            <Save className="w-4 h-4" /> {editing ? 'Update' : 'Add Industry'}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(DEFAULTS); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition hover:opacity-80"
              style={{ borderColor: t.border, color: t.textMuted }}>
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.cardBorder }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: t.surface }}>
              {['', 'Label', 'Slug', 'Description', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: t.textFaint }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: t.textFaint }}>Loading...</td></tr>
            ) : industries.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: t.textFaint }}>No industries yet. Add one above.</td></tr>
            ) : industries.map((ind, i) => (
              <tr key={ind.id} style={{ backgroundColor: i % 2 === 0 ? t.card : t.surface, borderTop: `1px solid ${t.border}` }}>
                <td className="px-4 py-3 text-xl">{ind.emoji}</td>
                <td className="px-4 py-3 font-medium" style={{ color: t.text }}>{ind.label}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: t.textMuted }}>{ind.slug}</td>
                <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{ind.description ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: ind.is_active ? '#22c55e20' : '#ef444420', color: ind.is_active ? '#22c55e' : '#ef4444' }}>
                    {ind.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(ind)} className="p-1.5 rounded-lg transition hover:opacity-80"
                      style={{ backgroundColor: t.primary + '20', color: t.primary }}><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => remove(ind.id)} className="p-1.5 rounded-lg transition hover:opacity-80"
                      style={{ backgroundColor: '#ef444420', color: '#ef4444' }}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
