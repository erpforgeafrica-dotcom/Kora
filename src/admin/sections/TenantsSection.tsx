import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, AlertTriangle, XCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

interface Tenant {
  id: string; name: string; tenant_code: string; industry: string | null;
  region: string | null; tier: string; status: string; created_at: string;
  base_currency: string;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#22c55e', SUSPENDED: '#f59e0b', FROZEN: '#ef4444',
};

export default function TenantsSection() {
  const { theme: t } = useTheme();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [working, setWorking] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any).from('tenants').select('*').order('created_at', { ascending: false });
    setTenants(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    setWorking(id);
    await (supabase as any).from('tenants').update({ status }).eq('id', id);
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    setWorking(null);
  }

  const filtered = tenants.filter(t =>
    (filterStatus === 'ALL' || t.status === filterStatus) &&
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.tenant_code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: t.text }}>Tenant Management</h2>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>{tenants.length} registered tenants</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition hover:opacity-80" style={{ borderColor: t.border, color: t.textMuted }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: t.textFaint }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none"
            style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-xl border text-sm focus:outline-none"
          style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }}>
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="FROZEN">Frozen</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.cardBorder }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: t.surface }}>
              {['Business', 'Code', 'Industry', 'Region', 'Tier', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider" style={{ color: t.textFaint }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: t.textFaint }}>Loading tenants...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: t.textFaint }}>No tenants found</td></tr>
            ) : filtered.map((tn, i) => (
              <tr key={tn.id} style={{ backgroundColor: i % 2 === 0 ? t.card : t.surface, borderTop: `1px solid ${t.border}` }}>
                <td className="px-4 py-3 font-medium" style={{ color: t.text }}>{tn.name}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: t.textMuted }}>{tn.tenant_code}</td>
                <td className="px-4 py-3 text-xs capitalize" style={{ color: t.textMuted }}>{tn.industry ?? '—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{tn.region ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: t.primary + '20', color: t.primary }}>{tn.tier}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-xs font-bold" style={{ color: STATUS_COLOR[tn.status] }}>
                    {tn.status === 'ACTIVE' && <CheckCircle className="w-3.5 h-3.5" />}
                    {tn.status === 'SUSPENDED' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {tn.status === 'FROZEN' && <XCircle className="w-3.5 h-3.5" />}
                    {tn.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: t.textFaint }}>{new Date(tn.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {tn.status !== 'ACTIVE' && (
                      <button disabled={working === tn.id} onClick={() => setStatus(tn.id, 'ACTIVE')}
                        className="px-2 py-1 rounded-lg text-xs font-bold transition hover:opacity-80"
                        style={{ backgroundColor: '#22c55e20', color: '#22c55e' }}>Activate</button>
                    )}
                    {tn.status !== 'SUSPENDED' && (
                      <button disabled={working === tn.id} onClick={() => setStatus(tn.id, 'SUSPENDED')}
                        className="px-2 py-1 rounded-lg text-xs font-bold transition hover:opacity-80"
                        style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>Suspend</button>
                    )}
                    {tn.status !== 'FROZEN' && (
                      <button disabled={working === tn.id} onClick={() => setStatus(tn.id, 'FROZEN')}
                        className="px-2 py-1 rounded-lg text-xs font-bold transition hover:opacity-80"
                        style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>Freeze</button>
                    )}
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
