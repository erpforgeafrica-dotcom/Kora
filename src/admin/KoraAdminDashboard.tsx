import React, { useState } from 'react';
import {
  LayoutDashboard, Building2, Globe, CreditCard, Users,
  Store, Shield, Settings, LogOut, ChevronRight, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEMES } from '../context/ThemeContext';
import OverviewSection from './sections/OverviewSection';
import TenantsSection from './sections/TenantsSection';
import IndustriesSection from './sections/IndustriesSection';
import PlansSection from './sections/PlansSection';
import UsersSection from './sections/UsersSection';
import MarketplaceCMSSection from './sections/MarketplaceCMSSection';
import AuditSection from './sections/AuditSection';
import PlatformSettingsSection from './sections/PlatformSettingsSection';

type AdminSection =
  | 'overview' | 'tenants' | 'industries' | 'plans'
  | 'users' | 'marketplace' | 'audit' | 'settings';

const NAV: { id: AdminSection; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'overview',     label: 'Platform Overview',    icon: <LayoutDashboard className="w-4 h-4" />, desc: 'Live stats & health' },
  { id: 'tenants',      label: 'Tenant Management',    icon: <Building2 className="w-4 h-4" />,       desc: 'Activate, suspend, freeze' },
  { id: 'industries',   label: 'Industries',           icon: <Globe className="w-4 h-4" />,           desc: 'Dynamic industry config' },
  { id: 'plans',        label: 'Subscription Plans',   icon: <CreditCard className="w-4 h-4" />,      desc: 'Pricing & feature flags' },
  { id: 'users',        label: 'Users & RBAC',         icon: <Users className="w-4 h-4" />,           desc: 'All platform users' },
  { id: 'marketplace',  label: 'Marketplace CMS',      icon: <Store className="w-4 h-4" />,           desc: 'Listings & verification' },
  { id: 'audit',        label: 'Audit & Forensics',    icon: <Shield className="w-4 h-4" />,          desc: 'Immutable event log' },
  { id: 'settings',     label: 'Platform Settings',    icon: <Settings className="w-4 h-4" />,        desc: 'Global configuration' },
];

interface Props { onExit: () => void; }

export default function KoraAdminDashboard({ onExit }: Props) {
  const { user, isPlatformAdmin, signOut } = useAuth();
  const { theme: t, setThemeId } = useTheme();
  const [active, setActive] = useState<AdminSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Hard guard — never render if not platform admin
  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: t.bg }}>
        <div className="text-center space-y-4 p-8">
          <Shield className="w-16 h-16 mx-auto" style={{ color: '#ef4444' }} />
          <h1 className="text-2xl font-bold" style={{ color: t.text }}>Access Denied</h1>
          <p className="text-sm" style={{ color: t.textMuted }}>You don't have platform admin privileges.</p>
          <button onClick={onExit} className="px-6 py-2.5 rounded-xl font-bold text-sm" style={{ backgroundColor: t.primary, color: t.primaryText }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const SECTION_MAP: Record<AdminSection, React.ReactNode> = {
    overview: <OverviewSection />,
    tenants: <TenantsSection />,
    industries: <IndustriesSection />,
    plans: <PlansSection />,
    users: <UsersSection />,
    marketplace: <MarketplaceCMSSection />,
    audit: <AuditSection />,
    settings: <PlatformSettingsSection />,
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: t.bg }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static z-50 h-full w-64 flex flex-col border-r transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ backgroundColor: t.surface, borderColor: t.border }}>

        {/* Logo */}
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: t.border }}>
          <div>
            <div className="text-lg font-black tracking-widest font-mono" style={{ color: t.primary }}>KORA</div>
            <div className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: t.textFaint }}>Admin Console</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg" style={{ color: t.textMuted }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group"
              style={{
                backgroundColor: active === item.id ? t.primary + '18' : 'transparent',
                color: active === item.id ? t.primary : t.textMuted,
              }}
            >
              <div className="flex-shrink-0" style={{ color: active === item.id ? t.primary : t.textFaint }}>
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{item.label}</div>
                <div className="text-xs truncate" style={{ color: t.textFaint }}>{item.desc}</div>
              </div>
              {active === item.id && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: t.primary }} />}
            </button>
          ))}
        </nav>

        {/* Theme picker */}
        <div className="px-3 py-3 border-t" style={{ borderColor: t.border }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-2 px-3" style={{ color: t.textFaint }}>Theme</div>
          <div className="flex flex-wrap gap-1.5 px-3">
            {THEMES.map(th => (
              <button key={th.id} onClick={() => setThemeId(th.id)} title={th.name}
                className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                style={{ backgroundColor: th.primary, borderColor: t.id === th.id ? '#fff' : 'transparent' }} />
            ))}
          </div>
        </div>

        {/* User + signout */}
        <div className="px-3 py-3 border-t" style={{ borderColor: t.border }}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ backgroundColor: t.card }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${t.primary}, #06b6d4)`, color: t.bg }}>
              {user?.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: t.text }}>{user?.email ?? 'Admin'}</div>
              <div className="text-xs" style={{ color: t.primary }}>Platform Admin</div>
            </div>
            <button onClick={async () => { await signOut(); onExit(); }}
              className="p-1 rounded-lg transition hover:text-red-400 flex-shrink-0" style={{ color: t.textFaint }} title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <button onClick={onExit} className="w-full mt-2 px-3 py-2 rounded-xl text-xs font-semibold border transition hover:opacity-80 text-center"
            style={{ borderColor: t.border, color: t.textMuted }}>
            ← Back to Main App
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 px-6 py-3 border-b flex items-center gap-4" style={{ backgroundColor: t.header, borderColor: t.border }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl border" style={{ borderColor: t.border, color: t.textMuted }}>
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-sm" style={{ color: t.text }}>
              {NAV.find(n => n.id === active)?.label}
            </h1>
            <p className="text-xs" style={{ color: t.textFaint }}>
              {NAV.find(n => n.id === active)?.desc}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold"
            style={{ borderColor: t.primary + '40', color: t.primary, backgroundColor: t.primary + '10' }}>
            <Shield className="w-3.5 h-3.5" /> Platform Admin
          </div>
        </header>

        {/* Section content */}
        <main className="flex-1 p-6 overflow-auto">
          {SECTION_MAP[active]}
        </main>
      </div>
    </div>
  );
}
