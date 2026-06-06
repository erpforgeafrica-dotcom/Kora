import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, Heart, CheckCircle2, Play, Terminal, Layers, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AuditLog } from '../types';

export default function ObservabilityTab() {
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: 'log-01',
      timestamp: '14:05:12',
      component: 'Prompt Firewall',
      action: 'Adversarial SQL injection signature blocked',
      user: 'Anonymous (Malicious)',
      severity: 'Critical',
      hash: '0000a6e0e9140285a8efb54cf854facbfd905'
    },
    {
      id: 'log-02',
      timestamp: '14:06:45',
      component: 'Cloud Spanner Connector',
      action: 'RLS database transaction query parsed',
      user: 'Tenant-A-Admin',
      severity: 'Info',
      hash: '00003f56da2451bd8a9c39ce95a0dcff23'
    },
    {
      id: 'log-03',
      timestamp: '14:08:11',
      component: 'IAM Certificate Vault',
      action: 'CISO master root keys rotated successfully',
      user: 'CISO-OFFICE-ROOT',
      severity: 'Info',
      hash: '000a12e8bcef8d56b26ecf1489e2cb838'
    }
  ]);

  // Dynamic telemetry statistics (Recharts stream)
  const [telemetryData, setTelemetryData] = useState([
    { name: '10s ago', cleanRequests: 45, threatAttempts: 2, systemLatency: 12 },
    { name: '8s ago', cleanRequests: 55, threatAttempts: 0, systemLatency: 15 },
    { name: '6s ago', cleanRequests: 60, threatAttempts: 3, systemLatency: 28 }, // spike
    { name: '4s ago', cleanRequests: 50, threatAttempts: 1, systemLatency: 14 },
    { name: '2s ago', cleanRequests: 70, threatAttempts: 0, systemLatency: 11 },
    { name: 'Now', cleanRequests: 65, threatAttempts: 5, systemLatency: 19 }
  ]);

  // SOAR crisises playbook state
  const [soarActions, setSoarActions] = useState([
    { id: 'isolate', label: 'Quarantine Obsolete Sandbox Backdoors (Phase 1 Target)', active: false },
    { id: 'rekey', label: 'Re-cryptographize Auth Signing Vault (Phase 2 Target)', active: false },
    { id: 'enforce-rls', label: 'Enforce Global Tenant RLS Check (Phase 3 Target)', active: false }
  ]);

  // Local ticks for telemetry variability
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryData(prev => {
        const sliced = prev.slice(1);
        const randomThreat = Math.random() > 0.6 ? Math.floor(Math.random() * 4) : 0;
        const latency = 10 + Math.floor(Math.random() * 20);
        return [
          ...sliced,
          {
            name: `${new Date().toLocaleTimeString().split(' ')[0]}`,
            cleanRequests: 40 + Math.floor(Math.random() * 40),
            threatAttempts: randomThreat,
            systemLatency: latency
          }
        ];
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleTriggerSOAR = (id: string, label: string) => {
    setSoarActions(prev => prev.map(a => a.id === id ? { ...a, active: true } : a));
    
    // Add a SOAR audit log
    const newLog: AuditLog = {
      id: `soar-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      component: 'SOAR Crisis Orchestrator',
      action: `Crisis Playbook Triggered: ${label} - Remediated Node`,
      user: 'SYSTEM-SECURE-BOT',
      severity: 'Critical',
      hash: '0000e3fb8f2dd71b0768fe2dcd7512ab4847e'
    };

    setLogs(prev => [newLog, ...prev]);

    setTimeout(() => {
      setSoarActions(prev => prev.map(a => a.id === id ? { ...a, active: false } : a));
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-[#1e293b]/75 border border-slate-700/50 rounded-xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="text-emerald-400 w-5 h-5 animate-pulse" />
            Phase 6: SIEM Observability & SOAR Crisis Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Analyze real-time server security performance using interactive OpenTelemetry sensors, track SIEM event logs, and trigger automated playbook remediations.
          </p>
        </div>
      </div>

      {/* Grid: Charts \& SOAR playground */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Real-time telemetry areas charts (8 columns) */}
        <div className="xl:col-span-8 bg-[#0f172a] rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="text-emerald-400 w-4 h-4" />
              OpenTelemetry Real-time Metrics Stream
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-[pulse_1s_infinite]" /> Live telemetry
            </span>
          </div>

          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: 11, borderRadius: 8 }}
                />
                <Area name="Clean Requests/sec" type="monotone" dataKey="cleanRequests" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRequests)" />
                <Area name="Firewall Threat Detections" type="monotone" dataKey="threatAttempts" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-4 border-t border-slate-800">
            <div>
              <span className="text-slate-500 block">Clean API Streams</span>
              <strong className="text-emerald-400 font-mono text-base">99.98% ok</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Active Query Latency</span>
              <strong className="text-sky-400 font-mono text-base">14 ms avg</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold text-red-400">Total Attacks Intercepted</span>
              <strong className="text-red-400 font-mono text-base">1,402 Blocks</strong>
            </div>
          </div>
        </div>

        {/* SOAR Crisis Response playbooks Panel (4 columns) */}
        <div className="xl:col-span-4 bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="text-emerald-400 w-4 h-4 animate-bounce" />
              SOAR Automated crisis Actions
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Select an automated playbook to hot-remediate a discovered defect. This executes immediate quarantine.
            </p>
          </div>

          <div className="space-y-3">
            {soarActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleTriggerSOAR(action.id, action.label)}
                disabled={action.active}
                className={`w-full p-3.5 rounded-lg border text-left text-xs transition-all relative overflow-hidden flex items-center justify-between ${
                  action.active
                    ? 'bg-red-500/10 border-red-500/35 text-red-200'
                    : 'bg-[#1e293b]/35 border-slate-800 text-slate-300 hover:bg-[#1e293b]/65 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="block font-semibold">{action.label}</span>
                  <span className="block text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider">
                    {action.active ? 'Deploying security interceptor...' : 'Standby Playbook Ready'}
                  </span>
                </div>
                <div className="shrink-0 pl-2">
                  {action.active ? (
                    <RefreshCw className="w-4 h-4 text-red-400 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-[#121b2d] rounded-lg border border-slate-800 p-3.5 text-[11px] text-slate-400 leading-normal">
            <strong>SOAR Integration:</strong> Playbook triggers are bound natively to the infrastructure firewall layer. Isolating a compromised API endpoint immediately dumps sandbox configurations and blacklists origin client subnets.
          </div>
        </div>

      </div>

      {/* SIEM logs readout section */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 mt-6 space-y-3">
        <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
          <Terminal className="text-sky-400 w-4 h-4" />
          Active Security Information Event Management (SIEM) Logs
        </h3>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-slate-950 px-4 py-3 rounded-lg border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <span className="font-mono text-slate-500 text-[11px]">{log.timestamp}</span>
                <span
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded font-mono ${
                    log.severity === 'Critical'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}
                >
                  {log.severity}
                </span>
                <span className="text-slate-400 font-mono text-[11px] font-semibold">[{log.component}]</span>
                <span className="text-slate-200">{log.action}</span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>Actor: {log.user}</span>
                <span className="truncate w-24">Hash: {log.hash}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
