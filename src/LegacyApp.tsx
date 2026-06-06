import React, { useState } from 'react';
import {
  ShieldAlert,
  Layers,
  Terminal,
  Database,
  Cpu,
  Network,
  Activity,
  ArrowRightLeft,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Menu,
  X,
  Sliders,
  Compass,
  Video,
  Wallet,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Building,
  TrendingUp,
  BookOpen,
  DollarSign,
  FileText,
  Users,
  ShoppingBag,
  Truck,
  Siren,
  FileSpreadsheet,
  Smartphone,
  Coins,
  FolderHeart,
  Dna,
  Smile,
  Heart,
  Flame,
  Package,
  ClipboardCheck,
  LayoutDashboard
} from 'lucide-react';

// Subcomponents - Pillars 1 to 5
import SbosWorkflowHub from './components/SbosWorkflowHub';
import SimplePlainLanguageDashboard from './components/SimplePlainLanguageDashboard';
import BusinessOpsPillar from './components/BusinessOpsPillar';
import MarketplacePillar from './components/MarketplacePillar';
import TelehealthPillar from './components/TelehealthPillar';
import CommercePillar from './components/CommercePillar';
import AIIntelligencePillar from './components/AIIntelligencePillar';

// Subcomponents - Pillar 6 (Preserving original clinical secops elements)
import ForensicsTab from './components/ForensicsTab';
import SecurityTab from './components/SecurityTab';
import DatabaseTab from './components/DatabaseTab';
import AIGatewayTab from './components/AIGatewayTab';
import BlockchainTab from './components/BlockchainTab';
import ObservabilityTab from './components/ObservabilityTab';
import ResilienceTab from './components/ResilienceTab';
import ReportsTab from './components/ReportsTab';

// Types
import { SystemAsset, SecurityFinding } from './types';

