import React, { useState } from 'react';
import { Database, AlertCircle, CheckCircle2, ChevronRight, HardDrive, Key, GitCommit, FileText, Lock } from 'lucide-react';
import { DatabaseMetadata } from '../types';

export default function DatabaseTab() {
  const [dbTables, setDbTables] = useState<DatabaseMetadata[]>([
    {
      tableName: 'Tenants',
      rowCount: 1450,
      hasRLS: true,
      indexesCount: 3,
      orphaned: false,
      foreignKeys: [],
      columns: [
        { name: 'tenant_id', type: 'UUID', nullable: false, sensitive: false },
        { name: 'name', type: 'VARCHAR(255)', nullable: false, sensitive: false },
        { name: 'tier', type: 'VARCHAR(50)', nullable: false, sensitive: false },
        { name: 'created_at', type: 'TIMESTAMP', nullable: false, sensitive: false }
      ]
    },
    {
      tableName: 'Documents',
      rowCount: 452030,
      hasRLS: false, // Critical warning target!
      indexesCount: 4,
      orphaned: false,
      foreignKeys: [
        { column: 'tenant_id', referencesTable: 'Tenants', referencesColumn: 'tenant_id', cascade: true }
      ],
      columns: [
        { name: 'doc_id', type: 'UUID', nullable: false, sensitive: false },
        { name: 'tenant_id', type: 'UUID', nullable: false, sensitive: false },
        { name: 'doc_name', type: 'VARCHAR(500)', nullable: false, sensitive: false },
        { name: 'data_payload', type: 'JSONB', nullable: true, sensitive: true },
        { name: 'hash_signature', type: 'VARCHAR(64)', nullable: false, sensitive: false }
      ]
    },
    {
      tableName: 'UserCredentials',
      rowCount: 24040,
      hasRLS: true,
      indexesCount: 2,
      orphaned: false,
      foreignKeys: [
        { column: 'tenant_id', referencesTable: 'Tenants', referencesColumn: 'tenant_id', cascade: true }
      ],
      columns: [
        { name: 'user_id', type: 'UUID', nullable: false, sensitive: false },
        { name: 'tenant_id', type: 'UUID', nullable: false, sensitive: false },
        { name: 'email', type: 'VARCHAR(255)', nullable: false, sensitive: true },
        { name: 'password_hash', type: 'VARCHAR(128)', nullable: false, sensitive: true },
        { name: 'role_id', type: 'VARCHAR(50)', nullable: false, sensitive: false },
        { name: 'is_mfa_active', type: 'BOOLEAN', nullable: false, sensitive: false }
      ]
    },
    {
      tableName: 'AuditLedgerBlocks',
      rowCount: 51200,
      hasRLS: true,
      indexesCount: 2,
      orphaned: false,
      foreignKeys: [],
      columns: [
        { name: 'block_hash', type: 'VARCHAR(64)', nullable: false, sensitive: false },
        { name: 'previous_hash', type: 'VARCHAR(64)', nullable: false, sensitive: false },
        { name: 'payload', type: 'JSONB', nullable: false, sensitive: false },
        { name: 'timestamp', type: 'TIMESTAMP', nullable: false, sensitive: false }
      ]
    }
  ]);

  const [selectedTable, setSelectedTable] = useState<string>('Documents');
  const [isLineageOpen, setIsLineageOpen] = useState<boolean>(true);
  const activeTable = dbTables.find(t => t.tableName === selectedTable) || dbTables[0];

  const handleRemediateRLS = (tableName: string) => {
    setDbTables(prev => prev.map(t => {
      if (t.tableName === tableName) {
        return { ...t, hasRLS: true };
      }
      return t;
    }));
  };

  const activeColumnStats = {
    sensitive: activeTable.columns.filter(c => c.sensitive).length,
    total: activeTable.columns.length
  };

  return (
    <div className="space-y-6">
      {/* Tab intro header */}
      <div className="bg-[#1e293b]/70 border border-slate-700/50 rounded-xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="text-emerald-400 w-5 h-5 animate-pulse" />
            Phase 3: Database & Cloud Ledger Integrity Audit
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Audit key cascades, Row-Level Security (RLS) constraints, index efficiencies, and map data compliance lineages under SOX / SOC2 rules.
          </p>
        </div>
      </div>

      {/* Main split work space */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left hand: Data tables registry \& RLS Audits */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Database Catalogue Schema</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 rounded-full font-mono">
                PostgreSpanner SQL
              </span>
            </h3>

            <div className="space-y-2.5">
              {dbTables.map((tbl) => (
                <div
                  key={tbl.tableName}
                  onClick={() => setSelectedTable(tbl.tableName)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    selectedTable === tbl.tableName
                      ? 'bg-slate-800/80 border-slate-600 text-white'
                      : 'bg-[#1e293b]/35 border-slate-800/60 text-slate-300 hover:bg-[#1e293b]/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <HardDrive className={`w-4 h-4 ${selectedTable === tbl.tableName ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <span className="font-bold font-mono text-sm block">{tbl.tableName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">Count: {tbl.rowCount.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {tbl.hasRLS ? (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                        RLS ENABLED
                      </span>
                    ) : (
                      <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded uppercase font-mono font-bold animate-pulse">
                        RLS MISSING
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RLS Remediater Callout */}
          {!activeTable.hasRLS && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 animate-bounce" />
                <h4 className="text-sm font-bold">CRITICAL DEVIATION: Missing Tenant RLS!</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The <code className="text-red-300 bg-slate-900 px-1 py-0.5 rounded">{activeTable.tableName}</code> table currently lacks strict row-level security isolation. Authenticated users could potentially construct multi-user database bypass sweeps.
              </p>
              <button
                onClick={() => handleRemediateRLS(activeTable.tableName)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg w-full transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Inject PostgreSQL Spanner RLS Policy
              </button>
            </div>
          )}
        </div>

        {/* Center/Right columns: Detailed inspection with columns catalog, lineage flowing */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Table Inspector */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <span className="text-slate-400 font-mono text-[11px] uppercase block">Selected Inspector</span>
                <span className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                  {activeTable.tableName === 'Documents' ? (
                     <FileText className="text-emerald-400 w-4 h-4" />
                  ) : (
                     <Key className="text-emerald-400 w-4 h-4" />
                  )}
                  {activeTable.tableName} Schema Attributes
                </span>
              </div>
              <div className="text-right text-xs font-mono text-slate-400">
                Columns: <strong className="text-slate-200">{activeColumnStats.total}</strong> | Sensitive: <strong className="text-red-400">{activeColumnStats.sensitive}</strong>
              </div>
            </div>

            {/* Keys & Cascade indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg space-y-2 border border-slate-800/60">
                <span className="font-semibold text-slate-300 uppercase tracking-wider block text-[10px]">Foreign Keys & Cascade Chains</span>
                {activeTable.foreignKeys.length > 0 ? (
                  activeTable.foreignKeys.map((fk, idx) => (
                    <div key={idx} className="flex gap-2 items-center leading-relaxed">
                      <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{fk.column}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">{fk.referencesTable}({fk.referencesColumn})</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-500 font-mono bg-emerald-500/10 px-1.5 rounded ml-auto">
                        CASCADE ON DELETE
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500 block">No outbound foreign key limits specified.</span>
                )}
              </div>

              <div className="p-3 bg-slate-900 rounded-lg space-y-2 border border-slate-800/60">
                <span className="font-semibold text-slate-300 uppercase tracking-wider block text-[10px]">Cloud Indexes & Performance Metrics</span>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-400">Database Indexes Configured</span>
                  <span className="text-slate-200 font-bold">{activeTable.indexesCount} active</span>
                </div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-400">B-Tree Keys optimization</span>
                  <span className="text-emerald-400 font-semibold">99.8% hit rate</span>
                </div>
              </div>
            </div>

            {/* Column properties catalog */}
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#070b14]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121b2d] font-mono text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Column Name</th>
                    <th className="px-5 py-3">Type Standard</th>
                    <th className="px-5 py-3">Nullable</th>
                    <th className="px-5 py-3">Security Isolation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/55 font-sans text-slate-300">
                  {activeTable.columns.map((col, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="px-5 py-3 font-mono text-slate-100">{col.name}</td>
                      <td className="px-5 py-3 font-mono text-slate-400">{col.type}</td>
                      <td className="px-5 py-3 text-slate-450">{col.nullable ? 'YES' : 'NO'}</td>
                      <td className="px-5 py-3">
                        {col.sensitive ? (
                          <span className="bg-red-405/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3" /> PII Classified (ENCRYPTED)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Lineage visualization block */}
          <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <GitCommit className="text-emerald-400 w-4 h-4 animate-pulse" />
                SOX Strict - Data Lineage Flow
              </h4>
              <button
                onClick={() => setIsLineageOpen(!isLineageOpen)}
                className="text-xs text-slate-400 hover:text-white underline font-mono"
              >
                {isLineageOpen ? 'Collapse visualization' : 'Expand Flow'}
              </button>
            </div>

            {isLineageOpen && (
              <div className="bg-[#070b14] border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono relative">
                
                {/* Visualizing flow from Input -> API Gateway -> Isolation check -> Database block */}
                <div className="bg-slate-900 text-slate-300 p-3 rounded-lg border border-slate-800 w-full md:w-auto text-center space-y-1">
                  <strong className="text-white block font-sans">User Endpoint Input</strong>
                  <span className="text-slate-400 block text-[10px]">Unsanitized Request Params</span>
                  <span className="text-[10px] bg-red-400/10 text-red-400 px-1 py-0.5 rounded font-mono">TLS Stream</span>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-600 hidden md:block" />

                <div className="bg-slate-900 text-slate-300 p-3 rounded-lg border border-indigo-900/45 w-full md:w-auto text-center space-y-1">
                  <strong className="text-indigo-400 block font-sans">AI & SecOps Gateway</strong>
                  <span className="text-slate-400 block text-[10px]">Prompt Firewall / PII Filter</span>
                  <span className="text-[10px] bg-[#1a2e45] text-sky-400 px-1.5 py-0.5 rounded">Active Audit</span>
                </div>

                <ChevronRight className="w-5 h-5 text-indigo-400 hidden md:block" />

                <div className="bg-slate-900 text-slate-300 p-3 rounded-lg border border-emerald-900/40 w-full md:w-auto text-center space-y-1">
                  <strong className="text-emerald-400 block font-sans">Query Boundary Shield</strong>
                  <span className="text-slate-400 block text-[10px]">Cloud Spanner Isolation API</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">RLS Enforced</span>
                </div>

                <ChevronRight className="w-5 h-5 text-emerald-400 hidden md:block" />

                <div className="bg-slate-950 text-slate-300 p-3 rounded-lg border border-emerald-500 w-full md:w-auto text-center space-y-1">
                  <strong className="text-white block font-sans">PostgreSpanner DB Ledger</strong>
                  <span className="text-slate-400 block text-[10px]">Cascaded Relational Storage</span>
                  <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-bold">Immutability Secured</span>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
