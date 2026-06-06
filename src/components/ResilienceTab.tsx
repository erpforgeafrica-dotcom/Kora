import React, { useState } from 'react';
import { ShieldCheck, Server, AlertTriangle, Play, CheckCircle2, ChevronRight, Activity, ArrowRightLeft } from 'lucide-react';

export default function ResilienceTab() {
  const [regions, setRegions] = useState([
    {
      id: 'us-east',
      name: 'GCP US-East (Primary)',
      role: 'Primary Active',
      status: 'Online',
      load: 65,
      latency: 12,
      syncStatus: 'Synchronized'
    },
    {
      id: 'europe-west',
      name: 'GCP Europe-West (Backup)',
      role: 'Hot Standby',
      status: 'Online',
      load: 10,
      latency: 48,
      syncStatus: 'Replicating (0.8s lag)'
    },
    {
      id: 'asia-east',
      name: 'AWS Asia-Pacific (Backup)',
      role: 'Cold Standby',
      status: 'Online',
      load: 5,
      latency: 180,
      syncStatus: 'Replicating (1.2s lag)'
    }
  ]);

  const [isFailoverActive, setIsFailoverActive] = useState(false);
  const [failoverStep, setFailoverStep] = useState<string | null>(null);

  const triggerFailoverSimulation = () => {
    setIsFailoverActive(true);
    setFailoverStep('1. Simulating complete GCP US-East power failure...');
    
    // Step 2
    setTimeout(() => {
      setRegions(prev => prev.map(r => {
        if (r.id === 'us-east') return { ...r, status: 'FAILED', load: 0, latency: 9999, syncStatus: 'OFFLINE' };
        if (r.id === 'europe-west') return { ...r, role: 'Primary Active', load: 85, latency: 31, syncStatus: 'Synchronized' };
        return r;
      }));
      setFailoverStep('2. Rerouting 100% of global ingress traffic using DNS Anycast failover to GCP Europe-West...');
    }, 2000);

    // Step 3
    setTimeout(() => {
      setRegions(prev => prev.map(r => {
        if (r.id === 'asia-east') return { ...r, role: 'Hot Standby', load: 15, latency: 155, syncStatus: 'Replicating (0.5s lag)' };
        return r;
      }));
      setFailoverStep('3. Failover completed successfully in 0.42 seconds! Data catalog verified, spanner databases strictly synchronized.');
    }, 4500);
  };

  const resetFailover = () => {
    setIsFailoverActive(false);
    setFailoverStep(null);
    setRegions([
      {
        id: 'us-east',
        name: 'GCP US-East (Primary)',
        role: 'Primary Active',
        status: 'Online',
        load: 65,
        latency: 12,
        syncStatus: 'Synchronized'
      },
      {
        id: 'europe-west',
        name: 'GCP Europe-West (Backup)',
        role: 'Hot Standby',
        status: 'Online',
        load: 10,
        latency: 48,
        syncStatus: 'Replicating (0.8s lag)'
      },
      {
        id: 'asia-east',
        name: 'AWS Asia-Pacific (Backup)',
        role: 'Cold Standby',
        status: 'Online',
        load: 5,
        latency: 180,
        syncStatus: 'Replicating (1.2s lag)'
      }
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1e293b]/75 border border-slate-700/50 rounded-xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="text-emerald-400 w-5 h-5 animate-pulse" />
            Phase 7: Multi-Region Active-Active & DR failover Suite
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Simulate regional database failure, test active failovers, and observe distributed cloud replicas and high availability benchmarks.
          </p>
        </div>
        <div className="flex gap-2">
          {isFailoverActive ? (
            <button
              onClick={resetFailover}
              className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Reset Topology Restructures
            </button>
          ) : (
            <button
              onClick={triggerFailoverSimulation}
              className="bg-red-500 hover:bg-red-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" /> Inject Regional Power Loss Incident
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Regions status grid (2 Columns wide if fit) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center text-sm font-semibold text-slate-300 pb-1">
            <span>Global Ingress Cloud Nodes status</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              Synchronized replications active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {regions.map((reg) => (
              <div
                key={reg.id}
                className={`border rounded-xl p-5 space-y-4 transition-all relative overflow-hidden bg-slate-900/60 ${
                  reg.status === 'FAILED'
                    ? 'border-red-500/40 bg-red-950/10'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">{reg.role}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                        reg.status === 'Online'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {reg.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm mt-1">{reg.name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-800/60 font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Load capacity</span>
                    <span className="text-slate-200 font-bold text-sm">{reg.load}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase block">Latency rate</span>
                    <span className="text-slate-200 font-bold text-sm">
                      {reg.latency === 9999 ? '∞ ms' : `${reg.latency} ms`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] border-t border-slate-800/30 flex items-center gap-1.5 font-mono text-slate-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${reg.status === 'Online' ? 'bg-emerald-400' : 'bg-red-500'}`} />
                  {reg.syncStatus}
                </div>
              </div>
            ))}
          </div>

          {/* DR Sequence log output */}
          {failoverStep && (
            <div className="bg-[#0f172a] border border-slate-850 rounded-xl p-5 space-y-3 animate-fade-in text-xs font-mono">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Active Failover Logging stream:</span>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 text-slate-300 whitespace-pre-wrap leading-relaxed border-l-4 border-l-red-500">
                {failoverStep}
              </div>
            </div>
          )}
        </div>

        {/* Global replication parameters side panel */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase pb-2 border-b border-slate-800 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-emerald-400" />
            Distributed Spanner parameters
          </h3>

          <div className="space-y-4 text-xs font-mono text-slate-400">
            <div className="p-3 bg-slate-900 rounded-lg space-y-1">
              <span className="text-slate-500 text-[10px] block">REPLICATION CONSENSUS</span>
              <strong className="text-emerald-400 text-sm font-bold block">Raft Consensus Managed</strong>
              <p className="text-[10px] mt-1 text-slate-500 font-sans">Enforces global linearizable consistency guarantees across replicas.</p>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg space-y-1">
              <span className="text-slate-500 text-[10px] block">RPO TARGET (RECOVERY POINT OBJECTIVE)</span>
              <strong className="text-emerald-400 text-sm font-bold block">RPO = 0 (Strict Integrity)</strong>
              <p className="text-[10px] mt-1 text-slate-500 font-sans">Multi-Paxos journaling guarantees zero transactions can drop during regional fails.</p>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg space-y-1">
              <span className="text-slate-500 text-[10px] block">RTO TARGET (RECOVERY TIME OBJECTIVE)</span>
              <strong className="text-sky-400 text-sm font-bold block">RTO &lt; 0.5 Seconds</strong>
              <p className="text-[10px] mt-1 text-slate-500 font-sans">DNS priority swaps ensure seamless reroutes within milliseconds.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
