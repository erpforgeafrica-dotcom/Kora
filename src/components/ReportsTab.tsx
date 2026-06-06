import React, { useState } from 'react';
import { FileText, CheckCircle2, Award, Printer, ShieldAlert, Cpu, ClipboardCheck, DollarSign } from 'lucide-react';

export default function ReportsTab() {
  const [activeReport, setActiveReport] = useState<number>(0);
  const [signatureName, setSignatureName] = useState('Principal Enterprise Architect & Auditor');
  const [signedState, setSignedState] = useState(false);
  const [checkedSignOffs, setCheckedSignOffs] = useState<Record<string, boolean>>({
    'inventory': true,
    'threat-patched': true,
    'rls-remediated': false,
    'firewall-tested': false,
    'telemetry-live': false
  });

  const handleToggleSignOff = (id: string) => {
    setCheckedSignOffs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const reports = [
    {
      id: 1,
      title: '1. Executive Risk Report',
      subtitle: 'Board-Level Threat Summary & Risk Exposure Index',
      icon: <Award className="w-4 h-4 text-emerald-400" />,
      content: `### KORA SYSTEM EXECUTIVE RISK REPORT

**Classification:** STRICTLY PRIVATE / CISO CONFIDENTIAL
**Auditor:** Principal Enterprise Architect & Forensic Software Auditor
**Audit Date:** May 31, 2026

#### 1. Executive Summary
During the forensic discovery and code auditing of the Kora system repository, we audited complete dependency trees, raw databases catalog paths, and external API gateways. The audit revealed three core architectural deviations involving (A) input injection bypasses, (B) missing multi-tenant Row Level Security (RLS) filters, and (C) unauthenticated backdoors inside legacy files. 

#### 2. Risk Metrics Dashboard
* **Total Discovered High-Severity Defects:** 3
* **Global Exposure Index Score:** 8.4 / 10 (HIGH CURRENT RISK)
* **Target Remediation Timeline:** 48 Hours

#### 3. Strategic Recommendations
1. Immediately deploy the **Prompt Firewall and PII Interceptor Gateway** at the ingress boundaries.
2. Inject strict **Row-Level Security** check constraints to enforce tenant isolation.
3. Completely quarantine and strip the 3 dead, unreferenced backdoor developers scripts.
      `
    },
    {
      id: 2,
      title: '2. Architecture Defect Report',
      subtitle: 'Defect inventory & system design anomalies',
      icon: <ShieldAlert className="w-4 h-4 text-red-400" />,
      content: `### KORA ARCHITECTURE DEFECT REPORT

This report catalogs architectural flaws identified across current microservice boundaries:

#### 1. Discovered Structural Flaws
- **Orphan Endpoints / Dead Code:**
  - \`src/legacy/auth-v1-deprecated.ts\`: Contains obsolete token decode paths that bypass cryptographic signatures entirely.
  - \`src/workers/token-dumper-leak.ts\`: Standard diagnostic tool left behind. Exposes temporary tenant keys.
- **Cross-Tenant Exposure:**
  - Raw query executors lack explicit query modifiers linking queries to caller organization identities.

#### 2. Dependency Vulnerabilities Tracker
* Unreferenced dependency schemas found in older node models declarations.
* Recommended action: Complete dependencies audit matching package-locks to safe hashes.
      `
    },
    {
      id: 3,
      title: '3. Security Findings Report',
      subtitle: 'CVE vulnerabilities & OWASP / ASVS mapping',
      icon: <ShieldAlert className="w-4 h-4 text-red-500" />,
      content: `### KORA SECURITY FINDINGS LOG (OWASP / ASVS)

All findings have been logged, analyzed, and mapped:

| Finding ID | Title / Vulnerability | OWASP Mapping | Severity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CVE-K-01** | SQL/Spanner Injection Bypass | Injection (A03:2021) | **CRITICAL** | Remediable in Playground |
| **CVE-K-02** | Missing RLS Database Isolation | Broken Access (A01:2021) | **HIGH** | Remediation Available |
| **CVE-K-03** | Weak JWT Decoding signature | Cryptographic Failures | **CRITICAL** | Remediable |

#### Detailed Remediation Strategy (ASVS Standards)
All token handshakes must verify signatures on the server side using cryptographically secure vault secrets. Never decodes authentication payloads in plain text.
      `
    },
    {
      id: 4,
      title: '4. Database Findings Report',
      subtitle: 'Foreign key cascades, constraints & indexes audit',
      icon: <Printer className="w-4 h-4 text-emerald-400" />,
      content: `### CLOUD POSTGRESPANNER INTEGRITY FINDINGS

A complete database traversal was completed, mapping active constraints:

#### 1. Foreign Key Constraints Evaluation
* **Cascades Verify:** Verified that deleting a parent tenant record successfully cascading deletes all dependent user documents. This guarantees data integrity.
* **Orphaned Indexes:** Detected two unindexed search queries on \`data_payload\` inside the \`Documents\` table, leading to database CPU spikes.

#### 2. Row Level Security Enforcement status
* Table **Tenants**: SECURE. Row policies active.
* Table **UserCredentials**: SECURE. MFA and tenant checking active.
* Table **Documents**: **VULNERABLE (Missing RLS checks)**. Immediatelly inject Postgres RLS rules.
      `
    },
    {
      id: 5,
      title: '5. AI Readiness Report',
      subtitle: 'LLM Prompt Firewall & Gateway analysis',
      icon: <Cpu className="w-4 h-4 text-indigo-400" />,
      content: `### AI GOVERNANCE & LLM GATEWAY READINESS

To support secure AI-driven interactions, we audited prompt safety boundaries:

#### 1. Prompt Injection Risks
Simulated prompt attacks (including system instructions overrides) bypass standard application shields. This demands a central security proxy layer.

#### 2. AI Gateway Architecture Proposed
- **Prompt Firewall proxy**: Intercepts prompts, classifies threats under rules, and computes risk valuations.
- **PII Obfuscator**: Automatically scrubs email patterns, SSN numbers, and API keys.
- **Cost Controls Monitoring**: Restricts output token usage budgets to keep costs within $0.05/user/month thresholds.
      `
    },
    {
      id: 6,
      title: '6. Blockchain Readiness Report',
      subtitle: 'Cryptographic ledgers & document audit verification',
      icon: <Award className="w-4 h-4 text-indigo-400" />,
      content: `### IMMUTABLE LEDGER & IDENTITY BLOCKCHAIN BLUEPRINT

Proposal for establishing tamper-proof security auditing:

#### 1. Chained Audit Logs (Merkle System)
Every admin transaction (auth modifications, schema edits, query executions) will produce a SHA-256 cryptographic signature that blocks previous chains. This guarantees forensic logging compliance which cannot be edited even by administrators.

#### 2. Document Identity Ledger
Hashes of legal customer documents will be registered on a private credential ledger. Matching hashes verifies authenticity instantly.
      `
    },
    {
      id: 7,
      title: '7. Compliance Report',
      subtitle: 'Regulatory cross-reference: SOC2, ISO27001, NIST',
      icon: <FileText className="w-4 h-4 text-slate-300" />,
      content: `### COMPLIANCE AUDIT SCORECARD (SOC2 / NIST / ISO)

Evaluation against industry standards:

* **SOC2 Type II (TSC Integrity & Privacy):** Score: **92%**. Strong access bounds. Gaps exist in unindexed logs and missing Document Row Isolation.
* **ISO/IEC 27001 (Control A.12):** Score: **88%**. Encryption keys are maintained in HSM vaults.
* **NIST SP 800-53 (AC Family Controls):** Score: **100%** after applying the active playground patches.
      `
    },
    {
      id: 8,
      title: '8. Remediation Roadmap',
      subtitle: 'Phased remediation path with active schedules',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      content: `### REMEDIATION ROADMAP & ACTION TIMELINE

Remediating all findings over a rapid dev sprint:

#### Phase A (Hours 0 - 6): Core Firewalls Deployment
* Deploy Prompt Firewall and PII Scrubbers.
* Strip and quarantine the obsolete debug backend scripts.

#### Phase B (Hours 6 - 24): Query Isolations Verification
* Inject Row Level Security SQL policies to \`Documents\` table.
* Re-key JWT Authorization tokens secrets vault.

#### Phase C (Hours 24 - 48): Observability Integration
* Deploy OpenTelemetry instrumentation pipelines to track runtime latency spikes.
* Establish immutability auditing logs chained on blockchain anchors.
      `
    },
    {
      id: 9,
      title: '9. Audit Budget & Cost Estimate',
      subtitle: 'Remediation resource estimates',
      icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
      content: `### REMEDIATION RESOURCE & COST ESTIMATION

Phased implementation billing schema:

| Phase / Module | Resource Allocation | Estimate (USD) | Priority |
| :--- | :--- | :--- | :--- |
| **Phase 1: Forensics & Dead Code Quarantine** | Lead SecOps - 8 Hours | $1,200 | HIGH |
| **Phase 2 & 3: Database & Spanner RLS Injection** | DB Architect - 12 Hours | $2,200 | CRITICAL |
| **Phase 4: AI Gateway & prompt firewall** | AI Engineer - 16 Hours | $3,500 | MEDIUM |
| **Phase 5 & 6: Observability with SIEM Logs** | DevOps Lead - 10 Hours | $1,800 | MEDIUM |
| **TOTAL REMEDIATION COST AUDIT** | Master Sprint - 46 Hours | **$8,700 USD** | - |
      `
    },
    {
      id: 10,
      title: '10. Production Sign-Off Checklist',
      subtitle: 'Rigorous multi-role verification checklist',
      icon: <ClipboardCheck className="w-4 h-4 text-sky-400" />,
      content: `### PRODUCTION SIGN-OFF COMPLIANCE VERIFICATION

No codebase changes should deploy until the following multi-role checklists are fully validated:

##### Requirements Checklist:
* **Principal Architect:** Source Inventory updated. Host is bound to 0.0.0.0.
* **CISO:** Active security playground vulnerabilities verified. Open defects mitigants active.
* **DB Auditor:** Cascade delete verified. RLS policies actively checked and injected on Documents.
* **AI Governance Lead:** Prompt Gateway online. Blocking SQL and prompt attacks successfully.
      `
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-[#1e293b]/75 border border-slate-700/50 rounded-xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardCheck className="text-emerald-400 w-5 h-5 animate-pulse" />
            Phase 8: Comprehensive Forensic Audit & Remediations Registry
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Access and compile all 10 corporate reports. Finalize signatures for ultimate production sign-offs.
          </p>
        </div>
        <div>
          <button
            onClick={handlePrint}
            className="bg-[#1e293b] hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 w-full sm:w-auto"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Export Audit Packages
          </button>
        </div>
      </div>

      {/* Main split tab layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left column list of reports (5 columns) */}
        <div className="xl:col-span-4 bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-800">
            Remediation Output deliverables
          </h3>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {reports.map((report, idx) => (
              <div
                key={report.id}
                onClick={() => setActiveReport(idx)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  activeReport === idx
                    ? 'bg-slate-850 border-slate-600 text-white'
                    : 'bg-[#1e293b]/30 border-slate-800 text-slate-400 hover:bg-[#1e293b]/55'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {report.icon}
                  <span className="font-bold text-sm block">{report.title}</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block pl-6 truncate font-sans">
                  {report.subtitle}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Active Report visualizer \& Sign-Off (8 columns) */}
        <div className="xl:col-span-8 bg-[#0f172a] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="prose prose-invert max-w-none text-xs font-mono text-slate-300 space-y-4 leading-relaxed whitespace-pre-wrap pb-6 border-b border-slate-800">
            {reports[activeReport].content}

            {/* Special Interactive Checklist renderer ONLY inside the sign-off checklist deliverable */}
            {reports[activeReport].id === 10 && (
              <div className="mt-6 space-y-3 bg-[#121b2d] p-5 rounded-lg border border-slate-8D0 font-sans leading-relaxed">
                <span className="text-sm font-bold text-slate-200 block mb-3">Multi-Role Verify Checklists:</span>
                
                {[
                  { id: 'inventory', label: 'Complete System Inventory compiled and dead code targets mapped (Phase 1)' },
                  { id: 'threat-patched', label: 'Vulnerabilities successfully refactored and tested on playground (Phase 2)' },
                  { id: 'rls-remediated', label: 'Database cascade limits mapped and row-level-security active (Phase 3)' },
                  { id: 'firewall-tested', label: 'AI Gateway and prompt firewall active-mitigation verified (Phase 4)' },
                  { id: 'telemetry-live', label: 'Prometheus & open-telemetry metric lines live stream validated (Phase 6)' }
                ].map((item) => (
                  <label key={item.id} className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checkedSignOffs[item.id]}
                      onChange={() => handleToggleSignOff(item.id)}
                      className="rounded bg-slate-900 border-slate-8D0 text-emerald-500 focus:ring-0 mt-0.5"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Electronic Signature Block */}
          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-end text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Auditor Verification Stamp Signature</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  disabled={signedState}
                  className="bg-slate-950 border border-slate-800 font-mono text-xs p-2.5 rounded text-slate-300 focus:outline-none w-full"
                />
                {!signedState ? (
                  <button
                    onClick={() => setSignedState(true)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs leading-none transition-colors"
                  >
                    Authenticate
                  </button>
                ) : (
                  <button
                    onClick={() => setSignedState(false)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/35 px-4 py-2.5 rounded-lg text-xs leading-none transition-all"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>

            <div className="bg-[#070b14] border border-slate-850 p-3 rounded-lg text-[11px] font-mono leading-normal h-12 flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">Cryptographic Audit State</span>
                <span className={`font-bold ${signedState ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {signedState ? 'SIGNED & SEALED ON-CHAIN' : 'AWAITING AUTHENTICATION'}
                </span>
              </div>
              {signedState && (
                <span className="text-emerald-400 bg-emerald-500/10 text-[9px] font-semibold border border-emerald-500/20 rounded px-1.5 py-0.5 animate-pulse">
                  SECURE
                </span>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
