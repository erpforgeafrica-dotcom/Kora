import React from 'react';
import {
  Home, CalendarCheck, DollarSign, Users, Package,
  BarChart2, Settings, Bot, UserCircle, ShoppingBag,
} from 'lucide-react';
import { getIndustryConfig } from '../../lib/industryConfig';
import { useTheme } from '../../context/ThemeContext';

export type ModuleKey = 'home' | 'bookings' | 'money' | 'team' | 'customers' | 'stock' | 'reports' | 'rules' | 'assistant' | 'profile' | 'marketplace' | 'my-bookings';

interface Props {
  activeModule: ModuleKey;
  onModuleChange: (module: ModuleKey) => void;
  industry: string | null;
  viewMode: 'business' | 'consumer';
}

export default function ModuleNavigation({ activeModule, onModuleChange, industry, viewMode }: Props) {
  const config = getIndustryConfig(industry);
  const { theme: t } = useTheme();

  const businessModules = [
    { key: 'home' as const, icon: Home, label: 'Home', emoji: '🏠' },
    { key: 'bookings' as const, icon: CalendarCheck, label: config.labels.bookings, emoji: '📅' },
    { key: 'money' as const, icon: DollarSign, label: config.labels.money, emoji: '💰' },
    { key: 'team' as const, icon: Users, label: config.labels.team, emoji: '👥' },
    { key: 'customers' as const, icon: Users, label: config.labels.customers, emoji: '👤' },
    { key: 'stock' as const, icon: Package, label: config.labels.stock, emoji: '📦' },
    { key: 'reports' as const, icon: BarChart2, label: config.labels.reports, emoji: '📊' },
    { key: 'rules' as const, icon: Settings, label: config.labels.rules, emoji: '⚙️' },
    { key: 'assistant' as const, icon: Bot, label: config.labels.assistant, emoji: '🤖' },
  ];

  const consumerModules = [
    { key: 'home' as const, icon: Home, label: 'Home', emoji: '🏠' },
    { key: 'marketplace' as const, icon: ShoppingBag, label: 'Find Places', emoji: '🔍' },
    { key: 'my-bookings' as const, icon: CalendarCheck, label: 'My Bookings', emoji: '📅' },
    { key: 'profile' as const, icon: UserCircle, label: 'My Profile', emoji: '👤' },
  ];

  const modules = viewMode === 'business' ? businessModules : consumerModules;

  return (
    <nav className="px-6 overflow-x-auto">
      <div className="flex items-center gap-0.5 min-w-max">
        {modules.map(m => {
          const Icon = m.icon;
          const isActive = activeModule === m.key;
          return (
            <button
              key={m.key}
              onClick={() => onModuleChange(m.key)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2"
              style={{
                color:       isActive ? t.primary : t.textFaint,
                borderColor: isActive ? t.primary : 'transparent',
              }}
            >
              <span className="text-base">{m.emoji}</span>
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