export default function LegacyApp({ onExit }: { onExit?: () => void }) {
  const [activePillar, setActivePillar] = useState<string>('simple_os');
  
  // Dynamic Tab states for each Pillar in App level to sync with dynamic Sidebar menu
  const [businessSubTab, setBusinessSubTab] = useState<'franchise' | 'revenue-ai' | 'corporate' | 'pricing' | 'cms-marketing' | 'staff-roles'>('franchise');
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'london' | 'new-york' | 'lagos'>('all');
  
  const [marketplaceSubTab, setMarketplaceSubTab] = useState<'super-app' | 'home-health' | 'emergency-siren'>('super-app');
  const [marketplaceCategory, setMarketplaceCategory] = useState<'All' | 'Health' | 'Beauty' | 'Fitness' | 'Lifestyle' | 'Marketplace'>('All');
  
  const [telehealthSubTab, setTelehealthSubTab] = useState<'smart-consult' | 'remote-monitor'>('smart-consult');
  const [commerceSubTab, setCommerceSubTab] = useState<'health-wallet' | 'insurance-market'>('health-wallet');
  const [aiIntelligenceSubTab, setAiIntelligenceSubTab] = useState<'wellness-twin' | 'skin-analyzer'>('wellness-twin');
  const [activePillar6Tab, setActivePillar6Tab] = useState<string>('forensics');

  // Accordion open state - tracks which main Module menu is expanded
  const [expandedModule, setExpandedModule] = useState<string>('simple_os');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);

  // Core system inventory representation
  const [assets, setAssets] = useState<SystemAsset[]>([
    {
      id: 'ast-01',
      name: 'Cloud Spanner Connector',
      type: 'Database Table',
      status: 'Audited',
      path: '/src/db/spanner_connector.ts',
      loc: 145,
      coverage: 92,
      dependencies: ['@google-cloud/spanner', 'dotenv']
    },
    {
      id: 'ast-02',
      name: 'Tenant Isolation Gateway',
      type: 'Backend API',
      status: 'Vulnerable',
      path: '/api/v1/tenant-access.ts',
      loc: 320,
      coverage: 65,
      dependencies: ['express', 'jsonwebtoken']
    },
    {
      id: 'ast-03',
      name: 'Admin Authorization Middleware',
      type: 'Backend API',
      status: 'Vulnerable',
      path: '/src/middleware/auth.ts',
      loc: 180,
      coverage: 40,
      dependencies: ['jsonwebtoken', 'crypto']
    },
    {
      id: 'ast-04',
      name: 'Dynamic Observability Hub',
      type: 'Worker',
      status: 'Remediated',
      path: '/src/workers/telemetry-dispatcher.ts',
      loc: 450,
      coverage: 100,
      dependencies: ['@opentelemetry/api', 'prometheus-client']
    }
  ]);

  // Forensic findings mapping OWASP Top 10 compliance audits
  const [findings, setFindings] = useState<SecurityFinding[]>([
    {
      id: 'fnd-01',
      title: 'SQL / Spanner Raw Query Parameter Injection',
      severity: 'Critical',
      category: 'OWASP',
      description: 'The tenant query routes use raw string concatenations for document extractions. Attackers can bypass multi-tenant restrictions.',
      remediation: 'Use Param Binding in Spanner Run operations.',
      status: 'Open',
      impactCode: "spannerClient.run({ sql: 'SELECT * FROM Docs WHERE t_id = ' + req.query.id })"
    },
    {
      id: 'fnd-02',
      title: 'Missing RLS Tenant Query Filter on Documents extraction',
      severity: 'High',
      category: 'ASVS',
      description: 'No tenant correlation checks on database query executions, allowing arbitrary customer-document scraping.',
      remediation: 'Inject explicit tenant-id filters on db.select queries.',
      status: 'Open',
      impactCode: 'db.select().from(resources).where(eq(resources.id, resourceId))'
    },
    {
      id: 'fnd-03',
      title: 'Plaintext JWT Authorization Decode Override backdoor',
      severity: 'Critical',
      category: 'OWASP',
      description: 'Decodes plaintext JWT vectors without checking cryptographic verification signatures.',
      remediation: 'Enforce jwt.verify check using server-side config keys.',
      status: 'Open',
      impactCode: 'const decoded = jwt.decode(token); req.user = decoded;'
    }
  ]);

  const handleResolveFinding = (id: string) => {
    // Audit resolution triggers matching remediation
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status: 'Resolved' } : f));
    
    // Also patch associated inventory asset
    if (id === 'fnd-01') {
      setAssets(prev => prev.map(a => a.id === 'ast-02' ? { ...a, status: 'Remediated' } : a));
    } else if (id === 'fnd-03') {
      setAssets(prev => prev.map(a => a.id === 'ast-03' ? { ...a, status: 'Remediated' } : a));
    }
  };

  // Structured Core Modules Definition with icons and children metadata
  const modules = [
    {
      id: 'simple_os',
      label: 'Plain-Language OS (Mockup)',
      shortLabel: 'Plain OS',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      desc: 'Simple, jargon-free business dashboard mockup and step-by-step workflow simulator',
      submodules: []
    },
    {
      id: 'sbos_dashboard',
      label: 'Control Hub Dashboard',
      shortLabel: '0. Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 text-[#10b981]" />,
      desc: 'Unified SBOS Workflow Dashboard and Role Simulations',
      submodules: []
    },
    {
      id: 'business_ops',
      label: 'Business Operations',
      shortLabel: '1. Business Ops',
      icon: <Briefcase className="w-4 h-4 text-emerald-400" />,
      desc: 'Franchise Central & AI Revenue Optimizer',
      submodules: [
        { id: 'franchise', label: 'Franchise Central', icon: <Building className="w-3.5 h-3.5" />,
          subsubmodules: [
            { id: 'all', label: 'All Node Regions' },
            { id: 'london', label: 'London Care Node' },
            { id: 'new-york', label: 'New York Care Node' },
            { id: 'lagos', label: 'Lagos Health Node' },
          ]
        },
        { id: 'revenue-ai', label: 'AI Revenue Optimizer', icon: <TrendingUp className="w-3.5 h-3.5" /> },
        { id: 'corporate', label: 'Corporate General Ledger', icon: <BookOpen className="w-3.5 h-3.5" /> },
        { id: 'pricing', label: 'Dynamic Price Engine', icon: <DollarSign className="w-3.5 h-3.5" /> },
        { id: 'cms-marketing', label: 'AI Blog CMS & Marketing', icon: <FileText className="w-3.5 h-3.5" /> },
        { id: 'staff-roles', label: 'Clinical Staff Shifts', icon: <Users className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: 'marketplace',
      label: 'Care Marketplace',
      shortLabel: '2. Super App',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      desc: 'Care Marketplace & Home GPS Dispatch',
      submodules: [
        { id: 'super-app', label: 'Care Super Store', icon: <ShoppingBag className="w-3.5 h-3.5" />,
          subsubmodules: [
            { id: 'All', label: 'All Operations' },
            { id: 'Health', label: 'Clinical Health' },
            { id: 'Beauty', label: 'Aesthetics & Beauty' },
            { id: 'Fitness', label: 'Athletic Performance' },
            { id: 'Lifestyle', label: 'Lifestyle & Care' },
            { id: 'Marketplace', label: 'Bio Supplements' },
          ]
        },
        { id: 'home-health', label: 'Home GPS Dispatch', icon: <Truck className="w-3.5 h-3.5" /> },
        { id: 'emergency-siren', label: 'Trauma Emergency Dispatch', icon: <Siren className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> },
      ]
    },
    {
      id: 'telehealth',
      label: 'Care Telehealth',
      shortLabel: '3. Telehealth',
      icon: <Video className="w-4 h-4 text-purple-400" />,
      desc: 'AI Live SOAP Scribe & Remote BLE Monitoring',
      submodules: [
        { id: 'smart-consult', label: 'AI Consulting Room', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
        { id: 'remote-monitor', label: 'WearOS Watch Telemetry', icon: <Smartphone className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: 'commerce',
      label: 'FinTech & InsurTech',
      shortLabel: '4. FinTech & HMO',
      icon: <Wallet className="w-4 h-4 text-amber-400" />,
      desc: 'Digital Health Wallet & HMO FHIR Claims Clearance',
      submodules: [
        { id: 'health-wallet', label: 'Universal Health Wallet', icon: <Coins className="w-3.5 h-3.5" /> },
        { id: 'insurance-market', label: 'HMO Claims Settlement', icon: <FolderHeart className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: 'ai_intelligence',
      label: 'AI Labs & Twin',
      shortLabel: '5. AI Labs',
      icon: <Sparkles className="w-4 h-4 text-pink-400" />,
      desc: 'Biometric Wellness Twin & Skin Analyzer',
      submodules: [
        { id: 'wellness-twin', label: 'Biometric Wellness Twin', icon: <Dna className="w-3.5 h-3.5" /> },
        { id: 'skin-analyzer', label: 'AI Aesthetic Skin Check', icon: <Smile className="w-3.5 h-3.5" /> },
      ]
    },
    {
      id: 'trust_security',
      label: 'Trust & SecOps Ledger',
      shortLabel: '6. SecOps Ledger',
      icon: <ShieldAlert className="w-4 h-4 text-emerald-400" />,
      desc: 'CISO Forensic Discovery, AI Firewalls & Blockchain Ledgers',
      submodules: [
        { id: 'forensics', label: 'Audit Forensic Discovery', icon: <Layers className="w-3.5 h-3.5" /> },
        { id: 'security', label: 'OWASP / ASVS Audit', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
        { id: 'database', label: 'Cloud Spanner Security', icon: <Database className="w-3.5 h-3.5" /> },
        { id: 'gateway', label: 'LLM AI Guardian Firewall', icon: <Cpu className="w-3.5 h-3.5" /> },
        { id: 'blockchain', label: 'Hyperledger Cryptography', icon: <Network className="w-3.5 h-3.5" /> },
        { id: 'observability', label: 'SIEM Active Telemetry', icon: <Activity className="w-3.5 h-3.5" /> },
        { id: 'resilience', label: 'DR Failover DR Topology', icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
        { id: 'reports', label: 'ISO Remediations Sign-off', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
      ]
    }
  ];

  // Helper trigger to open a main accordion module
  const selectModule = (moduleId: string) => {
    setActivePillar(moduleId);
    setExpandedModule(moduleId);
  };

  // Helper title for active breadcrumb trace
  const getActiveBreadcrumb = () => {
    const parentModule = modules.find(m => m.id === activePillar);
    if (!parentModule) return 'HealthConnect™ SBOS';
    
    let subLabel = '';
    let subsubLabel = '';

    if (activePillar === 'business_ops') {
      const sub = parentModule.submodules.find(s => s.id === businessSubTab);
      if (sub) {
        subLabel = ` > ${sub.label}`;
        if (businessSubTab === 'franchise') {
          const ssub = sub.subsubmodules?.find(ss => ss.id === selectedBranch);
          if (ssub) subsubLabel = ` > ${ssub.label}`;
        }
      }
    } else if (activePillar === 'marketplace') {
      const sub = parentModule.submodules.find(s => s.id === marketplaceSubTab);
      if (sub) {
        subLabel = ` > ${sub.label}`;
        if (marketplaceSubTab === 'super-app') {
          const ssub = sub.subsubmodules?.find(ss => ss.id === marketplaceCategory);
          if (ssub) subsubLabel = ` > ${ssub.label}`;
        }
      }
    } else if (activePillar === 'telehealth') {
      const sub = parentModule.submodules.find(s => s.id === telehealthSubTab);
      if (sub) subLabel = ` > ${sub.label}`;
    } else if (activePillar === 'commerce') {
      const sub = parentModule.submodules.find(s => s.id === commerceSubTab);
      if (sub) subLabel = ` > ${sub.label}`;
    } else if (activePillar === 'ai_intelligence') {
      const sub = parentModule.submodules.find(s => s.id === aiIntelligenceSubTab);
      if (sub) subLabel = ` > ${sub.label}`;
    } else if (activePillar === 'trust_security') {
      const sub = parentModule.submodules.find(s => s.id === activePillar6Tab);
      if (sub) subLabel = ` > ${sub.label}`;
    }

    return `${parentModule.label}${subLabel}${subsubLabel}`;
  };

  return (
    <div className="min-h-screen bg-[#030610] text-[#cbd5e1] flex flex-col md:flex-row font-sans overflow-hidden h-screen">
      
      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside className="hidden md:flex flex-col w-80 bg-[#080d19]/90 border-r border-slate-800/80 h-full backdrop-blur-md z-40 select-none shrink-0 overflow-hidden">
        
        {/* Brand Clinic Cockpit Logo header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3 bg-[#0a1122]">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/25 shadow-lg shadow-emerald-950/20">
            <Lock className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-widest font-mono text-white uppercase leading-normal">
              HealthConnect™ SBOS
            </h1>
            <p className="text-[9px] text-[#22c55e]/90 font-mono tracking-wide flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
              HEALTHCARE VERTICAL EXTENSION
            </p>
          </div>
        </div>

        {/* Dynamic Accordion Modules Selector */}
        <div className="flex-grow overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-2 mb-2 font-mono">
            Clinical System Modules
          </div>

          <div className="space-y-2.5">
            {modules.map((mod) => {
              const isOpen = expandedModule === mod.id;
              const isActive = activePillar === mod.id;

              return (
                <div 
                  key={mod.id} 
                  className={`rounded-xl transition-all duration-300 border ${
                    isOpen 
                      ? 'bg-[#0b1427]/50 border-slate-700/60 shadow-md' 
                      : 'bg-transparent border-transparent'
                  }`}
                  id={`module-box-${mod.id}`}
                >
                  {/* Module Header Action */}
                  <button
                    onClick={() => selectModule(mod.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-mono text-xs font-bold text-left ${
                      isActive 
                        ? 'text-[#f8fafc]' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded transition-colors ${isActive ? 'bg-[#1e293b]/85' : 'bg-transparent'}`}>
                        {mod.icon}
                      </div>
                      <span className="tracking-wide text-[12px]">{mod.label}</span>
                    </div>
                    <div>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-slate-500 transition-transform duration-300 rotate-180" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 transition-transform duration-300" />
                      )}
                    </div>
                  </button>

                  {/* Sub-modules Indented List */}
                  {isOpen && (
                    <div className="px-3 pb-3.5 pt-0.5 pl-[38px] border-l border-slate-800 ml-6 flex flex-col space-y-1 text-[11.5px] font-mono select-none">
                      {mod.submodules.map((sub) => {
                        let isSubActive = false;
                        if (mod.id === 'business_ops') isSubActive = businessSubTab === sub.id;
                        else if (mod.id === 'marketplace') isSubActive = marketplaceSubTab === sub.id;
                        else if (mod.id === 'telehealth') isSubActive = telehealthSubTab === sub.id;
                        else if (mod.id === 'commerce') isSubActive = commerceSubTab === sub.id;
                        else if (mod.id === 'ai_intelligence') isSubActive = aiIntelligenceSubTab === sub.id;
                        else if (mod.id === 'trust_security') isSubActive = activePillar6Tab === sub.id;

                        const selectSubmodule = () => {
                          if (mod.id === 'business_ops') setBusinessSubTab(sub.id as any);
                          else if (mod.id === 'marketplace') setMarketplaceSubTab(sub.id as any);
                          else if (mod.id === 'telehealth') setTelehealthSubTab(sub.id as any);
                          else if (mod.id === 'commerce') setCommerceSubTab(sub.id as any);
                          else if (mod.id === 'ai_intelligence') setAiIntelligenceSubTab(sub.id as any);
                          else if (mod.id === 'trust_security') setActivePillar6Tab(sub.id);
                        };

                        return (
                          <div key={sub.id} className="space-y-1.5 py-0.5">
                            <button
                              onClick={selectSubmodule}
                              className={`w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-left tracking-wide transition-all ${
                                isSubActive 
                                  ? 'text-emerald-400 font-bold bg-[#10b981]/10 border border-[#10b981]/15' 
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span className={isSubActive ? 'text-emerald-400 scale-110' : 'text-slate-500'}>
                                {sub.icon}
                              </span>
                              <span>{sub.label}</span>
                            </button>

                            {/* Sub-sub-modules selection rendering inside accordion (Franchise branches or Store Categories) */}
                            {isSubActive && sub.subsubmodules && (
                              <div className="pl-6 border-l border-slate-800 space-y-1 pb-1 pt-1 flex flex-col">
                                {sub.subsubmodules.map((ssub) => {
                                  let isSsubChosen = false;
                                  if (sub.id === 'franchise') isSsubChosen = selectedBranch === ssub.id;
                                  else if (sub.id === 'super-app') isSsubChosen = marketplaceCategory === ssub.id;

                                  const triggerSsub = () => {
                                    if (sub.id === 'franchise') setSelectedBranch(ssub.id as any);
                                    else if (sub.id === 'super-app') setMarketplaceCategory(ssub.id as any);
                                  };

                                  return (
                                    <button
                                      key={ssub.id}
                                      onClick={triggerSsub}
                                      className={`text-left text-[10px] py-1 px-2.5 rounded transition-all flex items-center gap-1.5 ${
                                        isSsubChosen 
                                          ? 'bg-slate-800 text-white font-bold border border-slate-700/50' 
                                          : 'text-slate-500 hover:text-slate-300'
                                      }`}
                                    >
                                      <span className={`w-1 h-1 rounded-full ${isSsubChosen ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
                                      {ssub.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar executive metadata block */}
        <div className="p-4 border-t border-slate-800/80 bg-[#060a14] space-y-2 text-[10px] font-mono text-slate-500">
          <div className="flex justify-between items-center">
            <span>VERSION PROFILE:</span>
            <span className="text-slate-300 font-bold">2.6-CISO OS</span>
          </div>
          <div className="flex justify-between items-center text-[9px] text-[#10b981]">
            <span>MAPPED STANDARDS:</span>
            <span>OWASP // ASVS</span>
          </div>
        </div>

      </aside>

      {/* ==================== WORKSPACE CONTAINER ==================== */}
      <div className="flex-grow flex flex-col h-full overflow-hidden min-w-0">
        
        {/* TOP BAR / SYSTEM POSTURE HEADER (Unifying metrics elegantly) */}
        <header className="border-b border-slate-800/80 bg-[#090f1e]/95 backdrop-blur-md px-5 py-3.5 flex items-center justify-between shrink-0 select-none">
          
          {/* Breadcrumb Trace */}
          <div className="flex items-center gap-3">
            <div className="md:hidden p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/25">
              <Lock className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            
            <div className="text-left">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1 leading-none">
                <span>Console Core</span>
                <span>/</span>
                <span className="text-[#38bdf8]">{activePillar.toUpperCase().replace('_', ' ')}</span>
              </div>
              <h2 className="text-xs font-bold text-white font-mono mt-1.5 uppercase tracking-wide flex items-center gap-1.5 truncate max-w-sm md:max-w-md lg:max-w-xl">
                <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {getActiveBreadcrumb()}
              </h2>
            </div>
          </div>

          {/* Quick-indicators & Clock */}
          <div className="flex items-center gap-3.5 lg:gap-6 text-[10px] font-mono">
            {/* Auditing status badge */}
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-slate-500 text-[8.5px]">ISO 27001</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3 h-3" /> CONFORMING
              </span>
            </div>

            <div className="hidden lg:w-[1px] lg:h-6 lg:bg-slate-800" />

            {/* CVE Counter */}
            <div className="flex flex-col items-end">
              <span className="text-slate-500 text-[8.5px]">OWASP ALARMS</span>
              <span className={`font-bold flex items-center gap-1 mt-0.5 ${findings.some(f => f.status === 'Open') ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                <AlertTriangle className="w-3 h-3" />
                {findings.filter(f => f.status === 'Open').length} SEV-LOWS
              </span>
            </div>

            <div className="w-[1px] h-6 bg-slate-800" />

            {/* Live Clock Node */}
            <div className="text-right">
              <span className="text-slate-500 text-[8.5px] block">NODE STAMP</span>
              <strong className="text-slate-200 mt-0.5 block font-mono">2026-05-31</strong>
            </div>

            <div className="w-[1px] h-6 bg-slate-800" />

            {/* SBOS Architecture blueprint activator */}
            <button
              onClick={() => setIsBlueprintOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 font-mono text-[10px] font-bold uppercase rounded-lg border border-emerald-500/20 transition-all shadow-lg cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 animate-pulse" />
              <span>Blueprint Map</span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </header>

        {/* MOBILE MENU NAV HOVER LAYER */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[52px] inset-x-0 bg-[#080d19] border-b border-slate-800 shadow-2xl p-5 z-50 overflow-y-auto max-h-[85vh] text-left animate-fade-in font-mono space-y-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block pb-2 border-b border-slate-900 leading-none">
              Mobile Core Switcher
            </span>
            <div className="space-y-3.5">
              {modules.map((mod) => {
                const isOpen = expandedModule === mod.id;
                const isActive = activePillar === mod.id;

                return (
                  <div key={mod.id} className="space-y-1.5">
                    <button
                      onClick={() => selectModule(mod.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold ${
                        isActive ? 'bg-[#10b981]/10 text-white' : 'text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {mod.icon}
                        <span>{mod.label}</span>
                      </div>
                      <span className="text-slate-500 text-[9px]">[{isOpen ? 'OPEN' : 'COLLAPSED'}]</span>
                    </button>

                    {isOpen && (
                      <div className="pl-6 border-l border-slate-800 space-y-1 pt-1 pb-1">
                        {mod.submodules.map((sub) => {
                          let isSubActive = false;
                          if (mod.id === 'business_ops') isSubActive = businessSubTab === sub.id;
                          else if (mod.id === 'marketplace') isSubActive = marketplaceSubTab === sub.id;
                          else if (mod.id === 'telehealth') isSubActive = telehealthSubTab === sub.id;
                          else if (mod.id === 'commerce') isSubActive = commerceSubTab === sub.id;
                          else if (mod.id === 'ai_intelligence') isSubActive = aiIntelligenceSubTab === sub.id;
                          else if (mod.id === 'trust_security') isSubActive = activePillar6Tab === sub.id;

                          const selectMobileSub = () => {
                            if (mod.id === 'business_ops') setBusinessSubTab(sub.id as any);
                            else if (mod.id === 'marketplace') setMarketplaceSubTab(sub.id as any);
                            else if (mod.id === 'telehealth') setTelehealthSubTab(sub.id as any);
                            else if (mod.id === 'commerce') setCommerceSubTab(sub.id as any);
                            else if (mod.id === 'ai_intelligence') setAiIntelligenceSubTab(sub.id as any);
                            else if (mod.id === 'trust_security') setActivePillar6Tab(sub.id);
                            setMobileMenuOpen(false);
                          };

                          return (
                            <button
                              key={sub.id}
                              onClick={selectMobileSub}
                              className={`w-full flex items-center gap-2 py-1 px-2 rounded text-[11px] text-left ${
                                isSubActive ? 'text-emerald-400 font-bold' : 'text-slate-500'
                              }`}
                            >
                              {sub.icon}
                              <span>{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIVE WORKSPACE VIEWS */}
        <main className="flex-grow overflow-y-auto px-4 py-4 md:px-6 md:py-6 bg-[#040813] min-w-0 relative">
          
          {/* TAB ROUTING BY MASTER PILLAR */}
          
          {activePillar === 'simple_os' && (
            <SimplePlainLanguageDashboard />
          )}
          
          {activePillar === 'sbos_dashboard' && (
            <SbosWorkflowHub 
              onModuleRoute={(pillarId, subTabId) => {
                setActivePillar(pillarId);
                setExpandedModule(pillarId);
                if (pillarId === 'business_ops') setBusinessSubTab(subTabId as any);
                else if (pillarId === 'marketplace') setMarketplaceSubTab(subTabId as any);
                else if (pillarId === 'telehealth') setTelehealthSubTab(subTabId as any);
                else if (pillarId === 'commerce') setCommerceSubTab(subTabId as any);
                else if (pillarId === 'ai_intelligence') setAiIntelligenceSubTab(subTabId as any);
                else if (pillarId === 'trust_security') setActivePillar6Tab(subTabId);
              }}
            />
          )}

          {activePillar === 'business_ops' && (
            <BusinessOpsPillar 
              currentSubTab={businessSubTab} 
              onSubTabChange={(tab) => {
                setBusinessSubTab(tab);
              }}
              currentBranch={selectedBranch}
              onBranchChange={(branch) => {
                setSelectedBranch(branch);
              }}
            />
          )}

          {activePillar === 'marketplace' && (
            <MarketplacePillar 
              currentSubTab={marketplaceSubTab}
              onSubTabChange={(tab) => {
                setMarketplaceSubTab(tab);
              }}
              currentCategory={marketplaceCategory}
              onCategoryChange={(cat) => {
                setMarketplaceCategory(cat);
              }}
            />
          )}

          {activePillar === 'telehealth' && (
            <TelehealthPillar 
              currentSubTab={telehealthSubTab}
              onSubTabChange={(tab) => {
                setTelehealthSubTab(tab);
              }}
            />
          )}

          {activePillar === 'commerce' && (
            <CommercePillar 
              currentSubTab={commerceSubTab}
              onSubTabChange={(tab) => {
                setCommerceSubTab(tab);
              }}
            />
          )}

          {activePillar === 'ai_intelligence' && (
            <AIIntelligencePillar 
              currentSubTab={aiIntelligenceSubTab}
              onSubTabChange={(tab) => {
                setAiIntelligenceSubTab(tab);
              }}
            />
          )}

          {/* Pillar 6 Routing (SecOps ledger & forensic auditing subtabs) */}
          {activePillar === 'trust_security' && (
            <div className="space-y-5 animate-fade-in text-left">
              
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 uppercase tracking-widest inline-block">
                    Pillar 6 Certifications // Trust, Compliance & Security Ledger
                  </span>
                  <p className="text-slate-400 text-[12px] mt-1.5 select-none leading-relaxed font-sans">
                    Secure continuous OWASP compliance verification, analyze LLM prompt protection firewalls, and sign certifications. Codebases stay verified under cryptographic HSM audit keys.
                  </p>
                </div>
              </div>

              {/* Subtab Router Rendering */}
              {activePillar6Tab === 'forensics' && (
                <ForensicsTab
                  assets={assets}
                  onSelectAsset={(asset) => console.log('Inspecting audit asset: ', asset)}
                />
              )}

              {activePillar6Tab === 'security' && (
                <SecurityTab
                  findings={findings}
                  onResolveFinding={handleResolveFinding}
                />
              )}

              {activePillar6Tab === 'database' && (
                <DatabaseTab />
              )}

              {activePillar6Tab === 'gateway' && (
                <AIGatewayTab />
              )}

              {activePillar6Tab === 'blockchain' && (
                <BlockchainTab />
              )}

              {activePillar6Tab === 'observability' && (
                <ObservabilityTab />
              )}

              {activePillar6Tab === 'resilience' && (
                <ResilienceTab />
              )}

              {activePillar6Tab === 'reports' && (
                <ReportsTab />
              )}
            </div>
          )}

        </main>

        {/* FOOTER METADATA BAR (Polished) */}
        <footer className="border-t border-slate-800/80 bg-[#060a14] px-6 py-3 flex flex-col md:flex-row justify-between items-center text-[10px] font-mono text-slate-500 gap-2 shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>SECURE HS256 SHIELD NODE ONLINE: {(import.meta as any).env?.VITE_APP_URL || 'Lagos-Host-Secure'}</span>
          </div>
          <span>HEALTHCONNECT™ SERVICE BUSINESS OPERATING SYSTEM (SBOS) // SECURED ENCRYPTED PORTAL</span>
        </footer>

      </div>

      {/* ==================== ARCHITECTURAL BLUEPRINT MODAL ==================== */}
      {isBlueprintOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 z-50 animate-fade-in">
          <div className="bg-[#090f1e] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0a1224]/80 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                  <Layers className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider leading-none">
                    HealthConnect™ SBOS Blueprint
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Fresha-class Service Operating System + Regulated Healthcare Vertical Extensions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBlueprintOpen(false)}
                className="p-1 px-2 text-xs font-mono font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-all cursor-pointer"
              >
                CLOSE [ESC]
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-left font-mono text-[11px] leading-relaxed scrollbar-thin">
              {/* Core Principle Alert */}
              <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 space-y-2">
                <strong className="text-xs text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4" /> Core Platform Engineering Discipline
                </strong>
                <p className="text-slate-400 text-[11.5px] leading-relaxed font-sans">
                  We do not build a separate healthcare application. Instead, we keep the multi-tenant SaaS architecture, provider-first economics, and appointment-centric booking flow of a Fresha-class SBOS intact. Healthcare is integrated directly as a <strong>regulated service vertical</strong> plugged into the same platform level.
                </p>
              </div>

              {/* Grid 1: 1:1 Mapping Logic */}
              <div className="space-y-3">
                <h4 className="text-slate-300 font-bold border-b border-slate-800 pb-1.5 uppercase text-[12px] tracking-wider">
                  Traditional SBOS vs Healthcare Vertical Mapping
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-[#0b1427]/60 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
                    <span className="text-slate-500 font-bold text-[10px] uppercase block">
                      Marketplace & Booking Logic
                    </span>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start border-b border-slate-800/40 pb-2">
                        <div className="flex-1 min-w-0">
                          <strong className="text-slate-300 block text-[11px] truncate">Salon Appointment</strong>
                          <span className="text-slate-500 text-[9px] block">Select Stylist, Category, Slot</span>
                        </div>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400 shrink-0 mx-2 mt-1" />
                        <div className="text-right flex-1 min-w-0">
                          <strong className="text-cyan-400 block text-[11px] truncate">Patient Consultation</strong>
                          <span className="text-slate-500 text-[9px] block">Doctor / Specialist Telehealth Slot</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-start border-b border-slate-800/40 pb-2">
                        <div className="flex-1 min-w-0">
                          <strong className="text-slate-300 block text-[11px] truncate">Service Catalog</strong>
                          <span className="text-slate-500 text-[9px] block">Haircut, Facial, Body Therapy</span>
                        </div>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400 shrink-0 mx-2 mt-1" />
                        <div className="text-right flex-1 min-w-0">
                          <strong className="text-cyan-400 block text-[11px] truncate">Medical Services</strong>
                          <span className="text-slate-500 text-[9px] block">General consultation, Clinical checkups</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <strong className="text-slate-300 block text-[11px] truncate">Checkout & POS Ticket</strong>
                          <span className="text-slate-500 text-[9px] block">Stylist items checkout & tip</span>
                        </div>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400 shrink-0 mx-2 mt-1" />
                        <div className="text-right flex-1 min-w-0">
                          <strong className="text-cyan-400 block text-[11px] truncate">Clinical Fulfillment</strong>
                          <span className="text-slate-500 text-[9px] block">SOAP Notes → Rx → Pharmacy billing</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0b1427]/60 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
                    <span className="text-slate-500 font-bold text-[10px] uppercase block">
                      Operations & Economy Logic
                    </span>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start border-b border-slate-800/40 pb-2">
                        <div className="flex-1 min-w-0">
                          <strong className="text-slate-300 block text-[11px] truncate">Franchise Salon Branches</strong>
                          <span className="text-slate-500 text-[9px] block">London, NY, Lagos Care Nodes</span>
                        </div>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0 mx-2 mt-1" />
                        <div className="text-right flex-1 min-w-0">
                          <strong className="text-emerald-400 block text-[11px] truncate">Regional Health Nodes</strong>
                          <span className="text-slate-500 text-[9px] block">Autonomous regional care nodes</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-start border-b border-slate-800/40 pb-2">
                        <div className="flex-1 min-w-0">
                          <strong className="text-slate-300 block text-[11px] truncate">Salon Membership Plan</strong>
                          <span className="text-slate-500 text-[9px] block">Monthly recurring service passes</span>
                        </div>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0 mx-2 mt-1" />
                        <div className="text-right flex-1 min-w-0">
                          <strong className="text-emerald-400 block text-[11px] truncate">RPM Wearable Tracking</strong>
                          <span className="text-slate-500 text-[9px] block">Continuity telemetry subscriptions</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <strong className="text-slate-300 block text-[11px] truncate">Walk-in Urgent Client</strong>
                          <span className="text-slate-500 text-[9px] block">Queue styling slot on demand</span>
                        </div>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0 mx-2 mt-1" />
                        <div className="text-right flex-1 min-w-0">
                          <strong className="text-emerald-400 block text-[11px] truncate">Regulated Trauma SOS</strong>
                          <span className="text-slate-500 text-[9px] block">Highest priority emergency route</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Data Inheritance Architecture */}
              <div className="space-y-3">
                <h4 className="text-slate-300 font-bold border-b border-slate-800 pb-1.5 uppercase text-[12px] tracking-wider">
                  Unified Data Model Inheritance
                </h4>
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4">
                  <pre className="text-[10px] text-cyan-300 overflow-x-auto whitespace-pre leading-normal font-mono select-all">
{`interface ServiceEvent {
  id: string;               // Unique Booking Event Identifier
  tenantId: string;         // Multi-Tenant Isolation Key
  providerId: string;       // Doctor, Therapist, or Stylist Identifier
  patientId: string;        // Customer / Patient System ID
  appointedTime: string;    // Core Booking Schedule Stamp
  priceRubric: number;      // Core Ledger Settlement Price
  channel: 'video' | 'audio' | 'in-person' | 'home-visit' | 'emergency';
}

// 🩺 Regulated Health Domain extends standard SBOS Service Event logic 1:1
interface ClinicalEvent extends ServiceEvent {
  soapScribeNotes: {
    subjective: string;     // AI Parsed symptoms & patient feedback
    objective: string;      // Vitals & Bio telemetry streams
    assessment: string;     // Final diagnostic evaluation
    plan: string;           // Treatment & follow up routines
  };
  electronicPrescription?: {
    medication: string;
    dosage: string;
    refillsAllowed: number;
    rxSignatureHash: string; // SecOps cryptographic signature lock
  };
}`}
                  </pre>
                </div>
              </div>

              {/* Unified Customer Lifecycle Journey */}
              <div className="space-y-3">
                <h4 className="text-slate-300 font-bold border-b border-slate-800 pb-1.5 uppercase text-[12px] tracking-wider">
                  Unified Customer Lifecycle Journey
                </h4>
                <div className="flex flex-wrap md:flex-nowrap gap-3 items-center justify-between text-center">
                  <div className="bg-[#0b1427]/40 border border-slate-800 p-2.5 rounded-lg flex-1 min-w-[120px]">
                    <span className="text-slate-400 block font-bold text-[10px]">1. DISCOVER</span>
                    <span className="text-[9px] text-slate-500">Search Doctor / Clinic Marketplace</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden md:block shrink-0" />
                  <div className="bg-[#0b1427]/40 border border-slate-800 p-2.5 rounded-lg flex-1 min-w-[120px]">
                    <span className="text-slate-400 block font-bold text-[10px]">2. BOOKING</span>
                    <span className="text-[9px] text-slate-500">Pick Slot, Channel & Pre-pay</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden md:block shrink-0" />
                  <div className="bg-[#0b1427]/40 border border-slate-800 p-2.5 rounded-lg flex-1 min-w-[120px]">
                    <span className="text-slate-400 block font-bold text-[10px]">3. CONSULT</span>
                    <span className="text-[9px] text-slate-500">Live Video Consultation Scribe</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden md:block shrink-0" />
                  <div className="bg-[#0b1427]/40 border border-slate-800 p-2.5 rounded-lg flex-1 min-w-[120px]">
                    <span className="text-slate-400 block font-bold text-[10px]">4. FULFILL</span>
                    <span className="text-[9px] text-slate-500">Diagnosis, Rx, Lab tests billing</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800/80 bg-[#060b14] flex justify-between items-center px-6 select-none">
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest font-mono">
                HEALTHCONNECT™ SBOS DESIGN PARADIGM APPROVED
              </span>
              <button
                onClick={() => setIsBlueprintOpen(false)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all text-xs flex items-center gap-1 cursor-pointer"
              >
                DISMISS BLUEPRINT BOARD
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
