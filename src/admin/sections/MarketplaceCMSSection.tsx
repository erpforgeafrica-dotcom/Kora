import React, { useEffect, useState } from 'react';
import { RefreshCw, Star, Store } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

interface Profile {
  id: string; tenant_id: string; verified: boolean; created_at: string;
  tenants?: { name: string; industry: string | null; tier: string };
}

export default function MarketplaceCMSSection() {
  const { theme: t } = useTheme();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('business_profiles')
      .select('*, tenants(name, industry, tier)')
      .order('created_at', { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleVerified(id: string, current: boolean) {
    setWorking(id);
    await (supabase as any).from('business_profiles').update({ verified: !current }).eq('id', id);
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, verified: !current } : p));
    setWorking(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: t.text }}>Marketplace CMS</h2>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>Manage business profiles, verification and featured listings</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm" style={{ borderColor: t.border, color: t.textMuted }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Profiles', value: profiles.length, color: t.primary },
          { label: 'Verified', value: profiles.filter(p => p.verified).length, color: '#22c55e' },
          { label: 'Unverified', value: profiles.filter(p => !p.verified).length, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-2xl border text-center" style={{ backgroundColor: t.card, borderColor: t.cardBorder }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: t.textFaint }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: t.textFaint }}>Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className="p-12 rounded-2xl border text-center" style={{ backgroundColor: t.card, borderColor: t.cardBorder }}>
          <Store className="w-12 h-12 mx-auto mb-3" style={{ color: t.textFaint }} />
          <p className="text-sm" style={{ color: t.textMuted }}>No business profiles yet. Businesses appear here after registration.</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.cardBorder }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: t.surface }}>
                {['Business', 'Industry', 'Tier', 'Verified', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: t.textFaint }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p, i) => (
                <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? t.card : t.surface, borderTop: `1px solid ${t.border}` }}>
                  <td className="px-4 py-3 font-medium" style={{ color: t.text }}>
                    {(p as any).tenants?.name ?? 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-xs capitalize" style={{ color: t.textMuted }}>
                    {(p as any).tenants?.industry ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: t.primary + '20', color: t.primary }}>
                      {(p as any).tenants?.tier ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs font-bold"
                      style={{ color: p.verified ? '#22c55e' : '#f59e0b' }}>
                      {p.verified && <Star className="w-3.5 h-3.5 fill-current" />}
                      {p.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: t.textFaint }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button disabled={working === p.id} onClick={() => toggleVerified(p.id, p.verified)}
                      className="px-3 py-1 rounded-lg text-xs font-bold transition hover:opacity-80"
                      style={{
                        backgroundColor: p.verified ? '#f59e0b20' : '#22c55e20',
                        color: p.verified ? '#f59e0b' : '#22c55e',
                      }}>
                      {p.verified ? 'Unverify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
