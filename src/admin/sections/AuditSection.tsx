import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

interface AuditRow {
  id: string; tenant_id: string; actor_id: string | null;
  action: string; resource_type: string | null; resource_id: string | null;
  ip_address: string | null; blockchain_hash: string | null; occurred_at: string;
  tenants?: { name: string };
}

export default function AuditSection() {
  const { theme: t } = useTheme();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('audit_control_plane')
      .select('*, tenants(name)')
      .order('occurred_at', { ascending: false })
      .limit(500);
    setLogs(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l =>
    `${l.action} ${l.resource_type ?? ''} ${(l as any).tenants?.name ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const ACTION_COLOR: Record<string, string> = {
    CREATE: '#22c55e', UPDATE: '#06b6d4', DELETE: '#ef4444',
    LOGIN: t.primary, LOGOUT: '#64748b', SUSPEND: '#f59e0b',
  };

  function getColor(action: string) {
    for (const [key, color] of Object.entries(ACTION_COLOR)) {
      if (action.toUpperCase().includes(key)) return color;
    }
    return t.textMuted;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: t.text }}>Audit & Forensics</h2>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>Immutable audit trail — {logs.length} events logged</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ backgroundColor: t.card, borderColor: t.cardBorder }}>
        <Shield className="w-5 h-5 flex-shrink-0" style={{ color: t.primary }} />
        <p className="text-xs" style={{ color: t.textMuted }}>
          All audit entries are append-only with optional blockchain hash chaining. No entry can be modified or deleted by any user including platform admins.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: t.textFaint }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by action or tenant..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none"
          style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }} />
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.cardBorder }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: t.surface }}>
              {['Time', 'Tenant', 'Action', 'Resource', 'IP', 'Hash'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: t.textFaint }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: t.textFaint }}>Loading audit log...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: t.textFaint }}>No audit entries yet</td></tr>
            ) : filtered.slice(0, 200).map((log, i) => (
              <tr key={log.id} style={{ backgroundColor: i % 2 === 0 ? t.card : t.surface, borderTop: `1px solid ${t.border}` }}>
                <td className="px-4 py-2 text-xs font-mono" style={{ color: t.textFaint }}>
                  {new Date(log.occurred_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-xs" style={{ color: t.textMuted }}>
                  {(log as any).tenants?.name ?? log.tenant_id.slice(0, 8) + '...'}
                </td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: getColor(log.action) + '20', color: getColor(log.action) }}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs" style={{ color: t.textMuted }}>
                  {log.resource_type ?? '—'}{log.resource_id ? ` · ${log.resource_id.slice(0, 8)}...` : ''}
                </td>
                <td className="px-4 py-2 text-xs font-mono" style={{ color: t.textFaint }}>{log.ip_address ?? '—'}</td>
                <td className="px-4 py-2 text-xs font-mono" style={{ color: t.textFaint }}>
                  {log.blockchain_hash ? log.blockchain_hash.slice(0, 12) + '...' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
