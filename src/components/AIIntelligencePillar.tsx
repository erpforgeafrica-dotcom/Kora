import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Heart,
  Droplet,
  Moon,
  TrendingUp,
  Sliders,
  AlertTriangle,
  Flame,
  User,
  Image,
  ScanFace,
  ShieldCheck,
  CheckCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Coffee
} from 'lucide-react';

interface AIIntelligencePillarProps {
  currentSubTab?: 'wellness-twin' | 'skin-analyzer';
  onSubTabChange?: (tab: 'wellness-twin' | 'skin-analyzer') => void;
}

export default function AIIntelligencePillar({ currentSubTab, onSubTabChange }: AIIntelligencePillarProps = {}) {
  const [internalTab, setInternalTab] = useState<'wellness-twin' | 'skin-analyzer'>('wellness-twin');
  const activeTab = currentSubTab !== undefined ? currentSubTab : internalTab;
  const setActiveTab = onSubTabChange !== undefined ? onSubTabChange : setInternalTab;

  // Wellness Twin States (tactile sliders)
  const [sleepHours, setSleepHours] = useState<number>(5.5);
  const [waterMl, setWaterMl] = useState<number>(1200);
  const [exerciseMins, setExerciseMins] = useState<number>(15);
  const [caffeineLevel, setCaffeineLevel] = useState<'none' | 'low' | 'high'>('high');
  const [stressLevel, setStressLevel] = useState<'low' | 'med' | 'high'>('high');

  // Derived Score Engine calculated reactively
  const [wellnessScore, setWellnessScore] = useState<number>(55);
  const [customRecommendations, setCustomRecommendations] = useState<string[]>([]);

  useEffect(() => {
    // Math model translating parameters to score
    let score = 50;
    
    // Sleep points (max 20)
    score += Math.min(20, (sleepHours * 2.5));

    // Water points (max 20)
    score += Math.min(20, (waterMl / 150));

    // Exercise points (max 20)
    score += Math.min(20, (exerciseMins * 0.6));

    // Caffeine penalties
    if (caffeineLevel === 'none') score += 10;
    if (caffeineLevel === 'low') score += 5;
    if (caffeineLevel === 'high') score -= 10;

    // Stress penalties
    if (stressLevel === 'low') score += 10;
    if (stressLevel === 'med') score += 0;
    if (stressLevel === 'high') score -= 15;

    // Boundary constraints
    const finalScore = Math.max(10, Math.min(100, Math.round(score)));
    setWellnessScore(finalScore);

    // Dynamic AI Suggestions list
    const recs: string[] = [];
    if (sleepHours < 6.5) {
      recs.push("🚨 Critical Sleep Hygeine Warning: Rest tracker is under 6.5 hours. Limit afternoon coffee and enable the 'Unplug-at-8 Series' challenge in Pillar 1.");
    }
    if (waterMl < 2000) {
      recs.push("💧 Intracellular Hydration Deficit: Consuming under 2L daily. Book a skin restore treatment in London and activate the Kora Labs cardiovascular hydration kit.");
    }
    if (exerciseMins < 30) {
      recs.push("🏃 High Sedentary Factor: Training duration is sub-optimal. Coordinate a 40-minute Pilates Core reformer slot inside the Super App Marketplace.");
    }
    if (stressLevel === 'high') {
      recs.push("⚡ Severe Occupational Cortisol Spike: Aggregated biometrics suggest high adrenaline stress. Dynamic Pricing Engine has queued a 40% deep-tissue massage discount for Tuesday.");
    }
    if (recs.length === 0) {
      recs.push("🌟 Excellence Achieved: Your biometric twins show perfect home-ostatic equilibrium. Standard wellness points multiplier +1.5x activated in Health Wallet!");
    }
    setCustomRecommendations(recs);

  }, [sleepHours, waterMl, exerciseMins, caffeineLevel, stressLevel]);

  // Skin Analyzer States
  const [skinPreset, setSkinPreset] = useState<'acne' | 'pigment' | 'healthy'>('acne');
  const [skinScanState, setSkinScanState] = useState<'idle' | 'scanning' | 'completed'>('idle');
  const [skinDiagnostics, setSkinDiagnostics] = useState<any | null>(null);

  const skinPresetsMetadata = {
    acne: {
      imagePlaceholder: 'Moderate Acne breakout on cheeks and nasal boundaries. Red inflammatory nodes.',
      riskScore: 68,
      type: 'Sensitive Acne-Prone Combination',
      breakout: 'Moderate breakouts (12 active pustules, redness indices elevated)',
      elasticity: 'Good (Water saturation deficient)',
      sensitivity: 'High (Localized histamine congestion on forehead)',
      regimen: 'Hydra-Restore Hyaluronic Acid Serum (Day) + Premium Adaptogen Booster (Night)',
      referralLead: 'Glow MedSpa London (Facial Esthetician, Dr. Chloe Vance)',
      leadStatus: 'PII_LEAD_DISPATCHED_TO_MERCHANT_OK'
    },
    pigment: {
      imagePlaceholder: 'Hyperpigmentation lines near lower eyelids. Fine lines and mild moisture wrinkles.',
      riskScore: 48,
      type: 'Dry Dehydrated Prone to Aging',
      breakout: 'Insignificant breakouts (0 pustules, baseline low)',
      elasticity: 'Fair (Mild collage reduction, micro-wrinkles detected around orbital bones)',
      sensitivity: 'Medium (Slight vascular irritation)',
      regimen: 'Youth-Restore Collagen Infusion Therapy + CoQ10 Antioxidant Capsules',
      referralLead: 'Sloane Facial Experts (Esthetics lead)',
      leadStatus: 'PII_LEAD_DISPATCHED_TO_MERCHANT_OK'
    },
    healthy: {
      imagePlaceholder: 'Symmetric smooth skin surface. No visible pustules or inflammatory redness.',
      riskScore: 12,
      type: 'Balanced Hydrated Normal Skin',
      breakout: 'Zero breakouts (Pores clear, sebum levels locked at ideal homeostasis)',
      elasticity: 'Perfect (Optimal collagen density, high rebound metrics)',
      sensitivity: 'Low',
      regimen: 'Standard Hydra-Restore AHA wash (Continuous)',
      referralLead: 'Glow MedSpa London (Routine maintenance)',
      leadStatus: 'LEAD_STANDBY'
    }
  };

  const handleRunSkinScan = () => {
    setSkinScanState('scanning');
    setSkinDiagnostics(null);
    setTimeout(() => {
      setSkinDiagnostics(skinPresetsMetadata[skinPreset]);
      setSkinScanState('completed');
    }, 1800);
  };

  return (
    <div className="space-y-6 text-slate-300">
      
      {/* Upper Module header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
            Pillar 5 // AI Intelligence Labs
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Kora AI Autonomous Intelligence & Wellness Twin
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Probe your dynamic biometric Wellness Twin, adjust sleep-water sliders, and evaluate computerized dermatological skin scanners.
          </p>
        </div>

        {/* Global Sub Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 text-xs font-mono text-left shrink-0">
          <button
            onClick={() => setActiveTab('wellness-twin')}
            className={`px-4 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'wellness-twin' ? 'bg-slate-850 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            AI Wellness Twin
          </button>
          <button
            onClick={() => setActiveTab('skin-analyzer')}
            className={`px-4 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'skin-analyzer' ? 'bg-slate-850 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            AI Skin Analyzer
          </button>
        </div>
      </div>

      {/* SUB-PANELS */}

      {/* 1. AI Wellness Twin */}
      {activeTab === 'wellness-twin' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left">
          
          {/* Biometric Slider Inputs (5 cols) */}
          <div className="xl:col-span-4 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="text-emerald-400 w-4 h-4" />
                TACTILE BIOMETRIC ADJUSTMENTS
              </h3>
              <p className="text-[11px] text-slate-500">
                Adjust daily habits to instantly model how your digital Wellness Twin re-calculates the health score.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Sleep Sliders */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 text-[10.5px]">
                  <span>1. MEAN SLEEP DURATION</span>
                  <strong className="text-emerald-400 font-bold flex items-center gap-1"><Moon className="w-3.5 h-3.5" /> {sleepHours} Hrs</strong>
                </div>
                <input
                  type="range"
                  min="4"
                  max="10"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(+e.target.value)}
                  className="w-full h-1 bg-slate-950 rounded-lg cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Water Sliders */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-slate-400 text-[10.5px]">
                  <span>2. ACTIVE WATER INTAKE</span>
                  <strong className="text-emerald-400 font-bold flex items-center gap-1"><Droplet className="w-3.5 h-3.5" /> {waterMl} mL</strong>
                </div>
                <input
                  type="range"
                  min="500"
                  max="4000"
                  step="100"
                  value={waterMl}
                  onChange={(e) => setWaterMl(+e.target.value)}
                  className="w-full h-1 bg-slate-950 rounded-lg cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Workout Sliders */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-slate-400 text-[10.5px]">
                  <span>3. RECOVERY TRAINING TIME</span>
                  <strong className="text-emerald-400 font-bold flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {exerciseMins} Mins</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="5"
                  value={exerciseMins}
                  onChange={(e) => setExerciseMins(+e.target.value)}
                  className="w-full h-1 bg-slate-950 rounded-lg cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Caffeine Option */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">4. CAFFEINE LOADING</span>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {(['none', 'low', 'high'] as const).map(lev => (
                    <button
                      key={lev}
                      onClick={() => setCaffeineLevel(lev)}
                      className={`py-1 rounded text-[10px] font-mono border capitalize ${
                        caffeineLevel === lev
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold'
                          : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300'
                      }`}
                    >
                      {lev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stress Option */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">5. BIOMETRIC CORTISOL (STRESS)</span>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {(['low', 'med', 'high'] as const).map(lev => (
                    <button
                      key={lev}
                      onClick={() => setStressLevel(lev)}
                      className={`py-1 rounded text-[10px] font-mono border capitalize ${
                        stressLevel === lev
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold'
                          : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300'
                      }`}
                    >
                      {lev}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Core Score Ring & AI Advice (8 cols) */}
          <div className="xl:col-span-8 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[440px]">
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 font-mono uppercase tracking-widest block border-b border-slate-850 pb-2">
                Unified AI Wellness Twin Dashboard
              </span>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4 items-center">
                
                {/* Visual Ring (5 cols) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-3 text-center border-r border-slate-850/60">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    {/* Circle SVG */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72" cy="72" r="62"
                        stroke="#111827" strokeWidth="10" fill="transparent"
                      />
                      <circle
                        cx="72" cy="72" r="62"
                        stroke={wellnessScore > 80 ? '#10b981' : wellnessScore > 50 ? '#fbbf24' : '#ef4444'}
                        strokeWidth="10" fill="transparent"
                        strokeDasharray={390}
                        strokeDashoffset={390 - (390 * wellnessScore) / 100}
                        className="transition-all duration-700 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    {/* Ring Text */}
                    <div className="absolute flex flex-col items-center">
                      <span className="text-4xl font-black text-white font-mono tracking-tighter">{wellnessScore}</span>
                      <span className="text-[9.5px] font-mono text-slate-400 font-bold uppercase tracking-wider mt-0.5">Wellness Index</span>
                    </div>
                  </div>

                  <strong className={`text-xs uppercase font-mono mt-4 font-black ${
                    wellnessScore > 80 ? 'text-emerald-400' : wellnessScore > 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {wellnessScore > 80 && 'Homeostasis Reached'}
                    {wellnessScore > 50 && wellnessScore <= 80 && 'Sub-optimal State'}
                    {wellnessScore <= 50 && 'Moderate Health Risk'}
                  </strong>
                </div>

                {/* AI Advice list (7 cols) */}
                <div className="md:col-span-7 space-y-3 self-start">
                  <div className="flex items-center gap-1">
                    <Sparkles className="text-emerald-400 w-4 h-4 animate-spin-slow" />
                    <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                      Dynamic Coach Recommendations
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 text-xs">
                    {customRecommendations.map((rec, id) => (
                      <div key={id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-900 leading-normal text-slate-300">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Safe Badge */}
            <div className="border-t border-slate-900 pt-3 text-[9px] font-mono text-slate-500 flex justify-between items-center mt-4">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> BIO-METADATA ENCRYPTED VIA COMPRESSED CLIENT BOUNDS</span>
              <span>COACH: KORA_TWIN_V1</span>
            </div>
          </div>

        </div>
      )}

      {/* 2. AI Skin Analyzer */}
      {activeTab === 'skin-analyzer' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left animate-fade-in">
          
          {/* Preset Selector & Action (5 cols) */}
          <div className="xl:col-span-5 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="border-b border-slate-850 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Derm Scan Profiler & preset switcher
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select a typical user-profile derm image scan, and engage the AI-driven diagnostics model.
                </p>
              </div>

              {/* Skin Swapper */}
              <div className="space-y-2.5 font-mono text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Select Derm Image Preset</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {(['acne', 'pigment', 'healthy'] as const).map(preset => (
                    <button
                      key={preset}
                      onClick={() => {
                        setSkinPreset(preset);
                        setSkinScanState('idle');
                        setSkinDiagnostics(null);
                      }}
                      className={`p-2 rounded font-mono text-[10.5px] border capitalize ${
                        skinPreset === preset
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30 font-bold'
                          : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300'
                      }`}
                    >
                      {preset} PRESET
                    </button>
                  ))}
                </div>
              </div>

              {/* IMAGE SCAN BOX */}
              <div className="relative bg-slate-950 rounded-xl border border-slate-900/80 h-[170px] flex flex-col items-center justify-center p-4 overflow-hidden text-center">
                {skinScanState === 'scanning' && (
                  <div className="absolute inset-0 bg-purple-500/10 z-10 animate-pulse pointer-events-none border-t-2 border-purple-500 animate-skin-probe" />
                )}
                
                <ScanFace className="text-purple-400 w-9 h-9 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase mt-2.5">
                  DERM_IMAGE_ACTIVE.PNG
                </span>
                <p className="text-[10px] text-slate-500 font-sans max-w-xs leading-normal mt-1 italic">
                  "{skinPresetsMetadata[skinPreset].imagePlaceholder}"
                </p>
              </div>

            </div>

            <button
              onClick={handleRunSkinScan}
              disabled={skinScanState === 'scanning'}
              className="w-full bg-purple-500 hover:bg-purple-400 disabled:bg-slate-800 text-slate-950 font-bold py-3 rounded-lg text-xs font-mono uppercase tracking-widest flex justify-center items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${skinScanState === 'scanning' && 'animate-spin'}`} />
              {skinScanState === 'idle' && 'Engage AI Skin Analyzer Scan'}
              {skinScanState === 'scanning' && 'Profiling Acne/Hydration Vectors...'}
              {skinScanState === 'completed' && 'Scan Completed ✓ run Again'}
            </button>
          </div>

          {/* Diagnostics Display (7 cols) */}
          <div className="xl:col-span-7 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[440px]">
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 font-mono uppercase tracking-widest block border-b border-slate-850 pb-2">
                Sovereign Dermatological Diagnosis File
              </span>

              {skinDiagnostics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 font-sans text-xs">
                  
                  {/* Part A: Metrics */}
                  <div className="space-y-3.5">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-900 space-y-2">
                      <div className="flex justify-between font-mono text-[10.5px]">
                        <span className="text-slate-500 uppercase font-black">DERMATOLOGICAL RISK</span>
                        <span className={`font-bold ${skinDiagnostics.riskScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{skinDiagnostics.riskScore}%</span>
                      </div>
                      <div className="flex justify-between font-mono text-[10.5px]">
                        <span className="text-slate-500 uppercase font-black">CLASSIFIED SKIN TYPE</span>
                        <strong className="text-purple-400 truncate">{skinDiagnostics.type.split(' ')[0]}</strong>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-[9.5px] font-mono text-slate-500 uppercase tracking-wider block">Visual Breakdown:</strong>
                      <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg text-[10.5px] text-slate-300 space-y-1 font-mono leading-tight">
                        <div>• Breakout: <strong className="text-slate-400">{skinDiagnostics.breakout}</strong></div>
                        <div>• Elasticity: <strong className="text-slate-400">{skinDiagnostics.elasticity}</strong></div>
                        <div>• Sensitivity: <strong className="text-slate-400">{skinDiagnostics.sensitivity}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Part B: Referrals */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <strong className="text-[9.5px] font-mono text-slate-400 uppercase tracking-wider block">Automated Regimen Recommendation:</strong>
                      <div className="bg-slate-950/70 border border-slate-900 p-3 rounded-lg text-slate-300 text-[10.5px] leading-relaxed">
                        {skinDiagnostics.regimen}
                      </div>
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/25 p-3 rounded-lg space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9.5px] font-mono text-purple-400 font-bold uppercase tracking-wider block">Auto Lead Dispatch (HIPAA)</span>
                        <span className="text-[8px] bg-purple-500/15 text-purple-400 font-mono px-1.5 rounded uppercase font-black">DISPATCHED</span>
                      </div>
                      <p className="text-[10.5px] text-slate-300 leading-normal">
                        Derm scan telemetry was securely dispatched to <strong>{skinDiagnostics.referralLead}</strong>. Booking pre-filled and mapped to Kora Wallet.
                      </p>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-28 text-center space-y-2 font-sans text-slate-500">
                  <ScanFace className="w-12 h-12 text-slate-700 mx-auto" />
                  <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">Scanner Offline</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    Select a skin preset (acne, wrinkles, or healthy) and click analyze on the left to start image profiling.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Safe Badge */}
            <div className="border-t border-slate-900 pt-3 text-[9px] font-mono text-slate-500 flex justify-between items-center mt-4">
              <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> CLINICAL DATA PROTECTED BY BAA HANDSHAKE</span>
              <span>ENGINE: KORA_DERM_ENGINE_01</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
