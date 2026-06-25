import React, { useState } from 'react';
import { Save, Globe, Shield, Cpu, Bell, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function PlatformSettingsSection() {
  const { theme: t } = useTheme();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    defaultCurrency: 'NGN',
    defaultLanguage: 'en',
    defaultTimezone: 'Africa/Lagos',
    maintenanceMode: false,
    registrationOpen: true,
    maxTenantsPerEmail: 3,
    platformFeePercent: 5,
    aiEnabled: true,
    aiModel: 'gemini-2.0-flash',
    aiTokensDefaultMonthly: 100000,
    promptFirewallEnabled: true,
    gdprEnabled: true,
    hipaaEnabled: true,
    ndprEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    webhooksEnabled: true,
  });

  const set = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }));

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: t.card, borderColor: t.cardBorder }}>
      <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: t.border }}>
        <div className="p-2 rounded-xl" style={{ backgroundColor: t.primary + '18', color: t.primary }}>{icon}</div>
        <h3 className="font-bold" style={{ color: t.text }}>{title}</h3>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium" style={{ color: t.text }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: t.textFaint }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!value)}
        className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
        style={{ backgroundColor: value ? t.primary : t.border }}>
        <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: value ? '24px' : '4px' }} />
      </button>
    </div>
  );

  const Field = ({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (v: any) => void; type?: string }) => (
    <div>
      <label className="text-xs mb-1 block" style={{ color: t.textFaint }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(type === 'number' ? +e.target.value : e.target.value)}
        className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
        style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: t.text }}>Platform Settings</h2>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>Global configuration for the entire Kora platform</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition hover:opacity-90"
          style={{ backgroundColor: saved ? '#22c55e' : t.primary, color: t.primaryText }}>
          <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save All Settings'}
        </button>
      </div>

      {settings.maintenanceMode && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ backgroundColor: '#f59e0b10', borderColor: '#f59e0b40' }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} />
          <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>Maintenance mode is ON — the platform is inaccessible to all users</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Regional & Localisation" icon={<Globe className="w-4 h-4" />}>
          <div className="space-y-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: t.textFaint }}>Default Currency</label>
              <select value={settings.defaultCurrency} onChange={e => set('defaultCurrency', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }}>
                {['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR', 'AED'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: t.textFaint }}>Default Language</label>
              <select value={settings.defaultLanguage} onChange={e => set('defaultLanguage', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
                style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }}>
                {['en', 'fr', 'ar', 'sw', 'yo', 'ig', 'ha'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <Field label="Default Timezone" value={settings.defaultTimezone} onChange={v => set('defaultTimezone', v)} />
          </div>
        </Section>

        <Section title="Platform Controls" icon={<Shield className="w-4 h-4" />}>
          <Toggle label="Maintenance Mode" desc="Shuts down the platform for all users" value={settings.maintenanceMode} onChange={v => set('maintenanceMode', v)} />
          <Toggle label="Open Registration" desc="Allow new tenant sign-ups" value={settings.registrationOpen} onChange={v => set('registrationOpen', v)} />
          <Field label="Max Tenants per Email" value={settings.maxTenantsPerEmail} onChange={v => set('maxTenantsPerEmail', v)} type="number" />
          <Field label="Platform Fee %" value={settings.platformFeePercent} onChange={v => set('platformFeePercent', v)} type="number" />
        </Section>

        <Section title="AI & Intelligence" icon={<Cpu className="w-4 h-4" />}>
          <Toggle label="AI Features Enabled" desc="Enables AI across all tenant dashboards" value={settings.aiEnabled} onChange={v => set('aiEnabled', v)} />
          <Toggle label="Prompt Firewall" desc="Block SQL injection, jailbreaks, PII leaks" value={settings.promptFirewallEnabled} onChange={v => set('promptFirewallEnabled', v)} />
          <div>
            <label className="text-xs mb-1 block" style={{ color: t.textFaint }}>Default AI Model</label>
            <select value={settings.aiModel} onChange={e => set('aiModel', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none"
              style={{ backgroundColor: t.surface, borderColor: t.border, color: t.text }}>
              {['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <Field label="Default AI Tokens/Month per Tenant" value={settings.aiTokensDefaultMonthly} onChange={v => set('aiTokensDefaultMonthly', v)} type="number" />
        </Section>

        <Section title="Compliance & Notifications" icon={<Bell className="w-4 h-4" />}>
          <Toggle label="GDPR Compliance" desc="EU data protection enforcement" value={settings.gdprEnabled} onChange={v => set('gdprEnabled', v)} />
          <Toggle label="HIPAA Compliance" desc="Healthcare data protection" value={settings.hipaaEnabled} onChange={v => set('hipaaEnabled', v)} />
          <Toggle label="NDPR Compliance" desc="Nigeria Data Protection Regulation" value={settings.ndprEnabled} onChange={v => set('ndprEnabled', v)} />
          <Toggle label="Email Notifications" desc="System emails to tenants" value={settings.emailNotifications} onChange={v => set('emailNotifications', v)} />
          <Toggle label="SMS Notifications" desc="SMS alerts for critical events" value={settings.smsNotifications} onChange={v => set('smsNotifications', v)} />
          <Toggle label="Webhooks Enabled" desc="Allow tenants to configure webhooks" value={settings.webhooksEnabled} onChange={v => set('webhooksEnabled', v)} />
        </Section>
      </div>
    </div>
  );
}
