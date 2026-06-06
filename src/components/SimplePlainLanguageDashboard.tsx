import React, { useState } from 'react';
import {
  Home,
  Calendar,
  DollarSign,
  Users,
  UserCheck,
  Package,
  Layers,
  TrendingUp,
  FileCheck,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  Check,
  Plus,
  AlertCircle,
  FileText,
  MousePointer,
  HelpCircle,
  MapPin
} from 'lucide-react';

interface MenuDetail {
  id: string;
  name: string;
  tagline: string;
  details: string;
  icon: React.ReactNode;
  mockUpdates: string[];
  mockActions: string[];
}

export default function SimplePlainLanguageDashboard() {
  const [activeMenu, setActiveMenu] = useState<string>('home');
  const [workflowStep, setWorkflowStep] = useState<number>(0); // 0: inactive/intro, 1: Record, 2: Confirm, 3: Save, 4: Report/Done
  
  // Simulated database records for the Bookings workflow
  const [sessionClient, setSessionClient] = useState('Olufemi Alabi');
  const [sessionService, setSessionService] = useState('Skincare therapy & consultation');
  const [sessionTime, setSessionTime] = useState('Today at 2:00 PM');
  const [sessionCost, setSessionCost] = useState('₦15,000');
  const [sessionProvider, setSessionProvider] = useState('Specialist Jane');
  const [sessionBranch, setSessionBranch] = useState('Lagos Main Hub');

  // Interactive menu items
  const menuList: MenuDetail[] = [
    {
      id: 'home',
      name: 'Home',
      tagline: 'See main updates and quick actions',
      details: 'This is the main screen the business owner and staff see first when logging in. It gives a summary of the entire workplace situation today without complex terminology.',
      icon: <Home className="w-4 h-4" />,
      mockUpdates: [
        '📅 8 appointments scheduled for today',
        '💳 Total payments received today: ₦240,000',
        '🚨 Low Stock Notice: 2 supply items below safety levels',
        '👥 4 staff members checked-in and active'
      ],
      mockActions: [
        '✨ Create new appointment',
        '💸 Record customer payment',
        '📦 Order low supplies'
      ]
    },
    {
      id: 'bookings',
      name: 'Bookings',
      tagline: 'Make or manage appointments',
      details: 'A clean calendar view where you schedule times, choose specialists, and clear rooms/equipment to avoid double bookings.',
      icon: <Calendar className="w-4 h-4" />,
      mockUpdates: [
        'Upcoming: Olufemi Alabi, Skincare Therapy @ 2:00 PM',
        'Completed: Dr. Kola Obi, Checkup completed successfully'
      ],
      mockActions: [
        '➕ Add Reservation',
        '🗓 View Week Schedule',
        '❌ Cancel appointment'
      ]
    },
    {
      id: 'money',
      name: 'Money',
      tagline: 'Send bills, receive payments, track balances',
      details: 'Your simple cash book. Every payment is checked in, and automated splits occur (95% to the provider wallet, 5% processing to the platform pool). No complex accounting terminology.',
      icon: <DollarSign className="w-4 h-4" />,
      mockUpdates: [
        'Cleared: ₦15,000 received for Booking #bk-390',
        'Withdrawn: ₦142,500 cleared to Lagos Hub wallet'
      ],
      mockActions: [
        '🧾 Create Invoice',
        '📥 Log Payment Receipt',
        '💸 Request Settlement'
      ]
    },
    {
      id: 'team',
      name: 'Team',
      tagline: 'Add staff, check attendance, manage pay',
      details: 'Manage therapists, doctors, and specialists. Checks when they check-in for duty and tracks their commissions and pay schedules automatically.',
      icon: <Users className="w-4 h-4" />,
      mockUpdates: [
        'Active: Jessica Harrison (Therapist) checked-in at 8:00 AM',
        'Active: Dr. John Okafor (Specialist Doctor) checked-in at 9:00 AM'
      ],
      mockActions: [
        '👤 Add Team Member',
        '🕒 Update Shifts',
        '💳 Run Monthly Pay'
      ]
    },
    {
      id: 'customers',
      name: 'Customers',
      tagline: 'Save contacts, follow up, keep notes',
      details: 'Save contact lists, visit histories, specific notes, and trigger re-engagement coupons for customers who have not visited in more than 30 days.',
      icon: <UserCheck className="w-4 h-4" />,
      mockUpdates: [
        'Customer: Olufemi Alabi (Loyalty Stamp: 4/5)',
        'Alert: 2 customers inactive for over 30 days'
      ],
      mockActions: [
        '📝 Log Customer Notes',
        '🎟 Issue Inactive Discount Coupon',
        '✉ Send Follow-up Message'
      ]
    },
    {
      id: 'stock',
      name: 'Stock',
      tagline: 'Track items, update quantities, manage supplies',
      details: 'Keep counts of materials, oils, or sterile goods. Autonomously triggers purchase orders to suppliers when stock falls below safety guidelines.',
      icon: <Package className="w-4 h-4" />,
      mockUpdates: [
        'Low Stock: Organic Moisture Oil (3 items left)',
        'Draft Order: 60 units of Moisture Oil auto-dispatched to supplier'
      ],
      mockActions: [
        '📥 Check-in new shipment',
        '🧹 Run Inventory Sweep',
        '📊 Stock Valuation'
      ]
    },
    {
      id: 'branches',
      name: 'Branches',
      tagline: 'Manage multiple locations or franchise units',
      details: 'Switch between regional hubs (e.g. London, New York, Lagos Node) to check independent performance matrices under one company name.',
      icon: <Layers className="w-4 h-4" />,
      mockUpdates: [
        'Branch Active: Lagos Health Node',
        'Branch Active: London Aesthetics Hub'
      ],
      mockActions: [
        '🏢 Add New Business Location',
        '✈ Compare branch growth'
      ]
    },
    {
      id: 'reports',
      name: 'Reports',
      tagline: 'View simple charts, see growth, check progress',
      details: 'Simple graphs displaying real progress, best-performing team members, and overall earnings without jargon.',
      icon: <TrendingUp className="w-4 h-4" />,
      mockUpdates: [
        'Earning Growth: Up index 12% this month',
        'Busiest Sector: Skincare Treatments (65% of choices)'
      ],
      mockActions: [
        '📈 View Earnings Graph',
        '📊 Download Month Summary'
      ]
    },
    {
      id: 'rules',
      name: 'Rules',
      tagline: 'Stay compliant, follow policies, keep records',
      details: 'Ensures clinical and general work guidelines are locked. Separates receptionist calendar tasks from private specialist records keeping records compliant with high safety standards.',
      icon: <FileCheck className="w-4 h-4" />,
      mockUpdates: [
        'System: Staff access rights verified and correct',
        'Records Safety Check: Complete (100% compliant)'
      ],
      mockActions: [
        '🛡 Check Permissions Matrix',
        '📋 Generate Compliance Logs'
      ]
    },
    {
      id: 'assistant',
      name: 'Assistant',
      tagline: 'Get suggestions, reminders, helpful insights',
      details: 'An intelligent guide that predicts peak booking times, suggests dynamic price changes, and acts as a direct business mentor.',
      icon: <Sparkles className="w-4 h-4" />,
      mockUpdates: [
        'AI Predicts: Booking demand will surge 25% this upcoming Friday',
        'Reminder: Send retention discount codes to 2 lapsed customers'
      ],
      mockActions: [
        '🔮 Forecast Demand',
        '💡 Show Pricing Suggestions'
      ]
    }
  ];

  const handleStartWorkflow = () => {
    setActiveMenu('bookings');
    setWorkflowStep(1); // Start at Record
  };

  const handleNextStep = () => {
    if (workflowStep < 4) {
      setWorkflowStep(prev => prev + 1);
    }
  };

  const handleResetWorkflow = () => {
    setWorkflowStep(1);
  };

  const getActiveMenuDetails = () => {
    return menuList.find(m => m.id === activeMenu) || menuList[0];
  };

  const activeInfo = getActiveMenuDetails();

  return (
    <div className="bg-[#020613] text-slate-100 p-4 md:p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
      
      {/* HEADER BAR */}
      <div className="bg-[#0b142d] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-[#10b981] bg-[#10b981]/15 px-2.5 py-0.5 rounded border border-[#10b981]/25 uppercase font-bold">
              Kora SBOS Blueprint
            </span>
            <span className="text-[10px] font-mono tracking-widest text-amber-400 bg-amber-400/15 px-2.5 py-0.5 rounded border border-amber-400/25 uppercase font-bold">
              Simple OS Design Mode
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">
            Domain-Driven plain-Language Dashboard & Workflow Mockup
          </h2>
          <p className="text-xs text-slate-400">
            A layout focused purely on professional clarity. No jargon, no engineering abbreviations, completely understandable. Every system operates on a 4-step backbone: <strong>Record → Confirm → Save → Report</strong>.
          </p>
        </div>
        <button
          onClick={handleStartWorkflow}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-lg flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Calendar className="w-4 h-4 text-slate-950" />
          <span>Launch Booking Workflow Simulator</span>
        </button>
      </div>

      {/* METRIC VISUAL HOVER CARD SYSTEM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-left">
          <span className="text-[11px] font-mono text-slate-500 block uppercase font-bold">Platform-Wide Standard Spine</span>
          <strong className="text-sm text-emerald-400 block mt-1">Record → Confirm → Save → Report</strong>
          <span className="text-[10.5px] text-slate-400 mt-1 block">A predictable backbone that ensures items are entered, cross-checked safely, locked in, and automatically updated.</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-left">
          <span className="text-[11px] font-mono text-slate-500 block uppercase font-bold">Menus Layout Placement</span>
          <strong className="text-sm text-cyan-400 block mt-1">Sturdy Left Sidebar Navigation</strong>
          <span className="text-[10.5px] text-slate-400 mt-1 block">All 10 plain-language menus are located permanently on the left side to maximize vertical height on desktops and slide on mobile.</span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-left">
          <span className="text-[11px] font-mono text-slate-500 block uppercase font-bold">First Look Priority On Home</span>
          <strong className="text-sm text-amber-400 block mt-1">Daily updates & Fast Actions</strong>
          <span className="text-[10.5px] text-slate-400 mt-1 block">Staff see main status indicators (appointments, sales, active team, warning boxes) and direct buttons first.</span>
        </div>
      </div>

      {/* DESIGN LAYOUT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: THE SIDEBAR LAYOUT MAP DIAGRAM */}
        {/* ========================================== */}
        <div className="lg:col-span-4 bg-[#070c17]/95 border border-slate-800 rounded-xl p-4 md:p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                🗺️ Left Sidebar Layout Map
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                ACTIVE
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 my-3 leading-relaxed font-sans">
              Click any menu label below. The right panel will load that exact screen mockup interactively!
            </p>

            {/* Menu List representing the layout */}
            <div className="space-y-1.5">
              {menuList.map((m) => {
                const isActive = activeMenu === m.id && workflowStep === 0;
                const isWorkflowActive = activeMenu === 'bookings' && workflowStep > 0 && m.id === 'bookings';

                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveMenu(m.id);
                      setWorkflowStep(0); // clear simulator if navigating other menus
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-mono font-bold transition-all text-left border cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow'
                        : isWorkflowActive
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded ${isActive ? 'bg-slate-800 text-emerald-400' : 'text-slate-500'}`}>
                        {m.icon}
                      </div>
                      <span className="text-[12px]">{m.name}</span>
                    </div>
                    {m.id === 'bookings' && workflowStep > 0 ? (
                      <span className="text-[9px] bg-cyan-500 text-slate-950 font-sans font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Workflow Active
                      </span>
                    ) : (
                      <span className="text-slate-600 group-hover:text-slate-400 text-[10px]">
                        {m.id === 'home' ? '🏠' : m.id === 'bookings' ? '🗓' : '💼'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-[10px] font-mono text-slate-500">
            <div className="flex justify-between">
              <span>DESIGN PARADIGM:</span>
              <span className="text-slate-300">Plain Business OS</span>
            </div>
            <div className="flex justify-between">
              <span>ROLE CAPABILITIES:</span>
              <span className="text-emerald-400">Owner, Staff & Customer</span>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: INTERACTIVE WORKFLOW PREVIEW */}
        {/* ========================================== */}
        <div className="lg:col-span-8 bg-[#040813] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
          
          {/* Top of Right Frame: Path indicator */}
          <div className="bg-[#0b142d] border-b border-slate-800 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-mono text-slate-500 uppercase">Dashboard Screen</span>
              <span className="text-slate-600 font-mono">/</span>
              <span className="text-xs font-mono font-bold text-white uppercase">{activeInfo.name}</span>
            </div>
            {workflowStep > 0 && (
              <div className="flex items-center gap-1 bg-cyan-950 border border-cyan-800 px-2.5 py-1 rounded-md text-[10px] font-mono text-cyan-400">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
                <span>Active Step: {workflowStep}/4</span>
              </div>
            )}
          </div>

          {/* MAIN PREVIEW AREA */}
          <div className="p-5 md:p-6 text-left flex-grow">
            
            {/* WORKFLOW SIMULATOR (BOOKINGS SPINE OVERLAY) */}
            {activeMenu === 'bookings' && workflowStep > 0 ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* Visual Backbone Progress bar */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center space-y-3 select-none">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Appointment Backbone Path</span>
                    <span className="text-emerald-400 font-bold">Standard Simple Spine</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                    
                    {/* step 1 */}
                    <div className={`flex-1 flex flex-col items-center p-1.5 rounded transition-all ${
                      workflowStep === 1 
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                        : 'text-slate-500'
                    }`}>
                      <span className="font-bold text-sm">Step 1</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Record</span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

                    {/* step 2 */}
                    <div className={`flex-1 flex flex-col items-center p-1.5 rounded transition-all ${
                      workflowStep === 2 
                        ? 'bg-purple-400/10 text-purple-400 border border-purple-400/20' 
                        : 'text-slate-500'
                    }`}>
                      <span className="font-bold text-sm">Step 2</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Confirm</span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

                    {/* step 3 */}
                    <div className={`flex-1 flex flex-col items-center p-1.5 rounded transition-all ${
                      workflowStep === 3 
                        ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20' 
                        : 'text-slate-500'
                    }`}>
                      <span className="font-bold text-sm">Step 3</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Save</span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

                    {/* step 4 */}
                    <div className={`flex-1 flex flex-col items-center p-1.5 rounded transition-all ${
                      workflowStep === 4 
                        ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' 
                        : 'text-slate-500'
                    }`}>
                      <span className="font-bold text-sm">Step 4</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Report</span>
                    </div>

                  </div>
                </div>

                {/* STEP DETAILS */}
                {workflowStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 space-y-2">
                      <strong className="text-sm text-amber-400 flex items-center gap-1.5 font-sans">
                        <Plus className="w-4 h-4" /> STEP 1: RECORD — Input Customer & Appointment Details
                      </strong>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        The interface shows simple, friendly fields. No clinical codings or backend jargon, just a humble form to enter who is visiting and what therapy they request.
                      </p>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono">Who is visiting? (Customer Name)</label>
                          <input
                            type="text"
                            value={sessionClient}
                            onChange={(e) => setSessionClient(e.target.value)}
                            className="w-full bg-[#030610] text-white border border-slate-700 rounded p-2 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono">Which Service / Treatment?</label>
                          <input
                            type="text"
                            value={sessionService}
                            onChange={(e) => setSessionService(e.target.value)}
                            className="w-full bg-[#030610] text-white border border-slate-700 rounded p-2 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono">When is the visit? (Time Segment)</label>
                          <input
                            type="text"
                            value={sessionTime}
                            onChange={(e) => setSessionTime(e.target.value)}
                            className="w-full bg-[#030610] text-white border border-slate-700 rounded p-2 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono">Which Specialist / Therapist?</label>
                          <input
                            type="text"
                            value={sessionProvider}
                            onChange={(e) => setSessionProvider(e.target.value)}
                            className="w-full bg-[#030610] text-white border border-slate-700 rounded p-2 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <p className="text-[11px] text-slate-500 font-sans">
                        Press <strong>Continue to Cross-Check</strong> to proceed to Step 2.
                      </p>
                      <button
                        onClick={handleNextStep}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold font-sans rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>Continue to Cross-Check</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {workflowStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-purple-400/5 border border-purple-400/20 rounded-xl p-4 space-y-2">
                      <strong className="text-sm text-purple-400 flex items-center gap-1.5 font-sans">
                        <Clock className="w-4 h-4" /> STEP 2: CONFIRM — Safety & Collision Checks
                      </strong>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Before committing the data, the system automatically checks resource schedules to prevent overlapping assignments. It runs checks on: <em>Specialist Working Hours, Room Space Allocations, and Medical Equipment readiness</em>.
                      </p>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3.5 text-xs text-left">
                      <h4 className="font-mono text-white text-xs border-b border-slate-800 pb-1 uppercase tracking-wider">
                        Integrity Checks Summary
                      </h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center border-b border-slate-800/40 pb-1.5">
                          <span className="text-slate-400">Specialist duty availability ({sessionProvider})</span>
                          <span className="text-emerald-400 font-bold font-mono flex items-center gap-1 uppercase tracking-widest text-[9.5px]">
                            <Check className="w-3 h-3" /> Clean / Free
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-800/40 pb-1.5">
                          <span className="text-slate-400">Consultation room space available ({sessionBranch})</span>
                          <span className="text-emerald-400 font-bold font-mono flex items-center gap-1 uppercase tracking-widest text-[9.5px]">
                            <Check className="w-3 h-3" /> Allocated
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-800/40 pb-1.5">
                          <span className="text-slate-400">Retail & medical supplies checked</span>
                          <span className="text-emerald-400 font-bold font-mono flex items-center gap-1 uppercase tracking-widest text-[9.5px]">
                            <Check className="w-3 h-3" /> Fully Prepared
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5">
                          <span className="text-slate-300 font-semibold font-sans">Calculated price split & commissions</span>
                          <span className="text-teal-400 font-bold text-sm">
                            {sessionCost}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <p className="text-[11px] text-slate-500 font-sans">
                        Everything looks correct. Click <strong>Lock and Save Record</strong>.
                      </p>
                      <button
                        onClick={handleNextStep}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold font-sans rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>Lock and Save Record</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {workflowStep === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-blue-400/5 border border-blue-400/20 rounded-xl p-4 space-y-2 text-left">
                      <strong className="text-sm text-blue-400 flex items-center gap-1.5 font-sans">
                        <CheckCircle className="w-4 h-4" /> STEP 3: SAVE — Locked and Logged
                      </strong>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        The record is permanently logged in the secure saving center. No data corruption can occur, and background operations are safe from conflicting edits. Let's see the details before outputting report matrices.
                      </p>
                    </div>

                    {/* Visual Success Card */}
                    <div className="bg-gradient-to-r from-[#0d2a45]/40 via-[#0d1d2d]/30 to-[#0d2a45]/40 border border-blue-500/35 rounded-xl p-5 text-center space-y-3">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full border border-blue-400/30 flex items-center justify-center mx-auto text-blue-400 text-xl animate-pulse">
                        🔒
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white tracking-tight">Record Securely Written</h4>
                        <p className="text-slate-400 text-[11px] font-mono">ID: bk-{Math.floor(1000 + Math.random() * 9000)} · Locked at: {new Date().toISOString()}</p>
                      </div>
                      <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 inline-block text-left text-[11px] font-mono text-slate-300">
                        • Customer details cleared to database.<br />
                        • Specialist booked: {sessionProvider}<br />
                        • Scheduled segment: {sessionTime}
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <p className="text-[11px] text-slate-500 font-sans">
                        Click <strong>Output Report and Income</strong> to complete the spine.
                      </p>
                      <button
                        onClick={handleNextStep}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold font-sans rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>Output Report and Income</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {workflowStep === 4 && (
                  <div className="space-y-4 animate-fade-in text-left">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                      <strong className="text-sm text-emerald-400 flex items-center gap-1.5 font-sans">
                        <TrendingUp className="w-4 h-4" /> STEP 4: REPORT — Automated Chart Updates & Pay Schedules
                      </strong>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        The spine ends with an action complete report. The income splits instantly to the money view, therapist parameters update on the team view, and visitor notes list on the customer view. No loose ends.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                        <strong className="text-white block uppercase text-[10.5px]">Money & Splitting Updates</strong>
                        <div className="border-t border-slate-800/60 pt-2 space-y-1.5 text-slate-300">
                          <p className="flex justify-between">
                            <span>Platform Fee Drop (5%):</span>
                            <span className="text-emerald-400">+₦750</span>
                          </p>
                          <p className="flex justify-between">
                            <span>Therapist Vault split (95%):</span>
                            <span className="text-emerald-400">+₦14,250</span>
                          </p>
                          <p className="flex justify-between">
                            <span>Overall Earnings update:</span>
                            <span className="text-cyan-400">Total updated</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                        <strong className="text-white block uppercase text-[10.5px]">Customer Engagement Metrics</strong>
                        <div className="border-t border-slate-800/60 pt-2 space-y-1.5 text-slate-300">
                          <p className="flex justify-between">
                            <span>Contact logged:</span>
                            <span className="text-slate-400">{sessionClient}</span>
                          </p>
                          <p className="flex justify-between">
                            <span>Stamp Card added:</span>
                            <span className="text-amber-400">+1 stamp validated</span>
                          </p>
                          <p className="flex justify-between text-rose-400 font-bold">
                            <span>Retain check:</span>
                            <span>Active (Not Lapsed)</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          ✓
                        </div>
                        <div className="text-left font-sans">
                          <span className="block text-white text-xs font-bold leading-normal">Full Workflow Complete!</span>
                          <span className="block text-[11px] text-slate-500 leading-normal">The complete Record → Confirm → Save → Report spine executed safely.</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleResetWorkflow}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold font-sans rounded-lg text-xs transition-all border border-slate-800 cursor-pointer"
                        >
                          Restart simulation
                        </button>
                        <button
                          onClick={() => {
                            setWorkflowStep(0);
                            setActiveMenu('home');
                          }}
                          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-sans rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Return Home
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* INDIVIDUAL GENERAL MENUS RENDERER */
              <div className="space-y-6 animate-fade-in text-left">
                
                {/* Visual Intro Panel */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                      {activeInfo.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{activeInfo.name}</h3>
                      <p className="text-xs text-emerald-400 font-mono italic leading-none">{activeInfo.tagline}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mt-2">
                    {activeInfo.details}
                  </p>
                </div>

                {/* Grid showing mock data representing Home view priorities */}
                {activeMenu === 'home' ? (
                  <div className="space-y-5 animate-fade-in text-left">
                    {/* Home Screen Priorities */}
                    <div>
                      <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-2">
                        📊 First-Look Main Updates (Today's Dashboard Stream)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeInfo.mockUpdates.map((upd, idx) => (
                          <div key={idx} className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 p-3 rounded-xl transition-all flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                            <span className="text-xs text-slate-200">{upd}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-2">
                        ⚡ Quick Action Buttons
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {activeInfo.mockActions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={handleStartWorkflow}
                            className="bg-[#0b142d] hover:bg-[#121f3f] border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-teal-400 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{act}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Embedded Blueprint map block */}
                    <div className="bg-gradient-to-r from-[#070c17] via-[#0b142b] to-[#070c17] border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <strong className="text-xs font-sans text-white block">Interactive Spine Simulator is Ready!</strong>
                        <p className="text-[11px] text-slate-400">See the full Record → Confirm → Save → Report workflow sequence in practical action.</p>
                      </div>
                      <button
                        onClick={handleStartWorkflow}
                        className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-mono font-bold cursor-pointer shrink-0"
                      >
                        Launch Simulation
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="space-y-5 animate-fade-in text-left">
                    {/* Other menus generic view */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      
                      {/* Updates box */}
                      <div className="md:col-span-7 bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-3">
                        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-black block">
                          Current Updates Inside {activeInfo.name}
                        </span>
                        <div className="space-y-2 text-xs">
                          {activeInfo.mockUpdates.map((item, idx) => (
                            <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-slate-200">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Management Action list */}
                      <div className="md:col-span-5 bg-[#0b142d]/30 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-black block">
                            Quick Operations
                          </span>
                          <div className="space-y-1.5">
                            {activeInfo.mockActions.map((act, idx) => (
                              <button
                                key={idx}
                                className="w-full text-left p-2 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-[11px] text-slate-300 hover:text-white rounded transition-all flex items-center justify-between cursor-pointer"
                              >
                                <span>{act}</span>
                                <span className="text-slate-600">→</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-500 font-mono mt-4 leading-relaxed font-sans p-2 bg-slate-950 rounded border border-slate-900">
                          💡 Every change follows the simple Record → Confirm → Save → Report spine.
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Footer of the Preview Area */}
          <div className="bg-[#070c17] border-t border-slate-800/80 px-5 py-3.5 flex items-center justify-between select-none font-mono text-[9.5px] text-slate-500">
            <span className="tracking-wide">SYSTEM FEEDBACK: ALL CHANNELS STABLE</span>
            <span>OS MODE: EXTREME SIMPLICITY</span>
          </div>

        </div>

      </div>

    </div>
  );
}
