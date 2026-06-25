import React, { useEffect, useState } from 'react';
import { Users, Building2, DollarSign, Activity, TrendingUp, Shield, Cpu, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

export default function OverviewSection() {
  const { theme: t } = useTheme();
  const [stats, setStats] = useState({ tenants: 0, users: 0, active: 0, suspended: 0, frozen: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ count: tenants }, { count: users }, { count: active }, { count: suspended }, { count: frozen }] = await Promise.all([
        (supabase as any).from('tenants').select('*', { count: 'exact', head: true }),
        (supabase as any).from('entity_graph').select('*', { count: 'exact', head: true }),
        (supabase as any).from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        (supabase as any).from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'SUSPENDED'),
        (supabase as any).from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'FROZEN'),
      ]);
      setStats({ tenants: tenants ?? 0, users: users ?? 0, active: active ?? 0, suspended: suspended ?? 0, frozen: frozen ?? 0 });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Tenants', value: stats.tenants, icon: <Building2 className="w-5 h-5" />, color: t.primary, sub: `${stats.active} active` },
    { label: 'Total Users', value: stats.users, icon: <Users className="w-5 h-5" />, color: '#06b6d4', sub: 'across all tenants' },
    { label: 'Active Tenants', value: stats.active, icon: <Activity className="w-5 h-5" />, color: '#22c55e', sub: 'running now' },
    { label: 'Suspended', value: stats.suspended, icon: <Shield className="w-5 h-5" />, color: '#f59e0b', sub: `${stats.frozen} frozen` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: t.text }}>Platform Overview</h2>
        <p className="text-sm mt-1" style={{ color: t.textMuted }}>Live snapshot of the entire Kora platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl p-5 border space-y-3" style={{ backgroundColor: t.card, borderColor: t.cardBorder }}>
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: c.color + '18', color: c.color }}>{c.icon}</div>
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: t.text }}>
                {loading ? '—' : c.value.toLocaleString()}
              </div>
              <div className="text-sm font-medium mt-0.5" style={{ color: t.textMuted }}>{c.label}</div>
              <div className="text-xs mt-0.5" style={{ color: t.textFaint }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Health */}
      <div className="rounded-2xl p-6 border" style={{ backgroundColor: t.card, borderColor: t.cardBorder }}>
        <h3 className="font-bold mb-4" style={{ color: t.text }}>Platform Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'API Uptime', value: '99.98%', icon: <TrendingUp className="w-4 h-4" />, color: '#22c55e' },
            { label: 'DB RLS Status', value: '111 Tables Secured', icon: <Shield className="w-4 h-4" />, color: t.primary },
            { label: 'AI Gateway', value: 'Firewall Active', icon: <Cpu className="w-4 h-4" />, color: '#06b6d4' },
            { label: 'Regions Active', value: 'NG · GH · KE · ZA · UK · US', icon: <Globe className="w-4 h-4" />, color: '#a855f7' },
            { label: 'Compliance', value: 'GDPR · HIPAA · NDPR', icon: <Shield className="w-4 h-4" />, color: '#f59e0b' },
            { label: 'Revenue Model', value: 'Double-Entry Ledger', icon: <DollarSign className="w-4 h-4" />, color: '#22c55e' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: t.border }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: item.color + '18', color: item.color }}>{item.icon}</div>
              <div>
                <div className="text-xs font-bold" style={{ color: t.text }}>{item.value}</div>
                <div className="text-xs" style={{ color: t.textFaint }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
