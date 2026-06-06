import React, { useState } from 'react';
import { Settings, Globe, Bell, Shield, CreditCard, ArrowRight } from 'lucide-react';
import HelpButton from '../../common/HelpButton';
import ComprehensiveSettings from './ComprehensiveSettings';

export default function RulesModule() {
  const [showFullSettings, setShowFullSettings] = useState(false);

  if (showFullSettings) {
    return (
      <div>
        <button
          onClick={() => setShowFullSettings(false)}
          className="mb-4 text-slate-400 hover:text-white transition text-sm"
        >
          ← Back to Overview
        </button>
        <ComprehensiveSettings />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            Your Business Settings
          </h1>
          <p className="text-slate-400 text-sm mt-1">Control how your business works</p>
        </div>
        <HelpButton module="rules" variant="inline" size="md" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { icon: <Globe className="w-5 h-5" />, emoji: '🌍', label: 'Business Profile', desc: 'Your name, location, and what you do', color: 'emerald', action: () => setShowFullSettings(true) },
          { icon: <Bell className="w-5 h-5" />, emoji: '🔔', label: 'Notifications', desc: 'How you want to be notified', color: 'cyan', action: () => setShowFullSettings(true) },
          { icon: <Shield className="w-5 h-5" />, emoji: '🔒', label: 'Privacy & Security', desc: 'Who can see what', color: 'purple', action: () => setShowFullSettings(true) },
          { icon: <CreditCard className="w-5 h-5" />, emoji: '💳', label: 'Payments & Plan', desc: 'Your subscription and billing', color: 'amber', action: () => setShowFullSettings(true) },
        ].map((item, i) => (
          <button key={i} onClick={item.action} className="flex items-center gap-4 p-5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl text-left transition-all group">
            <div className="flex items-center gap-2">
              <div className={`p-3 rounded-xl text-${item.color}-400 bg-${item.color}-500/10 border border-${item.color}-500/20`}>{item.icon}</div>
              <span className="text-3xl">{item.emoji}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{item.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 transition" />
          </button>
        ))}
      </div>
    </div>
  );
}
