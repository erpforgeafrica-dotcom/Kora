import React, { useState } from 'react';
import {
  TrendingUp, Users, CalendarCheck, DollarSign, Plus,
  ArrowRight, BookOpen, Package, BarChart2, LogOut,
  Star, ShoppingBag, Clock, MapPin, Bell, Palette, Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, THEMES } from '../../context/ThemeContext';
import ContextSwitcher from './ContextSwitcher';
import HelpButton from '../common/HelpButton';
import { getIndustryConfig } from '../../lib/industryConfig';
import ModuleNavigation, { ModuleKey } from './ModuleNavigation';
import BookingsModule from './modules/BookingsModule';
import MoneyModule from './modules/MoneyModule';
import TeamModule from './modules/TeamModule';
import CustomersModule from './modules/CustomersModule';
import StockModule from './modules/StockModule';
import ReportsModule from './modules/ReportsModule';
import RulesModule from './modules/RulesModule';
import AssistantModule from './modules/AssistantModule';

interface Props { onNavigate?: (view: string) => void; }

export default function KoraDashboard({ onNavigate }: Props) {
  const { entity, tenant, viewMode, signOut } = useAuth();
  const { theme, setThemeId } = useTheme();
  const [activeModule, setActiveModule] = useState<ModuleKey>('home');
  const [themeOpen, setThemeOpen] = useState(false);
  const name = entity?.first_name ?? 'there';
  const industryConfig = getIndustryConfig(tenant?.industry || null);

  const t = theme; // shorthand

  const businessStats = [
    { label: industryConfig.stats.revenue,   value: '₦0.00', icon: <DollarSign className="w-5 h-5" />,   emoji: '💰', color: t.primary },
    { label: industryConfig.stats.bookings,  value: '0',     icon: <CalendarCheck className="w-5 h-5" />, emoji: '📅', color: '#06b6d4' },
    { label: industryConfig.stats.customers, value: '0',     icon: <Users className="w-5 h-5" />,          emoji: '👥', color: '#a855f7' },
    { label: industryConfig.stats.growth,    value: '+0%',   icon: <TrendingUp className="w-5 h-5" />,    emoji: '📈', color: '#f59e0b' },
  ];

  const consumerStats = [
    { label: 'Coming Up Soon', value: '0', icon: <Clock className="w-5 h-5" />,      emoji: '⏰', color: '#06b6d4' },
    { label: 'My Favourites',  value: '0', icon: <Star className="w-5 h-5" />,        emoji: '⭐', color: '#f59e0b' },
    { label: 'My Orders',      value: '0', icon: <ShoppingBag className="w-5 h-5" />, emoji: '🛍️', color: '#a855f7' },
    { label: 'Near Me',        value: '0', icon: <MapPin className="w-5 h-5" />,      emoji: '📍', color: t.primary },
  ];

  const stats = viewMode === 'business' ? businessStats : consumerStats;

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: t.bg, color: t.text }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 border-b px-6 py-3 flex items-center justify-between backdrop-blur-md"
        style={{ backgroundColor: t.header, borderColor: t.border }}
      >
        <div className="flex items-center gap-4">
          <div className="text-lg font-black tracking-widest font-mono" style={{ color: t.primary }}>KORA</div>
          <ContextSwitcher />
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-xl border transition opacity-60 hover:opacity-100"
            style={{ borderColor: t.border }}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          <HelpButton module={activeModule === 'home' ? 'home' : activeModule} size="sm" />

          {/* ── Theme Picker ── */}
          <div className="relative">
            <button
              onClick={() => setThemeOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition"
              style={{ borderColor: t.border, backgroundColor: t.card, color: t.textMuted }}
              title="Change Theme"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.emoji} {t.name}</span>
            </button>

            {themeOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl border shadow-2xl overflow-hidden"
                  style={{
                    backgroundColor: t.surface,
                    borderColor: t.border,
                    animation: 'slideDown 0.2s cubic-bezier(0.16,1,0.3,1) both',
                  }}
                >
                  <div className="px-4 py-3 border-b text-xs font-bold uppercase tracking-wider" style={{ borderColor: t.border, color: t.textFaint }}>
                    Choose Theme
                  </div>
                  <div className="p-2 space-y-0.5">
                    {THEMES.map(th => (
                      <button
                        key={th.id}
                        onClick={() => { setThemeId(th.id); setThemeOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-left"
                        style={{
                          backgroundColor: theme.id === th.id ? th.primary + '20' : 'transparent',
                          color: t.text,
                        }}
                      >
                        <span
                          className="w-5 h-5 rounded-full flex-shrink-0 border-2"
                          style={{
                            backgroundColor: th.primary,
                            borderColor: theme.id === th.id ? '#fff' : 'transparent',
                          }}
                        />
                        <span className="text-sm flex-1">{th.emoji} {th.name}</span>
                        {theme.id === th.id && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: th.primary }} />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${t.primary}, #06b6d4)`, color: t.bg }}
          >
            {name.charAt(0).toUpperCase()}
          </div>

          <button
            onClick={signOut}
            className="p-2 rounded-xl border opacity-60 hover:opacity-100 hover:text-red-400 transition"
            style={{ borderColor: t.border }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Module Nav ── */}
      {viewMode === 'business' && (
        <div style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}>
          <ModuleNavigation
            activeModule={activeModule}
            onModuleChange={setActiveModule}
            industry={tenant?.industry || null}
            viewMode={viewMode}
          />
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {viewMode === 'business' && activeModule !== 'home' ? (
          <>
            {activeModule === 'bookings'  && <BookingsModule industry={tenant?.industry || null} />}
            {activeModule === 'money'     && <MoneyModule />}
            {activeModule === 'team'      && <TeamModule />}
            {activeModule === 'customers' && <CustomersModule />}
            {activeModule === 'stock'     && <StockModule industry={tenant?.industry || null} />}
            {activeModule === 'reports'   && <ReportsModule />}
            {activeModule === 'rules'     && <RulesModule />}
            {activeModule === 'assistant' && <AssistantModule />}
          </>
        ) : (
          <>
            {/* Welcome */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold" style={{ color: t.text }}>
                {viewMode === 'business' ? 'Running Your Business 🚀' : `Hi ${name} 👋`}
              </h1>
              <p className="text-sm" style={{ color: t.textMuted }}>
                {viewMode === 'business'
                  ? `${tenant?.name ?? 'Your business'} • ${tenant?.tier ?? 'BASIC'} plan`
                  : 'Find services, book what you need, and manage everything.'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 space-y-3 border transition-all hover:scale-[1.01]"
                  style={{ backgroundColor: t.card, borderColor: t.cardBorder }}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: s.color + '18', color: s.color }}>
                      {s.icon}
                    </div>
                    <span className="text-2xl">{s.emoji}</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold" style={{ color: t.text }}>{s.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: t.textFaint }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textFaint }}>
                Things You Can Do Right Now
              </h2>

              {viewMode === 'business' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { emoji: industryConfig.quickActions.primaryIcon,   label: industryConfig.quickActions.primary,   sub: 'Quick and easy', module: 'bookings' as ModuleKey, color: t.primary },
                    { emoji: industryConfig.quickActions.secondaryIcon, label: industryConfig.quickActions.secondary, sub: 'Manage your team', module: 'team'     as ModuleKey, color: '#06b6d4' },
                    { emoji: industryConfig.quickActions.tertiaryIcon,  label: industryConfig.quickActions.tertiary,  sub: 'Track what you have', module: 'stock' as ModuleKey, color: '#a855f7' },
                    { emoji: '📊', label: 'See Progress', sub: 'Charts and numbers', module: 'reports' as ModuleKey, color: '#f59e0b' },
                  ].map(a => (
                    <button
                      key={a.module}
                      onClick={() => setActiveModule(a.module)}
                      className="flex items-center gap-3 p-4 rounded-2xl border text-left group transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: t.card, borderColor: t.cardBorder }}
                    >
                      <div className="p-2.5 rounded-xl flex-shrink-0 text-xl" style={{ backgroundColor: a.color + '18' }}>
                        {a.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate" style={{ color: t.text }}>{a.label}</div>
                        <div className="text-xs truncate" style={{ color: t.textFaint }}>{a.sub}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-30 group-hover:opacity-100 transition" style={{ color: t.primary }} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { emoji: '📅', label: 'Book Something',  sub: 'Find places near you', action: () => onNavigate?.('marketplace'), color: t.primary },
                    { emoji: '🛍️', label: 'Shop & Buy',       sub: 'Browse products',      action: () => onNavigate?.('marketplace'), color: '#06b6d4' },
                    { emoji: '📖', label: 'My Bookings',      sub: 'See what\'s coming up', action: () => onNavigate?.('my-bookings'), color: '#a855f7' },
                  ].map((a, i) => (
                    <button
                      key={i}
                      onClick={a.action}
                      className="flex items-center gap-4 p-5 rounded-2xl border text-left group transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: t.card, borderColor: t.cardBorder }}
                    >
                      <div className="p-3 rounded-xl text-2xl flex-shrink-0" style={{ backgroundColor: a.color + '18' }}>
                        {a.emoji}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: t.text }}>{a.label}</div>
                        <div className="text-xs" style={{ color: t.textFaint }}>{a.sub}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 ml-auto opacity-30 group-hover:opacity-100 transition" style={{ color: t.primary }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <div
              className="rounded-2xl p-10 text-center space-y-3 border"
              style={{ backgroundColor: t.card, borderColor: t.cardBorder }}
            >
              <div className="text-4xl">🚀</div>
              <h3 className="font-semibold" style={{ color: t.text }}>
                {viewMode === 'business' ? 'Ready to get started?' : 'Find what you need'}
              </h3>
              <p className="text-sm max-w-sm mx-auto" style={{ color: t.textMuted }}>
                {viewMode === 'business'
                  ? 'Add what you offer so customers can find and book you.'
                  : 'Search thousands of businesses near you.'}
              </p>
              <button
                onClick={() => viewMode === 'business' ? setActiveModule('bookings') : onNavigate?.('marketplace')}
                className="inline-flex items-center gap-2 px-5 py-2.5 font-bold rounded-xl text-sm transition mt-2 hover:opacity-90"
                style={{ backgroundColor: t.primary, color: t.primaryText }}
              >
                {viewMode === 'business' ? 'Add what you offer' : 'Start exploring'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
