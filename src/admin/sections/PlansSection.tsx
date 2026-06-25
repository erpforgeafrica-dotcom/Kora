import React, { useEffect, useState } from 'react';
import { Save, Pencil, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

interface Plan {
  id: string; name: string; max_users: number | null;
  storage_mb: number | null; ai_tokens_mo: number | null;
  price_monthly: number; price_annual: number; features: any;
}

const TIER_COLOR: Record<string, string> = {
  BASIC: '#64748b', ESSENTIAL: '#06b6d4', PROFESSIONAL: '#a855f7', ENTERPRISE: '#f59e0b',
};

export default function PlansSection() {
  const { theme: t } = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Plan>>({});

  useEffect(() => {
    (supabase as any).from('billing_plans').select('*').order('price_monthly').then(({ data }: any) => {
      setPlans(data ?? []); setLoading(false);
    });
  }, []);

  function startEdit(p: Plan) { setEditing(p.id); setDraft({ ...p }); }

  async function savePlan() {
    if (!editing) return;
    await (supabase as any).from('billing_plans').update({
      max_users: draft.max_users, storage_mb: draft.storage_mb,
      ai_tokens_mo: draft.ai_tokens_mo, price_monthly: draft.price_monthly,
      price_annual: draft.price_annual, features: draft.features,
    }).eq('id', editing);
    setPlans(prev => prev.map(p => p.id === editing ? { ...p, ...draft } as Plan : p));
    setEditing(null); setDraft({});
  }

  const FEATURE_KEYS = ['marketplace', 'booking', 'pos', 'crm', 'hrm', 'inventory', 'erp', 'workflow', 'industry_clouds', 'franchise', 'blockchain_audit', 'white_label'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: t.text }}>Subscription Plans</h2>
        <p className="text-sm mt-1" style={{ color: t.textMuted }}>Configure BASIC · ESSENTIAL · PROFESSIONAL · ENTERPRISE tiers</p>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: t.textFaint }}>Loading plans...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map(plan => {
            const isEdit = editing === plan.id;
            const d = isEdit ? draft : plan;
            const color = TIER_COLOR[plan.name] ?? t.primary;

            return (
              <div key={plan.id} className="rounded-2xl border p-5 space-y-4 flex flex-col" style={{ backgroundColor: t.card, borderColor: isEdit ? color : t.cardBorder }}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '20', color }}>{plan.name}</span>
                    <div className="text-2xl font-black mt-2" style={{ color: t.text }}>
                      {isEdit ? (
                        <input type="number" value={d.price_monthly ?? 0} onChange={e => setDraft(f => ({ ...f, price_monthly: +e.target.value }))}
                          className="w-24 px-2 py-1 rounded-lg border text-lg font-bold focus:outline-none"
                          style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }} />
                      ) : `$${plan.price_monthly}`}
                      <span className="text-xs font-normal ml-1" style={{ color: t.textFaint }}>/mo</span>
                    </div>
                  </div>
                  {isEdit ? (
                    <div className="flex gap-1">
                      <button onClick={savePlan} className="p-1.5 rounded-lg" style={{ backgroundColor: color + '20', color }}><Check className="w-4 h-4" /></button>
                      <button onClick={() => { setEditing(null); setDraft({}); }} className="p-1.5 rounded-lg" style={{ backgroundColor: t.border, color: t.textMuted }}><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(plan)} className="p-1.5 rounded-lg" style={{ backgroundColor: t.border, color: t.textMuted }}><Pencil className="w-4 h-4" /></button>
                  )}
                </div>

                {/* Limits */}
                <div className="space-y-2 text-xs" style={{ color: t.textMuted }}>
                  {[
                    { label: 'Max Users', key: 'max_users', suffix: 'users' },
                    { label: 'Storage', key: 'storage_mb', suffix: 'MB' },
                    { label: 'AI Tokens/mo', key: 'ai_tokens_mo', suffix: '' },
                    { label: 'Annual Price', key: 'price_annual', suffix: '/yr' },
                  ].map(({ label, key, suffix }) => (
                    <div key={key} className="flex justify-between items-center">
                      <span>{label}</span>
                      {isEdit ? (
                        <input type="number" value={(d as any)[key] ?? ''} onChange={e => setDraft(f => ({ ...f, [key]: e.target.value === '' ? null : +e.target.value }))}
                          className="w-24 px-2 py-0.5 rounded-lg border text-xs text-right focus:outline-none"
                          style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }} />
                      ) : (
                        <span className="font-medium" style={{ color: t.text }}>{(plan as any)[key] === null ? '∞' : `${(plan as any)[key]}${suffix}`}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="space-y-1.5 flex-1">
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: t.textFaint }}>Features</div>
                  {FEATURE_KEYS.map(key => {
                    const features = (isEdit ? d.features : plan.features) ?? {};
                    const enabled = !!features[key];
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs capitalize" style={{ color: enabled ? t.text : t.textFaint }}>{key.replace(/_/g, ' ')}</span>
                        {isEdit ? (
                          <button onClick={() => setDraft(f => ({ ...f, features: { ...(f.features ?? {}), [key]: !((f.features ?? {})[key]) } }))}
                            className="w-8 h-4 rounded-full transition-all relative"
                            style={{ backgroundColor: enabled ? color : t.border }}>
                            <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all" style={{ left: enabled ? '18px' : '2px' }} />
                          </button>
                        ) : (
                          <span style={{ color: enabled ? color : t.textFaint }}>{enabled ? '✓' : '—'}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
