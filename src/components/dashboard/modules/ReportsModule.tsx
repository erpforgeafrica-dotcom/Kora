import React from 'react';
import { BarChart2, TrendingUp, Calendar } from 'lucide-react';
import HelpButton from '../../common/HelpButton';

export default function ReportsModule() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📊</span>
            How Your Business Is Doing
          </h1>
          <p className="text-slate-400 text-sm mt-1">Charts and numbers that show your progress</p>
        </div>
        <HelpButton module="reports" variant="inline" size="md" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'This Week', value: '₦0.00', icon: <Calendar className="w-5 h-5" /> },
          { label: 'This Month', value: '₦0.00', icon: <TrendingUp className="w-5 h-5" /> },
          { label: 'All Time', value: '₦0.00', icon: <BarChart2 className="w-5 h-5" /> },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="inline-flex p-2.5 rounded-xl text-emerald-400 bg-emerald-500/10">{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/3 border border-white/5 rounded-2xl p-12 text-center space-y-4">
        <div className="text-6xl">📈</div>
        <div>
          <h3 className="text-white font-semibold text-lg">Not Enough Data Yet</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">Once you start getting bookings and making money, charts will appear here.</p>
        </div>
      </div>
    </div>
  );
}
