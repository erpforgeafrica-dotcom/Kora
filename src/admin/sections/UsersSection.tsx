import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

interface EntityRow {
  id: string; auth_user_id: string | null; tenant_id: string;
  entity_type: string; role: string | null; first_name: string | null;
  last_name: string | null; email: string | null; created_at: string;
  tenants?: { name: string };
}

export default function UsersSection() {
  const { theme: t } = useTheme();
  const [users, setUsers] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('entity_graph')
      .select('*, tenants(name)')
      .order('created_at', { ascending: false })
      .limit(200);
    setUsers(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const ROLE_COLOR: Record<string, string> = {
    OWNER: t.primary, MANAGER: '#06b6d4', STAFF: '#a855f7', CONSUMER: '#64748b',
  };

  const TYPE_COLOR: Record<string, string> = {
    BUSINESS_OWNER: t.primary, CONSUMER: '#06b6d4', STAFF: '#a855f7', AI_AGENT: '#f59e0b',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: t.text }}>Users & RBAC</h2>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>{users.length} entities across all tenants</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: t.textFaint }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none"
          style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }} />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Business Owners', count: users.filter(u => u.entity_type === 'BUSINESS_OWNER').length, color: t.primary },
          { label: 'Consumers', count: users.filter(u => u.entity_type === 'CONSUMER').length, color: '#06b6d4' },
          { label: 'Staff', count: users.filter(u => u.entity_type === 'STAFF').length, color: '#a855f7' },
          { label: 'AI Agents', count: users.filter(u => u.entity_type === 'AI_AGENT').length, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="p-3 rounded-xl border text-center" style={{ backgroundColor: t.card, borderColor: t.cardBorder }}>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs mt-0.5" style={{ color: t.textFaint }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.cardBorder }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: t.surface }}>
              {['Name', 'Email', 'Tenant', 'Type', 'Role', 'Joined', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: t.textFaint }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: t.textFaint }}>Loading users...</td></tr>
            ) : filtered.slice(0, 100).map((u, i) => (
              <tr key={u.id} style={{ backgroundColor: i % 2 === 0 ? t.card : t.surface, borderTop: `1px solid ${t.border}` }}>
                <td className="px-4 py-3 font-medium" style={{ color: t.text }}>
                  {u.first_name || u.last_name ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() : '—'}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{u.email ?? '—'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{(u as any).tenants?.name ?? u.tenant_id.slice(0, 8) + '...'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: (TYPE_COLOR[u.entity_type] ?? t.primary) + '20', color: TYPE_COLOR[u.entity_type] ?? t.primary }}>
                    {u.entity_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium" style={{ color: ROLE_COLOR[u.role ?? ''] ?? t.textMuted }}>{u.role ?? '—'}</span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: t.textFaint }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {u.entity_type === 'BUSINESS_OWNER' && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: t.primary }}>
                      <ShieldCheck className="w-3.5 h-3.5" /> Owner
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 100 && (
          <div className="px-4 py-3 text-center text-xs border-t" style={{ borderColor: t.border, color: t.textFaint }}>
            Showing 100 of {filtered.length} results. Use search to narrow down.
          </div>
        )}
      </div>
    </div>
  );
}
