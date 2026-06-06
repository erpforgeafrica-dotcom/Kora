import React, { useState } from 'react';
import {
  TrendingUp,
  Briefcase,
  Users,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  HelpCircle,
  DollarSign,
  PackageCheck,
  BookOpen,
  Plus,
  Trash2,
  ShieldAlert,
  Check,
  FileText,
  Send,
  CalendarDays,
  UserPlus,
  Play,
  Fingerprint,
  Smartphone,
  Activity,
  Video
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface BusinessOpsPillarProps {
  currentSubTab?: 'franchise' | 'revenue-ai' | 'corporate' | 'pricing' | 'cms-marketing' | 'staff-roles';
  onSubTabChange?: (tab: 'franchise' | 'revenue-ai' | 'corporate' | 'pricing' | 'cms-marketing' | 'staff-roles') => void;
  currentBranch?: 'all' | 'london' | 'new-york' | 'lagos';
  onBranchChange?: (branch: 'all' | 'london' | 'new-york' | 'lagos') => void;
}

export default function BusinessOpsPillar({ currentSubTab, onSubTabChange, currentBranch, onBranchChange }: BusinessOpsPillarProps = {}) {
  // Sub-tabs for Business Operations
  const [internalSubTab, setInternalSubTab] = useState<'franchise' | 'revenue-ai' | 'corporate' | 'pricing' | 'cms-marketing' | 'staff-roles'>('franchise');
  const activeSubTab = currentSubTab !== undefined ? currentSubTab : internalSubTab;
  const setActiveSubTab = onSubTabChange !== undefined ? onSubTabChange : setInternalSubTab;

  // Roles & permissions system states
  const [userRole, setUserRole] = useState<'business_owner' | 'admin' | 'staff'>('business_owner');
  
  // Staff states
  const [staffList, setStaffList] = useState([
    { id: 'stf-01', name: 'Dr. Ada Okpara, MD', role: 'Admin', salary: 1200000, shift: 'Mon - Fri, 09:00 - 17:00 (London Node)', checkInStatus: 'checked_in', checkTime: '08:45 AM', currency: 'NGN' },
    { id: 'stf-02', name: 'Sarah Peterson, RN', role: 'Practitioner', salary: 750000, shift: 'Tue - Sat, 08:00 - 16:00 (New York Node)', checkInStatus: 'checked_in', checkTime: '07:54 AM', currency: 'NGN' },
    { id: 'stf-03', name: 'Coach Marcus Vance', role: 'Staff', salary: 500000, shift: 'Mon - Wed, 06:00 - 14:00 (Lagos Node)', checkInStatus: 'checked_out', checkTime: 'N/A', currency: 'NGN' },
    { id: 'stf-04', name: 'Janice Coker, LMT', role: 'Staff', salary: 480000, shift: 'Wed - Sun, 10:00 - 18:00 (Lagos Node)', checkInStatus: 'checked_out', checkTime: 'N/A', currency: 'NGN' }
  ]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Admin' | 'Business Owner' | 'Practitioner' | 'Staff'>('Staff');
  const [newStaffSalary, setNewStaffSalary] = useState(450000);
  const [newStaffShift, setNewStaffShift] = useState('Mon - Fri, 08:00 - 17:00');
  const [newStaffBranch, setNewStaffBranch] = useState<'London Node' | 'New York Node' | 'Lagos Node'>('Lagos Node');
  const [attendanceLogs, setAttendanceLogs] = useState<string[]>([
    'Dr. Ada Okpara, MD clocked IN at London Node. Biometrics verified via TouchID.',
    'Sarah Peterson, RN clocked IN at New York Node with FaceID alignment sequence.',
    'Weekly shift rota locked for Q2 healthcare compliance.',
    'Lagos Node POS sync established for automatic clock-in validations.'
  ]);
  const [isClocking, setIsClocking] = useState(false);

  // AI CMS & Marketing States
  const [blogPosts, setBlogPosts] = useState([
    { 
      id: 'post-1', 
      title: 'Combating Afternoon Brain Fog: The Mitochondria-Hydration Axis', 
      excerpt: 'Struggling at 3 PM? Dr. Ada Okpara examines how subtle intracellular dehydration drops ATP synthesis and discusses real prevention tools.', 
      status: 'Published', 
      connectedItem: 'Youth-Restore Collagen Infusion Treatment (Service)',
      stockStatus: '6 slots available today',
      timestamp: 'Auto-updated 10m ago by Kora AI'
    },
    { 
      id: 'post-2', 
      title: 'The Bio-Chemistry of CoQ10 & Heart Rate Variability Syncing', 
      excerpt: 'Why high-performance athletes monitor cardiopulmonary recuperation metrics using continuous smart wearable telemetry.', 
      status: 'Published', 
      connectedItem: 'CoQ10 Cardiovascular Booster (60 Capsules) (Product)',
      stockStatus: '51 bottles in POS Stock',
      timestamp: 'Auto-updated 2 hours ago by Kora AI'
    },
    { 
      id: 'post-3', 
      title: 'Skin Recovery Matrix: Inside Liposomal Hyaluronic Acid', 
      excerpt: 'Clinical overview comparing topical hydration barrier defense with transdermal laser-assisted micro-needle therapy.', 
      status: 'Draft', 
      connectedItem: 'Hydra-Restore Hyaluronic Acid Skin Serum (Product)',
      stockStatus: '40 bottles in POS Stock',
      timestamp: 'Scheduled for tomorrow 12:00 PM'
    }
  ]);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedConnectedItem, setSelectedConnectedItem] = useState('CoQ10 Cardiovascular Booster (60 Capsules) (Product)');
  const [socialPlatform, setSocialPlatform] = useState<'whatsapp' | 'telegram' | 'facebook'>('whatsapp');
  const [socialTimer, setSocialTimer] = useState('Immediate Peak Booking Surcharge');
  const [socialMessage, setSocialMessage] = useState('New wellness article released: Combating Afternoon Brain Fog! Book your slots now or purchase the connected Hydra-Restore Hyaluronic Acid Skin Serum directly from your Kora Wallet.');
  const [isPublishingCms, setIsPublishingCms] = useState(false);
  const [smsCampaignLogs, setSmsCampaignLogs] = useState<string[]>([
    'Scheduled automated broadcast: "mitochondria-hydration" linked to CoQ10 stock thresholds.'
  ]);

  // Franchise states
  const [internalBranch, setInternalBranch] = useState<'all' | 'london' | 'new-york' | 'lagos'>('all');
  const selectedBranch = currentBranch !== undefined ? currentBranch : internalBranch;
  const setSelectedBranch = onBranchChange !== undefined ? onBranchChange : setInternalBranch;
  const [autonomyLevel, setAutonomyLevel] = useState<number>(75);

  // Business metrics data
  const branchData = [
    { name: 'Jan', London: 45000, NewYork: 62000, Lagos: 38000, total: 145000 },
    { name: 'Feb', London: 52000, NewYork: 68000, Lagos: 44000, total: 164000 },
    { name: 'Mar', London: 59000, NewYork: 75000, Lagos: 49000, total: 183000 },
    { name: 'Apr', London: 61000, NewYork: 82000, Lagos: 52000, total: 195000 },
    { name: 'May', London: 68000, NewYork: 91000, Lagos: 58000, total: 217000 }
  ];

  // Revenue AI Command Center state
  const [aiQuery, setAiQuery] = useState('Which services generate highest profit?');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const aiQueryPresetList = [
    {
      q: 'Which services generate highest profit?',
      ans: 'Analysis of Q2 records shows that **Laser Skincare Programs** (42% net profit margin) and **Continuous Weight Management Memberships** (38% margin margin) outperform traditional clinical single consults. We recommend bundling facial aesthetic consults with direct skincare kit delivery to maximize average order value.'
    },
    {
      q: 'What inventory will run out next month?',
      ans: 'Deterministic supply audit predicts critical threshold breach for **Kora Hydra-Restore Serums** by June 15th based on current 2.4x booking pace. Reorder point triggered at 40 units default. Critical lead time is 7 days.'
    },
    {
      q: 'Which customers are likely to churn?',
      ans: 'Our churn models flagged **14 corporate fitness subscribers** whose telemetry activity (gym entries, meditation app logs & telehealth check-ins) declined > 50% month-over-month. We recommend auto-triggering a Kora Wellness Reward offering a complimentary biometric scan to re-engage.'
    },
    {
      q: 'What pricing scheme should I use next week?',
      ans: 'Based on regional forecasts and seasonal temperature trends, Thursday peak scheduling is overloaded. We suggest establishing a 20% off-peak discount for Wednesday slots and a 15% surcharge for Saturday luxury treatments to spread peak capacity load.'
    }
  ];

  // Dynamic Pricing state
  const [isAutoOptimize, setIsAutoOptimize] = useState(true);
  const [peakSurcharge, setPeakSurcharge] = useState(15);
  const [offPeakDiscount, setOffPeakDiscount] = useState(35);

  const weeklySchedulePricing = [
    { day: 'Mon', baseRate: 100, dynamicPrice: 85, occupancy: 35, discountApplied: '15% Off-Peak' },
    { day: 'Tue', baseRate: 100, dynamicPrice: 60, occupancy: 20, discountApplied: '40% Extreme Promo' },
    { day: 'Wed', baseRate: 100, dynamicPrice: 80, occupancy: 50, discountApplied: '20% Midweek Special' },
    { day: 'Thu', baseRate: 100, dynamicPrice: 100, occupancy: 70, discountApplied: 'Standard' },
    { day: 'Fri', baseRate: 100, dynamicPrice: 115, occupancy: 85, discountApplied: '15% High Demand' },
    { day: 'Sat', baseRate: 100, dynamicPrice: 125, occupancy: 95, discountApplied: '25% Luxury Dynamic Premium' },
    { day: 'Sun', baseRate: 100, dynamicPrice: 110, occupancy: 80, discountApplied: '10% Demand Surge' }
  ];

  // Corporate Wellness HR Dashboard states
  const [hrCampaignName, setHrCampaignName] = useState('30-day Hydration Quest');
  const [campaignSuccess, setCampaignSuccess] = useState(false);
  const [hrActionLogs, setHrActionLogs] = useState<string[]>([
    'Default Corporate Plan activated for Google London Workspace (450 staff).',
    'Stress index sync received from employee smart watches.'
  ]);

  const employeeStressTraces = [
    { department: 'Engineering', stressLevel: 68, activeHabits: 84 },
    { department: 'Sales & BD', stressLevel: 75, activeHabits: 91 },
    { department: 'Product Design', stressLevel: 51, activeHabits: 76 },
    { department: 'Customer Success', stressLevel: 58, activeHabits: 81 },
    { department: 'Operations', stressLevel: 62, activeHabits: 89 }
  ];

  const triggerCorporateAction = () => {
    setCampaignSuccess(true);
    setHrActionLogs(prev => [
      `Enforced team campaign: "${hrCampaignName}" with continuous tracking. Sparked instant HR dashboard notification.`,
      ...prev
    ]);
    setTimeout(() => setCampaignSuccess(false), 3000);
  };

  const handleAiRevenueQuery = (queryText: string) => {
    setAiQuery(queryText);
    setIsAiLoading(true);
    setAiResponse('');

    setTimeout(() => {
      const match = aiQueryPresetList.find(preset => preset.q === queryText);
      setAiResponse(match ? match.ans : "Cognitive evaluation completed: Continuous inventory cycle aligned with commercial capacity.");
      setIsAiLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Pillar Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
            Pillar 1 // Operations OS
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Global Business Operations & Franchise Central
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Synchronize branch chains, adjust dynamic price matrices, drive corporate HR benefits, and probe the AI Revenue Command.
          </p>
        </div>

        {/* Navigation Selector */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 self-start md:self-auto text-xs font-mono overflow-auto max-w-full">
          {(['franchise', 'revenue-ai', 'corporate', 'pricing', 'cms-marketing', 'staff-roles'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.5 rounded transition-all whitespace-nowrap capitalize ${
                activeSubTab === tab ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'revenue-ai' ? 'AI Revenue' : 
               tab === 'cms-marketing' ? 'AI Blog CMS' : 
               tab === 'staff-roles' ? 'Staff & Shifts' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-PANELS */}

      {/* 1. Franchise Engine */}
      {activeSubTab === 'franchise' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Main Chart */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Consolidated Franchise Financial Index
                </h3>
                <p className="text-[11px] text-slate-500">Live aggregated revenue tracks across globally managed nodes.</p>
              </div>

              {/* Branch Filter */}
              <div className="flex items-center gap-1.5">
                {(['all', 'london', 'new-york', 'lagos'] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => setSelectedBranch(b)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border ${
                      selectedBranch === b
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-300'
                    }`}
                  >
                    {b.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic visual graph */}
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={branchData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNY" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={val => `$${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090f1a', borderColor: '#1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontFamily: 'monospace' }}
                  />
                  {selectedBranch === 'all' && (
                    <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" name="Unified Enterprise Total" strokeWidth={2.5} />
                  )}
                  {(selectedBranch === 'london' || selectedBranch === 'all') && (
                    <Area type="monotone" dataKey="London" stroke="#38bdf8" fillOpacity={0} name="Kora London Spa" strokeWidth={2} />
                  )}
                  {(selectedBranch === 'new-york' || selectedBranch === 'all') && (
                    <Area type="monotone" dataKey="NewYork" stroke="#818cf8" fillOpacity={1} fill="url(#colorNY)" name="MedSpa New York" strokeWidth={2} />
                  )}
                  {(selectedBranch === 'lagos' || selectedBranch === 'all') && (
                    <Area type="monotone" dataKey="Lagos" stroke="#f43f5e" fillOpacity={0} name="Kora Lagos Gym" strokeWidth={2} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Franchise Settings Panel */}
          <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                <Sliders className="text-emerald-400 w-4 h-4 animate-spin-slow" />
                <h4 className="text-xs font-bold font-mono uppercase text-slate-300">Autonomy Matrix</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Centralized HQ oversight with branch autonomy control. Allows regional operators to schedule and manage localized pricing schemes while syncing master ledgers.
              </p>

              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[11px] font-mono text-slate-500 font-bold">
                  <span>BRANCH ACTION DECENTRALIZATION</span>
                  <span className="text-emerald-400">{autonomyLevel}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={autonomyLevel}
                  onChange={(e) => setAutonomyLevel(+e.target.value)}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-850 text-[11px] leading-relaxed text-slate-400 space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Autonomy Preset:</span>
                  <span className="text-sky-400 font-bold">
                    {autonomyLevel > 80 ? 'Federated Freedom' : autonomyLevel > 50 ? 'Garded Balance' : 'HQ Centralized Lock'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  {autonomyLevel > 80 
                    ? '✓ Branches handle their memberships and custom wellness challenges locally.' 
                    : '⚠ HQ forces master service menus and core database schema models.'}
                </div>
              </div>
            </div>

            {/* Quick Status indicators */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider block">Managed Chain Statuses:</span>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                  <span className="block font-bold">LONDON</span>
                  <span className="text-[8px] text-slate-500">Node Online</span>
                </div>
                <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                  <span className="block font-bold">NY</span>
                  <span className="text-[8px] text-slate-500">Node Online</span>
                </div>
                <div className="p-2 rounded bg-[#38bdf8]/5 border border-[#38bdf8]/10 text-sky-400">
                  <span className="block font-bold">LAGOS</span>
                  <span className="text-[8px] text-slate-500">Syncing (WAF)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. AI Revenue Command Center */}
      {activeSubTab === 'revenue-ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Query Terminal console */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-emerald-400 w-4 h-4 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Revenue Command Console
                </h3>
              </div>
              <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 rounded px-2 py-0.5">
                model: gemini-3.5-flash
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Interact with Kora's commercial analyzer. Ask real-time questions focusing on service profits, inventory burn metrics, user churn warnings, or pricing predictions.
            </p>

            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Analytical Command Templates:</span>
              <div className="grid grid-cols-1 gap-2">
                {aiQueryPresetList.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAiRevenueQuery(preset.q)}
                    className={`p-2.5 rounded-lg border text-xs text-left transition-all ${
                      aiQuery === preset.q
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-emerald-400 font-bold text-[10px] block font-mono">QUERY 0{idx + 1}</span>
                    <span className="truncate block mt-0.5">{preset.q}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual entry bar */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 font-mono flex-grow focus:outline-none focus:border-slate-700"
                placeholder="Submit customized revenue queries..."
              />
              <button
                onClick={() => handleAiRevenueQuery(aiQuery)}
                disabled={isAiLoading}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 rounded transition-colors whitespace-nowrap uppercase"
              >
                Execute
              </button>
            </div>
          </div>

          {/* Console response output */}
          <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[350px]">
            {isAiLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 flex-grow">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <span className="text-xs text-slate-500 font-mono">Assembling transactional matrices and querying health ledger...</span>
              </div>
            ) : aiResponse ? (
              <div className="space-y-4 animate-fade-in flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                    <span className="text-[10.5px] font-bold text-slate-400 font-mono uppercase">Unified Revenue Intelligence Verdict</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                      COGNITIVE_SAFE_PASS
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-sans text-xs leading-relaxed text-slate-300">
                    <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg flex items-start gap-2 text-[10.5px] leading-relaxed text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <p>
                    <strong>CISO Decoupler Safeguard:</strong> This operation was scrubbed through Pillar 6 (Prompt Firewall Sandbox) to safeguard secret tenant tokens and PII elements from leakage.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 flex-grow">
                <PackageCheck className="w-12 h-12 text-slate-700 animate-bounce-slow" />
                <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">Awaiting Command Stream</h4>
                <p className="text-[11px] text-slate-500 max-w-xs font-sans">
                  Select an AI revenue preset or insert custom variables to model dynamic customer churn ratios or inventory cycles.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Corporate Wellness Portal */}
      {activeSubTab === 'corporate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* HR Analytics & Stress Indicators */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                HR Corporate Wellness Participation Console
              </h3>
              <p className="text-[11px] text-slate-500">
                Track anonymous aggregate employee stress, health indices, and challenge engagement.
              </p>
            </div>

            {/* Participation Chart */}
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeStressTraces}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="department" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090f1a', borderColor: '#1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="stressLevel" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Stress Level Index %" />
                  <Bar dataKey="activeHabits" fill="#10b981" radius={[4, 4, 0, 0]} name="Active Habit Trackers %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[10px] text-slate-500 leading-normal bg-slate-950 p-2.5 rounded border border-slate-900">
              *All telemetry data in Corporate Wellness reports is processed utilizing privacy-preserving, tokenized zero-knowledge proofs. Individual biometrics are strictly private; only aggregated team scores are visible to HR administrators.
            </p>
          </div>

          {/* Admin Intervention Control */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                <Briefcase className="text-emerald-400 w-4 h-4" />
                <h4 className="text-xs font-bold font-mono uppercase text-slate-300">Empower Workplace Wellness</h4>
              </div>

              <div className="space-y-2">
                <label className="text-[10.5px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                  Push Corporate Health Challenge
                </label>
                <select
                  value={hrCampaignName}
                  onChange={(e) => setHrCampaignName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="30-day Hydration Quest">30-Day Hydration Quest (Stickers & Rewards)</option>
                  <option value="Unplug-at-8 Sleep Challenge">Unplug-at-8 Sleep Restorer Series</option>
                  <option value="Yoga Routine for Ergonomics">Office Yoga & Ergonomics Posture Clinic</option>
                  <option value="Biometric Health Screening Plan">Biometric Wellness Assessment Drive</option>
                </select>
              </div>

              <button
                onClick={triggerCorporateAction}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded text-xs transition-colors font-mono uppercase"
              >
                Blast Challenge Push to Employee Devices
              </button>

              {campaignSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded text-[11px] text-emerald-400 font-bold animate-pulse font-mono flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> CHALLENGE DISPATCHED TO 450 EMPLOYEE CHANNELS
                </div>
              )}
            </div>

            {/* Campaign logs view */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider block">Admin Campaign Audit Events:</span>
              <div className="bg-slate-950 rounded border border-slate-900 p-2.5 h-[110px] overflow-y-auto space-y-1.5 font-mono text-[10px] text-slate-400">
                {hrActionLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-1 pb-1 border-b border-slate-900/55 last:border-0 last:pb-0">
                    <span className="text-slate-600 font-bold">•</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. AI Dynamic Pricing Engine */}
      {activeSubTab === 'pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Price Curves Graph */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  AI Dynamic Pricing Optimization Engine
                </h3>
                <p className="text-[11px] text-slate-500">
                  Weekly schedule optimization curve. Automatically balances peak rates against low-occupancy off-peak deals.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">AI optimizer autopilot:</span>
                <button
                  onClick={() => setIsAutoOptimize(!isAutoOptimize)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                    isAutoOptimize ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-slate-950 w-4 h-4 rounded-full transition-transform duration-300 transform ${
                      isAutoOptimize ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Chart showing weekly rates */}
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklySchedulePricing}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={val => `$${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090f1a', borderColor: '#1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontFamily: 'monospace' }}
                  />
                  <Line type="monotone" dataKey="baseRate" stroke="#64748b" strokeDasharray="5 5" strokeWidth={1.5} name="Static Base Rate" />
                  <Line type="monotone" dataKey="dynamicPrice" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} name="Calculated Elastic Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[10.5px] text-slate-500 bg-[#070b14]/60 p-2.5 rounded border border-slate-900 italic leading-relaxed">
              *The dynamic engine reviews historical bookings over 18 weeks, combining local weather, branch density, and seasonal stress levels to forecast and correct peak reservation loads.
            </p>
          </div>

          {/* Pricing parameters controls */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                <Clock className="text-emerald-400 w-4 h-4" />
                <h4 className="text-xs font-bold font-mono uppercase text-slate-300">Revenue Management Suite</h4>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>SATURDAY LUXURY DEMAND MULTIPLIER</span>
                    <strong className="text-emerald-500">+{peakSurcharge}%</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={peakSurcharge}
                    disabled={!isAutoOptimize}
                    onChange={(e) => setPeakSurcharge(+e.target.value)}
                    className="w-full h-1 bg-slate-950 rounded-lg cursor-pointer accent-emerald-500 disabled:opacity-40"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>TUESDAY OFF-PEAK CAPACITY DISCOUNT</span>
                    <strong className="text-red-400">-{offPeakDiscount}%</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={offPeakDiscount}
                    disabled={!isAutoOptimize}
                    onChange={(e) => setOffPeakDiscount(+e.target.value)}
                    className="w-full h-1 bg-slate-950 rounded-lg cursor-pointer accent-emerald-400 disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-850 text-xs text-slate-400 space-y-2 font-mono">
                <div className="flex items-center justify-between text-slate-300 text-[10.5px]">
                  <span>Optimisation Status:</span>
                  <span className={`font-bold uppercase ${isAutoOptimize ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {isAutoOptimize ? '✓ AUTOPILOT RUNNING' : '⚠ MANUAL LOCKED'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 leading-normal font-sans">
                  {isAutoOptimize 
                    ? `Dynamic pricing currently optimizing London, NY, & Lagos schedules based on continuous consumer traffic telemetry.` 
                    : `Autopilot deactivated. All branches forced onto flat standard base rates.`}
                </div>
              </div>
            </div>

            {/* Mock booking table block */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider block">Live Dynamic Pricing Table:</span>
              <div className="max-h-[110px] overflow-y-auto space-y-1.5 font-mono text-[10px]">
                {weeklySchedulePricing.map((item, id) => (
                  <div key={id} className="flex items-center justify-between bg-slate-950 border border-slate-900/60 p-1.5 rounded text-slate-300">
                    <span className="font-bold text-slate-400 w-8">{item.day}</span>
                    <span className="text-slate-500">Occupancy: <strong className="text-slate-300">{item.occupancy}%</strong></span>
                    <span className="font-bold text-emerald-400">${item.dynamicPrice}</span>
                    <span className="text-[9px] bg-sky-500/10 text-sky-400 px-1 py-0.2 rounded scale-90">{item.discountApplied}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. AI Managed Blog CMS & Marketing (Connected to Inventory Supply Chain) */}
      {activeSubTab === 'cms-marketing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left animate-fade-in">
          {/* Main AI Blog CMS (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="text-emerald-400 w-4 h-4" /> AI-Managed Client Blog CMS
                </h3>
                <p className="text-[11px] text-slate-500">
                  Continuous AI content generation. Blog articles are securely back-linked to real-time POS stock.
                </p>
              </div>
              <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest font-black animate-pulse">
                AI Autopilot ON
              </span>
            </div>

            {/* Induct Blog Post form */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                Force Generate / Update AI Blog Article
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Insert custom article title (or leave empty for AI)..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="bg-slate-900 border border-slate-850 rounded px-2.5 py-2 text-slate-300 font-sans focus:outline-none"
                />
                <select
                  value={selectedConnectedItem}
                  onChange={(e) => setSelectedConnectedItem(e.target.value)}
                  className="bg-slate-900 border border-slate-850 rounded px-2.5 py-2 text-slate-300 font-mono focus:outline-none"
                >
                  <option value="CoQ10 Cardiovascular Booster (60 Capsules) (Product)">
                    CoQ10 Booster Capsule (Product)
                  </option>
                  <option value="Hydra-Restore Hyaluronic Acid Skin Serum (Product)">
                    Hydra-Restore Serum (Product)
                  </option>
                  <option value="Youth-Restore Collagen Infusion Treatment (Service)">
                    Youth-Restore Collagen (Service)
                  </option>
                  <option value="Unlimited Gym & Sauna Elite Pass (Service)">
                    Unlimited Gym Elite Pass (Service)
                  </option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsPublishingCms(true);
                    setTimeout(() => {
                      const finalTitle = newPostTitle || 'Continuous Glucose & Metabolic Health Tracking Decoded';
                      const finalExcerpt = 'A scientific evaluation of transdermal telemetry scans and dynamic dietary interventions to curb systemic glycemic fatigue.';
                      setBlogPosts(prev => [
                        {
                          id: `post-${Math.random().toString(16).substring(2, 6)}`,
                          title: finalTitle,
                          excerpt: finalExcerpt,
                          status: 'Published',
                          connectedItem: selectedConnectedItem,
                          stockStatus: selectedConnectedItem.includes('CoQ10') ? '51 bottles in POS Stock' : 'Secure stock link OK',
                          timestamp: 'Auto-updated 1s ago via Kora LLM'
                        },
                        ...prev
                      ]);
                      setNewPostTitle('');
                      setIsPublishingCms(false);
                      setSmsCampaignLogs(l => [
                        `[${new Date().toLocaleTimeString()}] CMS: Successfully published "${finalTitle}" and mapped conversion trackers to POS Database.`,
                        ...l
                      ]);
                    }, 1200);
                  }}
                  disabled={isPublishingCms}
                  className="flex-grow bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold py-2.5 rounded text-xs transition-colors font-mono uppercase text-center justify-center items-center flex gap-1.5"
                >
                  {isPublishingCms ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Structuring Article...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Push & Autolink AI Article to POS Catalog
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* List of Active Articles */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
                Active Client Blogs (Synced to Supply Chain)
              </span>
              {blogPosts.map(post => (
                <div key={post.id} className="p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl space-y-2 hover:border-slate-800 transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-slate-200 font-sans leading-snug">{post.title}</h4>
                    <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-bold shrink-0 uppercase">
                      {post.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal font-sans">{post.excerpt}</p>
                  
                  <div className="flex flex-wrap items-center justify-between border-t border-slate-900/80 pt-2 text-[10px] text-slate-500 font-mono">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <PackageCheck className="w-3.5 h-3.5 text-emerald-400" /> POS Link: <strong>{post.connectedItem}</strong> 
                    </span>
                    <span className="text-slate-400 font-bold">({post.stockStatus})</span>
                    <span className="text-slate-600 block mt-0.5 sm:mt-0">{post.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media Campaign Poster (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                <Send className="text-emerald-400 w-4 h-4" />
                <h4 className="text-xs font-bold font-mono uppercase text-slate-300">Social Poster & Broadcaster</h4>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-900 text-xs space-y-3">
                {/* Selector */}
                <div className="space-y-1 font-mono">
                  <span className="text-[9.5px] text-slate-500 block">SELECT CHANNELS</span>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    {(['whatsapp', 'telegram', 'facebook'] as const).map(platform => (
                      <button
                        key={platform}
                        onClick={() => setSocialPlatform(platform)}
                        className={`p-1.5 rounded border text-center uppercase font-bold transition-all ${
                          socialPlatform === platform 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-slate-900 text-slate-500 border-slate-850'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timing Selector */}
                <div className="space-y-1 font-mono">
                  <span className="text-[9.5px] text-slate-500 block">CAMPAIGN TIMING & AUDIENCE</span>
                  <select
                    value={socialTimer}
                    onChange={(e) => setSocialTimer(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Immediate Peak Booking Surcharge">Immediate Core Broadcast (Peak Surcharge Trigger)</option>
                    <option value="Off-Peak Hour Wednesday Dispatch">Off-Peak Dispatch (Wednesday Promo Siphon)</option>
                    <option value="Daily Routine Broadcast at 9 AM">Daily Morning Pulse Rota (09:00 AM)</option>
                  </select>
                </div>

                {/* Campaign message textarea */}
                <div className="space-y-1 font-sans">
                  <span className="text-[9.5px] text-slate-500 block font-mono">CAMPAIGN MESSAGE TRANSMITTER</span>
                  <textarea
                    rows={4}
                    value={socialMessage}
                    onChange={(e) => setSocialMessage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded p-2 text-[10.5px] text-slate-300 focus:outline-none focus:border-slate-700"
                  />
                </div>

                {/* Simulate Publish */}
                <button
                  onClick={() => {
                    setSmsCampaignLogs(prev => [
                      `[${new Date().toLocaleTimeString()}] Broadcasted social post to 490 synced clinic list over ${socialPlatform.toUpperCase()}. Target delivery latency: 1.5s.`,
                      ...prev
                    ]);
                    const originalMsg = socialMessage;
                    setSocialMessage('AI Engine ready. Insert customized marketing broadcast vectors...');
                    setTimeout(() => setSocialMessage(originalMsg), 3000);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded text-xs transition-colors font-mono uppercase"
                >
                  Execute Social Broadcast now
                </button>
              </div>
            </div>

            {/* SMS social log tracing */}
            <div className="space-y-1.5">
              <span className="text-[9.5px] font-bold text-slate-500 uppercase font-mono tracking-wider block">
                Continuous Ad Campaign Traces:
              </span>
              <div className="bg-slate-950 rounded border border-slate-900 p-2.5 h-[105px] overflow-y-auto space-y-1 font-mono text-[9.5px] text-slate-400 leading-normal">
                {smsCampaignLogs.map((log, index) => (
                  <div key={index} className="pb-1 border-b border-slate-900/50 last:border-0 last:pb-0">
                    <span className="text-slate-600">•</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Roles, Permissions, Salaries, Shifts & Attendance tracker */}
      {activeSubTab === 'staff-roles' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Tenant Privilege Decoder Rule Selector */}
          <div className="bg-slate-950 border border-emerald-500/20 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-0.5">
              <span className="text-[9.5px] font-mono text-emerald-400 uppercase tracking-wider block font-bold flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5 animate-pulse" /> Active Tenant Privilege Decoder
              </span>
              <h3 className="text-white text-sm font-bold font-sans">
                Swap roles below to simulate permissions isolation filters on client-side structures.
              </h3>
            </div>
            
            <div className="flex bg-slate-900 p-1.5 rounded-lg border border-slate-800 text-[10.5px] font-mono">
              {(['business_owner', 'admin', 'staff'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setUserRole(role)}
                  className={`px-3 py-1.5 rounded transition-all capitalize font-bold ${
                    userRole === role ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {role === 'business_owner' ? 'Business Owner' : role === 'admin' ? 'Admin / CISO' : 'Staff / Practitioner'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Primary Staff Roster (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="border-b border-slate-850 pb-2.5 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">
                    Consolidated Corporate Staff Directory
                  </h4>
                  <p className="text-[11px] text-slate-500">Live payroll amounts and weekly shift structures.</p>
                </div>
                {userRole === 'staff' && (
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase animate-pulse">
                    Salary Mask Active
                  </span>
                )}
              </div>

              {/* Staff table */}
              <div className="space-y-2">
                {staffList.map(item => (
                  <div key={item.id} className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="truncate">
                      <strong className="text-slate-200 block text-xs font-sans">{item.name}</strong>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase block">{item.role}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                      <div>
                        <span className="text-[9px] text-slate-600 block leading-none">SHIFT WEEKLY</span>
                        <span className="text-[10.5px] font-semibold text-slate-400">{item.shift.split(' (')[0]}</span>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-600 block leading-none">CHECK STATUS</span>
                        <span className={`text-[10px] font-bold ${item.checkInStatus === 'checked_in' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {item.checkInStatus === 'checked_in' ? `✓ IN (${item.checkTime})` : '✕ Checked Out'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] text-slate-600 block leading-none">BASE SALARY</span>
                        <span className="text-[10.5px] font-bold text-white">
                          {userRole === 'staff' ? '₦ ***** (Masked)' : `₦${item.salary.toLocaleString()}`}
                        </span>
                      </div>

                      {userRole !== 'staff' && (
                        <button
                          onClick={() => {
                            setStaffList(prev => prev.filter(s => s.id !== item.id));
                            setAttendanceLogs(prev => [
                              `[${new Date().toLocaleTimeString()}] ADMIN: Delisted and deleted telemetry access for ${item.name}.`,
                              ...prev
                            ]);
                          }}
                          className="p-1 hover:bg-red-500/10 text-slate-600 hover:text-red-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Panel based on privileges (Owner / Admin -> Add Staff | Staff -> Check In Screen) (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
              
              {userRole !== 'staff' ? (
                /* ADD STAFF PANEL */
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
                    <UserPlus className="text-emerald-400 w-4 h-4" />
                    <h4 className="text-xs font-bold font-mono uppercase text-slate-300">Induct Health Representative</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Representative Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Samuel Kola, PhD"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-2 text-slate-300 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Delegated Role</label>
                        <select
                          value={newStaffRole}
                          onChange={(e: any) => setNewStaffRole(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-2 text-slate-300 font-mono focus:outline-none"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Business Owner">Business Owner</option>
                          <option value="Practitioner">Practitioner</option>
                          <option value="Staff">Staff</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Base Salary (NGN)</label>
                        <input
                          type="number"
                          value={newStaffSalary}
                          onChange={(e) => setNewStaffSalary(+e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-2 text-slate-300 font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Shift Hours</label>
                        <input
                          type="text"
                          value={newStaffShift}
                          onChange={(e) => setNewStaffShift(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-2 text-slate-400 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Target Node</label>
                        <select
                          value={newStaffBranch}
                          onChange={(e: any) => setNewStaffBranch(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-2 text-slate-300 font-mono focus:outline-none"
                        >
                          <option value="London Node">London Node</option>
                          <option value="New York Node">New York Node</option>
                          <option value="Lagos Node">Lagos Node</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!newStaffName) return;
                        setStaffList(prev => [
                          ...prev,
                          {
                            id: `stf-${Math.random().toString(16).substring(2, 6)}`,
                            name: newStaffName,
                            role: newStaffRole,
                            salary: newStaffSalary,
                            shift: `${newStaffShift} (${newStaffBranch})`,
                            checkInStatus: 'checked_out',
                            checkTime: 'N/A',
                            currency: 'NGN'
                          }
                        ]);
                        setAttendanceLogs(prev => [
                          `[${new Date().toLocaleTimeString()}] OWNER: Inducted new ${newStaffRole} "${newStaffName}" to ${newStaffBranch}.`,
                          ...prev
                        ]);
                        setNewStaffName('');
                      }}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded text-xs transition-colors font-mono uppercase"
                    >
                      Deregulate Security & Induct Staff Member
                    </button>
                  </div>
                </div>
              ) : (
                /* STAFF ATTENDANCE PUNCH PANEL */
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2">
                    <Activity className="text-emerald-400 w-4 h-4" />
                    <h4 className="text-xs font-bold font-mono uppercase text-slate-300">Biometric Attendance Portal</h4>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    You are logged in as **Practitioner Staff**. Authenticate Face or Thumbprint scanner to submit electronic clock status with live GPS telemetry.
                  </p>

                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 text-center space-y-3.5 relative overflow-hidden">
                    {/* Simulated pulse/face scanning box */}
                    <div className="h-28 bg-[#090f1a] rounded border border-slate-850/70 relative flex flex-col items-center justify-center">
                      {isClocking ? (
                        <>
                          <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-500 animate-bounce w-full" />
                          <Fingerprint className="w-12 h-12 text-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase mt-2 animate-pulse">Scanning Biometric Signatures...</span>
                        </>
                      ) : (
                        <>
                          <Fingerprint className="w-12 h-12 text-slate-600" />
                          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">DEVICE MONITOR LINKED</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setIsClocking(true);
                        setTimeout(() => {
                          setIsClocking(false);
                          setStaffList(prev => prev.map(s => {
                            if (s.id === 'stf-03') { // Marcus Vance
                              const newStatus = s.checkInStatus === 'checked_in' ? 'checked_out' : 'checked_in';
                              const rawTime = new Date().toLocaleTimeString();
                              return { ...s, checkInStatus: newStatus, checkTime: rawTime };
                            }
                            return s;
                          }));
                          setAttendanceLogs(prev => [
                            `[${new Date().toLocaleTimeString()}] TELEMETRY: Coach Marcus Vance clocked IN using localized WearOS TouchID. GPS status matches Lagos Node successfully.`,
                            ...prev
                          ]);
                        }, 1500);
                      }}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-black py-3 rounded text-xs transition-colors font-mono uppercase"
                    >
                      Click to Submit Biometric (Clock IN/OUT)
                    </button>
                  </div>
                </div>
              )}

              {/* Logs */}
              <div className="space-y-1.5 mt-5 text-xs">
                <span className="text-[9.5px] font-bold text-slate-500 uppercase font-mono tracking-wider block">
                  Continuous Attendance Logs:
                </span>
                <div className="bg-slate-950 rounded border border-slate-900 p-2.5 h-[105px] overflow-y-auto space-y-1 font-mono text-[9.5px] text-slate-400 leading-normal">
                  {attendanceLogs.map((log, index) => (
                    <div key={index} className="pb-1 border-b border-slate-900/50 last:border-0 last:pb-0">
                      <span className="text-slate-600">•</span> {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
