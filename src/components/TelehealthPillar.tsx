import React, { useState, useEffect } from 'react';
import {
  Activity,
  PhoneCall,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Sparkles,
  FileSpreadsheet,
  AlertTriangle,
  Play,
  Heart,
  PlusSquare,
  ShieldAlert,
  Users,
  CheckCircle,
  Stethoscope,
  Smartphone
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface TelehealthPillarProps {
  currentSubTab?: 'smart-consult' | 'remote-monitor';
  onSubTabChange?: (tab: 'smart-consult' | 'remote-monitor') => void;
}

export default function TelehealthPillar({ currentSubTab, onSubTabChange }: TelehealthPillarProps = {}) {
  const [internalTab, setInternalTab] = useState<'smart-consult' | 'remote-monitor'>('smart-consult');
  const activeTab = currentSubTab !== undefined ? currentSubTab : internalTab;
  const setActiveTab = onSubTabChange !== undefined ? onSubTabChange : setInternalTab;

  // Smart Consult States
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isMicActive, setIsMicActive] = useState(true);
  const [scribeStatus, setScribeStatus] = useState<'idle' | 'recording' | 'parsing' | 'completed'>('idle');
  const [transcriptText, setTranscriptText] = useState('');
  const [soapNotes, setSoapNotes] = useState<any | null>(null);

  // Simulated transcription stream
  const patientDialogue = [
    "Doc: Hello there! Thanks for tuning in to Kora Care Room. What seems to be the trouble?",
    "Patient: Hi Doctor, honestly, I am feeling absolutely exhausted lately. I wake up tired, get intense brain fog around 3 PM, and I've been having slight joint stiffness after training.",
    "Doc: I see. Are you keeping hydrated, and how has your sleeping pattern been?",
    "Patient: No, honestly, I barely drink two cups of water and I drink quite a lot of coffee to stay awake. I average 5.5 hours of sleep, and my smart watch reports my heart rate variability has declined."
  ];

  // Remote Monitor States
  const [monitoringScenario, setMonitoringScenario] = useState<'normal' | 'hypertension' | 'diabetic'>('normal');
  const [ecgStreamData, setEcgStreamData] = useState<any[]>([]);

  // Android Watch / Doctor Telemonitoring Sync States
  const [isAndroidSynced, setIsAndroidSynced] = useState(true);
  const [androidHeartRate, setAndroidHeartRate] = useState(72);
  const [androidSystolic, setAndroidSystolic] = useState(120);
  const [watchActiveAlert, setWatchActiveAlert] = useState(false);
  const [doctorFeedback, setDoctorFeedback] = useState('Patient displays normal resting telemetry. Continuous remote oversight remains active.');
  const [feedbackIsSubmitted, setFeedbackIsSubmitted] = useState(false);
  const [watchLogs, setWatchLogs] = useState<string[]>([
    'WearOS AndroidWatch initialized. Version 4.2 paired via local Bluetooth Low Energy Node.',
    'Doctor Remote Monitoring Stream established securely. HIPAA BAA certified under audit ledger #RPM-800'
  ]);

  // Generate simulated dynamic ECG/PPG waves
  useEffect(() => {
    const points: any[] = [];
    const scale = monitoringScenario === 'normal' ? 1.0 : monitoringScenario === 'hypertension' ? 1.4 : 1.1;
    for (let i = 0; i < 20; i++) {
      let val = Math.sin(i * 0.5) * 10;
      if (i % 6 === 0) val += 35 * scale; // QRS peak
      if (i % 6 === 1) val -= 15 * scale; // S wave dip
      points.push({ time: `${i}s`, mv: +(val + Math.random() * 2).toFixed(1) });
    }
    setEcgStreamData(points);

    // ECG pulse live updater
    const interval = setInterval(() => {
      setEcgStreamData(prev => {
        const nextTime = parseInt(prev[prev.length - 1].time) + 1;
        let p = Math.sin(nextTime * 0.5) * 10;
        if (nextTime % 6 === 0) p += 35 * scale;
        if (nextTime % 6 === 1) p -= 15 * scale;
        const newPoints = [...prev.slice(1), { time: `${nextTime}s`, mv: +(p + Math.random() * 2).toFixed(1) }];
        return newPoints;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [monitoringScenario]);

  // Effect to sync Android watch parameters to scenario
  useEffect(() => {
    if (monitoringScenario === 'normal') {
      setAndroidHeartRate(72);
      setAndroidSystolic(120);
      setWatchActiveAlert(false);
      setWatchLogs(prev => [
        `[${new Date().toLocaleTimeString()}] WearOS BLE Sync: Resting heart rate settled at 72bpm. BP trace matches standard baseline.`,
        ...prev
      ]);
    } else if (monitoringScenario === 'hypertension') {
      setAndroidHeartRate(94);
      setAndroidSystolic(168);
      setWatchActiveAlert(true);
      setWatchLogs(prev => [
        `[${new Date().toLocaleTimeString()}] WearOS ALARM: Sphygmomanometer reported 168mmHg. Auto-notifying attending Doctor.`,
        `[${new Date().toLocaleTimeString()}] Android OS: Haptic alarm patterns triggered on synchronized patient watch.`,
        ...prev
      ]);
    } else if (monitoringScenario === 'diabetic') {
      setAndroidHeartRate(82);
      setAndroidSystolic(128);
      setWatchActiveAlert(true);
      setWatchLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Continuous Glucometer: Glucose rate rose to 12.8 mmol/L. WearOS widget flashing red warnings.`,
        `[${new Date().toLocaleTimeString()}] Android Core: Transferred XML telemetry chunk via encrypted websocket listener.`,
        ...prev
      ]);
    }
  }, [monitoringScenario]);

  const handleRunAiScribe = () => {
    setScribeStatus('recording');
    setTranscriptText('');
    setSoapNotes(null);

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < patientDialogue.length) {
        setTranscriptText(prev => prev + (prev ? '\n\n' : '') + patientDialogue[currentLine]);
        currentLine++;
      } else {
        clearInterval(interval);
        setScribeStatus('parsing');
        setTimeout(() => {
          setScribeStatus('completed');
          setSoapNotes({
            summary: "34-year-old client presents with classic symptoms of sleep deprivation, metabolic dehydration, and chronic occupational fatigue. Manifests low Heart Rate Variability telemetry.",
            subjective: "Complains of fatigue upon waking, acute afternoon brain fog, and localized muscular stiffness following fitness sessions. Elevated daily caffeine intake (>3 cups) with low water consumption.",
            objective: "BLE smart watch logs verify 5.5h mean sleep duration. Pulse rate during telemedicine call: 74 bpm. Calculated hydration index is severely sub-optimal.",
            assessment: "Mild dehydration (E86.0) coupled with chronic sub-clinical fatigue (R53.83). Muscular stiffness likely exacerbated by inadequate post-exercise tissue hydration.",
            plan: [
              "Prescribe Hydrate-Restore Adaptogen bundle via Kora Wallet.",
              "Offer discount booking for deep-tissue massage in Pillar 2.",
              "Activate 30-Day Hydration Challenge inside Corporate Portal.",
              "Re-evaluate BLE smartwatch sleeping trends automatically in 14 days."
            ],
            diagnosisCodes: [
              { code: "ICD-10 R53.83", desc: "Chronic Occupational Fatigue" },
              { code: "ICD-10 E86.0", desc: "Dehydration & Intracellular Fluid Loss" }
            ],
            billingCodes: [
              { code: "CPT 99213", desc: "Outpatient Telemed Evaluation (Low-Complexity)" },
              { code: "CPT 99091", desc: "Remote Biometrics Digital Transmission Sync" }
            ]
          });
        }, 1500);
      }
    }, 1800);
  };

  const currentVitals = {
    normal: { bp: '122/80', glucose: '5.2 mmol/L', hr: '72 bpm', alert: false, text: "Vitals normal. BLE sensors continuously synced without anomalies." },
    hypertension: { bp: '168/98', glucose: '5.8 mmol/L', hr: '94 bpm', alert: true, text: "CRITICAL ALERT: Advanced Hypertension Spike detected via BLE Sphygmomanometer." },
    diabetic: { bp: '128/82', glucose: '12.8 mmol/L', hr: '82 bpm', alert: true, text: "CRITICAL ALERT: Severe Hyperglycemia trend detected via continuous BLE Glucometer." }
  }[monitoringScenario];

  return (
    <div className="space-y-6 text-slate-300">
      
      {/* Upper Module header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-widest">
            Pillar 3 // Care Hub
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Telehealth & Remote Monitoring Command
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Integrate virtual Smart Rooms with automated SOAP scribes, or monitor BLE medical telemetry with instant escalations.
          </p>
        </div>

        {/* Global Sub Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 text-xs font-mono text-left shrink-0">
          <button
            onClick={() => setActiveTab('smart-consult')}
            className={`px-4 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'smart-consult' ? 'bg-slate-850 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Smart Consultation
          </button>
          <button
            onClick={() => setActiveTab('remote-monitor')}
            className={`px-4 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'remote-monitor' ? 'bg-slate-850 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Remote Monitoring
          </button>
        </div>
      </div>

      {/* SUB-PANELS */}

      {/* 1. Smart Consult Room */}
      {activeTab === 'smart-consult' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left">
          
          {/* Virtual video room (5 cols) */}
          <div className="xl:col-span-5 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <span className="text-[10px] font-bold font-mono text-slate-400 uppercase flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-red-400" /> Live WebRTC Session
                </span>
                <span className="text-[9px] font-mono text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" /> SECURE_CONNECTED
                </span>
              </div>

              {/* Patient simulated avatar card */}
              <div className="relative bg-slate-950 rounded-xl border border-slate-900/80 h-[210px] flex items-center justify-center overflow-hidden">
                {isCameraActive ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                    {/* Animated sound wave as patient voice */}
                    <div className="flex items-center gap-1 h-12">
                      <div className={`w-1.5 bg-red-500 rounded-full transition-all duration-300 ${scribeStatus === 'recording' ? 'animate-bounce-slow h-8' : 'h-3'}`} />
                      <div className={`w-1.5 bg-emerald-500 rounded-full transition-all duration-300 ${scribeStatus === 'recording' ? 'animate-bounce-fast h-12' : 'h-4'}`} style={{ animationDelay: '0.1s' }} />
                      <div className={`w-1.5 bg-sky-500 rounded-full transition-all duration-300 ${scribeStatus === 'recording' ? 'animate-bounce-slow h-10' : 'h-2'}`} style={{ animationDelay: '0.2s' }} />
                      <div className={`w-1.5 bg-purple-500 rounded-full transition-all duration-300 ${scribeStatus === 'recording' ? 'animate-bounce-fast h-7' : 'h-3'}`} style={{ animationDelay: '0.3s' }} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-4">Patient ID: PAT-COR-099 // ADA_VOICE</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4">
                    <VideoOff className="w-10 h-10 text-slate-600 animate-pulse" />
                    <span className="text-[10.5px] font-mono text-slate-500 font-bold uppercase mt-2">VIDEO_FEED_MUTED</span>
                  </div>
                )}

                {/* Video controls */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 z-10 text-slate-300">
                  <button
                    onClick={() => setIsCameraActive(!isCameraActive)}
                    className={`p-1 rounded-full text-slate-400 hover:text-white transition-colors ${!isCameraActive && 'bg-red-500/10 text-red-400'}`}
                  >
                    <Video className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsMicActive(!isMicActive)}
                    className={`p-1 rounded-full text-slate-400 hover:text-white transition-colors ${!isMicActive && 'bg-red-500/10 text-red-400'}`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Scribe active trigger */}
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-xs font-sans space-y-1.5 text-slate-400 leading-normal">
                <p>
                  Clicking the button triggers Kora's continuous deep-speech listening engine, which captures patient feedback and instantly generates HIPAA-compliant medical chart files.
                </p>
              </div>

              <button
                onClick={handleRunAiScribe}
                disabled={scribeStatus === 'recording' || scribeStatus === 'parsing'}
                className="w-full bg-red-500 hover:bg-red-400 disabled:bg-slate-800 text-slate-950 font-bold py-3 rounded-lg text-xs font-mono uppercase tracking-wider flex justify-center items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 animate-spin-slow text-slate-950 fill-slate-950" />
                {scribeStatus === 'idle' && 'Begin AI Live Scribe'}
                {scribeStatus === 'recording' && 'Scribing Audio Stream...'}
                {scribeStatus === 'parsing' && 'Extracting Diagnostic Codes...'}
                {scribeStatus === 'completed' && 'Scribe Completed ✓ Run Again'}
              </button>
            </div>
          </div>

          {/* Scribe transcription & SOAP Notes outputs (7 cols) */}
          <div className="xl:col-span-7 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[440px]">
            <div>
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block border-b border-slate-850 pb-2">
                Unified HIPAA AI Clinical Chart Desk
              </span>

              {scribeStatus !== 'idle' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  
                  {/* Realtime Transcription Stream */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Live Microphone Transcript:</span>
                    <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 h-[290px] overflow-y-auto text-[11px] font-mono text-slate-300 leading-normal whitespace-pre-wrap">
                      {transcriptText}
                      {scribeStatus === 'recording' && (
                        <span className="inline-block w-1.5 h-3 bg-red-400 animate-pulse ml-1" />
                      )}
                    </div>
                  </div>

                  {/* Smart Generated SOAP Notes */}
                  <div className="space-y-2 text-xs">
                    <span className="text-[9.5px] font-bold font-mono text-slate-500 uppercase tracking-wider block">HIPAA Synthesized SOAP File:</span>
                    <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 h-[290px] overflow-y-auto space-y-3.5 leading-relaxed text-[11px] text-slate-400">
                      
                      {scribeStatus === 'recording' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 font-mono text-[10px] text-slate-600">
                          <Mic className="w-7 h-7 text-red-500 animate-pulse" />
                          <span>Listening to dialogue... SOAP file writes on completion.</span>
                        </div>
                      )}

                      {scribeStatus === 'parsing' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 font-mono text-[10px] text-slate-500">
                          <Sparkles className="w-7 h-7 text-emerald-400 animate-spin" />
                          <span>Executing Gemini LLM classifier. Structuring clinical ICD-10 templates...</span>
                        </div>
                      )}

                      {scribeStatus === 'completed' && soapNotes && (
                        <div className="space-y-3 font-sans text-slate-300">
                          <div>
                            <strong className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block">Clinical Narrative Summary:</strong>
                            <p className="mt-0.5 text-slate-300 leading-normal">{soapNotes.summary}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 border-t border-slate-900 pt-2 font-mono text-[10px]">
                            <div>
                              <strong className="text-sky-400 uppercase">S - Subjective:</strong>
                              <p className="mt-0.5 text-slate-400 leading-tight">{soapNotes.subjective}</p>
                            </div>
                            <div>
                              <strong className="text-amber-400 uppercase">O - Objective:</strong>
                              <p className="mt-0.5 text-slate-400 leading-tight">{soapNotes.objective}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 border-t border-slate-900 pt-2 font-mono text-[10px]">
                            <div>
                              <strong className="text-red-400 uppercase">A - Assessment:</strong>
                              <p className="mt-0.5 text-slate-400 leading-tight">{soapNotes.assessment}</p>
                            </div>
                            <div>
                              <strong className="text-emerald-400 uppercase">P - Proposed Plan:</strong>
                              <ul className="list-disc list-inside mt-0.5 text-slate-400 space-y-0.5">
                                {soapNotes.plan.map((p: string, idx: number) => (
                                  <li key={idx} className="leading-tight">{p}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Extractions */}
                          <div className="border-t border-slate-900 pt-2.5 font-mono text-[9px] text-slate-500 space-y-1.5">
                            <div className="flex gap-2">
                              <span className="font-bold text-slate-400 uppercase">DIAGNOSIS (ICD-10):</span>
                              {soapNotes.diagnosisCodes.map((d: any, idx: number) => (
                                <span key={idx} className="bg-red-500/10 text-red-400 px-1 py-0.2 rounded font-bold" title={d.desc}>{d.code}</span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <span className="font-bold text-slate-400 uppercase">BILLING CODES (CPT):</span>
                              {soapNotes.billingCodes.map((b: any, idx: number) => (
                                <span key={idx} className="bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded font-bold" title={b.desc}>{b.code}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              )}

              {scribeStatus === 'idle' && (
                <div className="flex flex-col items-center justify-center py-28 text-center space-y-2 font-sans text-slate-500">
                  <FileSpreadsheet className="w-12 h-12 text-slate-700 mx-auto" />
                  <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">Scribe Standby Mode</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    Activate the AI Live Scribe on the left to start processing WebRTC voice packets into detailed medical charts.
                  </p>
                </div>
              )}
            </div>

            {/* Safety badge */}
            <div className="border-t border-slate-900 pt-3 flex justify-between items-center text-[9.5px] font-mono text-slate-500">
              <span className="flex items-center gap-1 text-slate-500 font-bold"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> BAA HIPAA COMPLIANT CRYPTO SCHEME ACTIVE</span>
              <span>SIGNATURE: KORA_MED_SCRIBE</span>
            </div>
          </div>

        </div>
      )}

      {/* 2. Remote Monitoring Command */}
      {activeTab === 'remote-monitor' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left animate-fade-in">
          
          {/* BLE readings list & controller (5 cols) */}
          <div className="xl:col-span-4 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="border-b border-slate-850 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  BLE Device Telemetry Scenarios
                </h3>
                <p className="text-[11px] text-slate-500">
                  Trigger different biometric behaviors on connected BLE monitors and watch automated AI escalations.
                </p>
              </div>

              {/* Scenarios selector */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider uppercase block">
                  Select Monitoring Scenario
                </span>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setMonitoringScenario('normal')}
                    className={`p-2.5 rounded-lg border text-left transition-colors font-mono uppercase ${
                      monitoringScenario === 'normal'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    1. Benign Normal Vitals
                  </button>
                  <button
                    onClick={() => setMonitoringScenario('hypertension')}
                    className={`p-2.5 rounded-lg border text-left transition-colors font-mono uppercase ${
                      monitoringScenario === 'hypertension'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    2. Sphygmomanometer Spike (Hypertension)
                  </button>
                  <button
                    onClick={() => setMonitoringScenario('diabetic')}
                    className={`p-2.5 rounded-lg border text-left transition-colors font-mono uppercase ${
                      monitoringScenario === 'diabetic'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    3. Continuous Glucose Deterioration (Hyperglycemia)
                  </button>
                </div>
              </div>

              {/* Connected BLE List */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[9.5px] font-bold text-slate-500 font-mono uppercase tracking-wider block">Synced Patient Devices:</span>
                <div className="space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between p-1.5 bg-slate-950 border border-slate-900 rounded">
                    <span className="text-slate-400">BP Monitor (OMRON-X3)</span>
                    <strong className={monitoringScenario === 'hypertension' ? 'text-red-400 font-black' : 'text-emerald-400'}>{currentVitals.bp}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-950 border border-slate-900 rounded">
                    <span className="text-slate-400">Glucometer (DEXCOM-G7)</span>
                    <strong className={monitoringScenario === 'diabetic' ? 'text-red-400 font-black' : 'text-emerald-400'}>{currentVitals.glucose}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 bg-slate-950 border border-slate-900 rounded">
                    <span className="text-slate-400">Smartwatch (HRV/Sleep Tracker)</span>
                    <strong className="text-emerald-400">{currentVitals.hr}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning diagnostic text */}
            <div className={`p-3 rounded border text-[11px] leading-relaxed font-mono ${
              currentVitals.alert 
                ? 'bg-red-500/11 border-red-500/25 text-red-400 font-black animate-pulse' 
                : 'bg-slate-950 border-slate-900 text-slate-500'
            }`}>
              <div className="flex items-start gap-1 pb-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{currentVitals.text}</span>
              </div>
            </div>
          </div>

          {/* Graphical Waves & AI Escalation Workflow (8 cols) */}
          <div className="xl:col-span-8 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[440px]">
            <div className="space-y-4">
              <span className="text-[10.5px] font-bold text-slate-400 font-mono uppercase tracking-widest block border-b border-slate-850 pb-2">
                Live Biometric Signal / Photoplethysmogram (PPG) Stream
              </span>

              {/* Curve chart */}
              <div className="h-[140px] bg-slate-950 rounded-xl border border-slate-900/80 p-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ecgStreamData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEcg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={monitoringScenario === 'normal' ? "#10b981" : "#ef4444"} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={monitoringScenario === 'normal' ? "#10b981" : "#ef4444"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#101827" />
                    <Tooltip contentStyle={{ backgroundColor: '#090f1a', borderColor: '#1e293b' }} />
                    <Area type="monotone" dataKey="mv" stroke={monitoringScenario === 'normal' ? "#10b981" : "#ef4444"} fillOpacity={1} fill="url(#colorEcg)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
                
                <span className="absolute top-2 right-3 font-mono text-[9px] text-slate-600 font-bold">
                  FREQ: 250Hz // STREAM_MODE: {monitoringScenario.toUpperCase()}
                </span>
              </div>

              {/* AI Escalation Dashboard */}
              <div className="space-y-2.5">
                <span className="text-[9.5px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                  Automated AI Health Escalation Sequence:
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                  {/* Step 1 */}
                  <div className={`p-3 rounded border ${
                    currentVitals.alert ? 'bg-red-500/10 border-red-500/25 text-red-300' : 'bg-slate-950/40 border-slate-900 text-slate-500'
                  }`}>
                    <span className="block font-black text-[10px] text-slate-500">STEP 1 // PRESCRIPTION VAU-ADJUST</span>
                    <p className="mt-1 leading-normal text-[10.5px]">
                      {monitoringScenario === 'normal' && 'Standby. No emergency pharmacological vectors required.'}
                      {monitoringScenario === 'hypertension' && '✓ Automatically pushed SOS beta-blocker prescription to patient Health Wallet.'}
                      {monitoringScenario === 'diabetic' && '✓ Automatically updated insulin schedule in portable Kora health records.'}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className={`p-3 rounded border ${
                    currentVitals.alert ? 'bg-red-500/10 border-red-500/25 text-red-300' : 'bg-slate-950/40 border-slate-900 text-slate-500'
                  }`}>
                    <span className="block font-black text-[10px] text-slate-500">STEP 2 // HOME HEALTH DISPATCH</span>
                    <p className="mt-1 leading-normal text-[10.5px]">
                      {monitoringScenario === 'normal' && 'Standby. Mobile clinic dispatchers not triggered.'}
                      {monitoringScenario === 'hypertension' && '✓ Enlisted emergency phlebotomy nurse visit. GPS tracking enabled.'}
                      {monitoringScenario === 'diabetic' && '✓ Dispatched at-home sample gathering provider with secure diagnostic link.'}
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className={`p-3 rounded border ${
                    currentVitals.alert ? 'bg-red-500/10 border-red-500/25 text-red-300' : 'bg-slate-950/40 border-slate-900 text-slate-500'
                  }`}>
                    <span className="block font-black text-[10px] text-slate-500">STEP 3 // FAMILY EMERGENCY SYNC</span>
                    <p className="mt-1 leading-normal text-[10.5px]">
                      {monitoringScenario === 'normal' && 'Standby. Family circle monitoring inactive.'}
                      {monitoringScenario === 'hypertension' && '✓ Sent high blood pressure alert to family, HMO insurer, and primary care clinic.'}
                      {monitoringScenario === 'diabetic' && '✓ Transmitted real-time glycemic index alert to family circle dashboard.'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Sign and time */}
            <div className="border-t border-slate-900 pt-3 text-[9.5px] font-mono text-slate-500 flex justify-between items-center">
              <span>LEDGER LINK: KORA_BLE_CRITICAL_SCROLL</span>
              <span>SIGNATURE: ANONYMOUS_ZERO_KNOWLEDGE_PROOF_AUDITED</span>
            </div>
          </div>

          {/* WearOS Smartwatch & Attending Doctor Interface Hub (Total 12 cols row spans below) */}
          <div className="col-span-12 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4 text-left">
            <div className="border-b border-slate-850 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400 animate-pulse" /> WearOS Android Smartwatch & Clinician Telemonitoring Hub
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Virtual Android/WearOS watches continuously transmit biological vitals logs directly to the doctor-facing terminal.
                </p>
              </div>
              
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <span className="text-slate-500">WearOS Protocol Status:</span>
                <span className={`px-2 py-0.5 rounded font-black border uppercase ${
                  isAndroidSynced 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/30 text-rose-400 animate-pulse'
                }`}>
                  {isAndroidSynced ? 'CONNECTED_OK // BLE_LINK' : 'OFFLINE // SYNC_HALTED'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* WearOS Device Simulator Panel (4 cols) */}
              <div className="lg:col-span-4 bg-slate-950 rounded-xl p-4 border border-slate-900 flex flex-col justify-between items-center space-y-4">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider text-center block w-full">
                  Virtual Patient WearOS Watch Face
                </span>

                {/* Circular watch screen design */}
                <div className="w-40 h-40 rounded-full bg-slate-900 ring-4 ring-slate-800 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden shadow-lg border border-slate-850">
                  {/* Neon active radar lines */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.04)_0%,transparent_70%)] animate-pulse" />
                  
                  {isAndroidSynced ? (
                    <div className="space-y-1 z-10">
                      <Heart className={`w-8 h-8 text-rose-500 mx-auto ${watchActiveAlert ? 'animate-bounce scale-110' : 'animate-pulse'}`} />
                      <strong className={`text-xl font-bold tracking-tight block ${watchActiveAlert ? 'text-red-400 font-black' : 'text-slate-100'}`}>
                        {androidHeartRate} <span className="text-[11px] text-slate-400 font-normal">bpm</span>
                      </strong>
                      <div className="text-[10px] font-mono text-slate-400 leading-tight">
                        Systolic: <strong className={watchActiveAlert ? 'text-red-400 font-black' : 'text-slate-200'}>{androidSystolic} mmHg</strong>
                      </div>
                      <span className="text-[8.5px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded scale-90 block">
                        Watch BLE OK
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 z-10 text-slate-500 font-mono">
                      <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto animate-pulse" />
                      <span className="text-[10px] block uppercase font-black text-rose-400">BLE DISCONNECTED</span>
                      <span className="text-[8px] leading-tight block text-slate-600">Re-enable smartwatch bluetooth link below to resume.</span>
                    </div>
                  )}
                </div>

                {/* Smartwatch Controls */}
                <div className="w-full space-y-2 text-xs font-mono">
                  <button
                    onClick={() => {
                      setIsAndroidSynced(!isAndroidSynced);
                      setWatchLogs(prev => [
                        `[${new Date().toLocaleTimeString()}] WATCH: User ${!isAndroidSynced ? 'enabled' : 'terminated'} WearOS Bluetooth controller. Socket link updated.`,
                        ...prev
                      ]);
                    }}
                    className={`w-full py-2 px-3 rounded text-[11.5px] font-bold text-center border capitalize transition-all ${
                      isAndroidSynced 
                        ? 'bg-red-500/10 hover:bg-red-500/20 text-rose-400 border-red-500/25' 
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-transparent font-black'
                    }`}
                  >
                    {isAndroidSynced ? 'Disable Smartwatch BLE Syncing' : 'Register and Active AndroidWatch link'}
                  </button>

                  <button
                    onClick={() => {
                      if (!isAndroidSynced) return;
                      const offsetHR = Math.floor(70 + Math.random() * 20);
                      const offsetSys = Math.floor(115 + Math.random() * 15);
                      setAndroidHeartRate(offsetHR);
                      setAndroidSystolic(offsetSys);
                      setWatchLogs(prev => [
                        `[${new Date().toLocaleTimeString()}] WearOS BLE Package: Pulse check transmitted. HR: ${offsetHR}bpm, BP Systolic: ${offsetSys}mmHg. Sync status matches Lagos Node.`,
                        ...prev
                      ]);
                    }}
                    disabled={!isAndroidSynced}
                    className="w-full bg-slate-900 border border-slate-850 hover:bg-slate-850 disabled:bg-slate-950 disabled:text-slate-700 hover:text-white py-2 px-3 rounded text-[11px] text-slate-400 font-semibold"
                  >
                    Transmit Mock WearOS pulse check (BLE)
                  </button>
                </div>
              </div>

              {/* Clinician Interface Dashboard (5 cols) */}
              <div className="lg:col-span-5 bg-slate-950 rounded-xl p-4 border border-slate-900 flex flex-col justify-between space-y-3.5">
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">
                    Attending Physician Remote Command Platform
                  </span>

                  {/* Doctor Alarm Check */}
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 space-y-2 text-xs leading-normal font-sans">
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                      <span>PATIENT ASSIGNED:</span>
                      <strong className="text-slate-200">KOLE ALASE, AGE 34</strong>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-850 pt-2 text-[10.5px]">
                      <span className="text-slate-400 font-sans">Systolic Alarm Constraint (&gt;140):</span>
                      <span className={`font-mono font-bold ${androidSystolic > 140 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                        {androidSystolic > 140 ? '⚠️ EXCEEDED' : '✓ SECURE'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="text-slate-400 font-sans">Heart Rate Constraint (&gt;90 bpm):</span>
                      <span className={`font-mono font-bold ${androidHeartRate > 90 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                        {androidHeartRate > 90 ? '⚠️ EXCEEDED' : '✓ SECURE'}
                      </span>
                    </div>
                  </div>

                  {/* Doctor feedback form */}
                  <div className="space-y-1 bg-slate-900/40 p-2.5 rounded border border-slate-850">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono block">Attending Clinician Diagnosis/Notes</label>
                    <textarea
                      rows={3}
                      value={doctorFeedback}
                      onChange={(e) => {
                        setDoctorFeedback(e.target.value);
                        setFeedbackIsSubmitted(false);
                      }}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {feedbackIsSubmitted && (
                    <div className="bg-emerald-500/10 border border-emerald-500/25 p-2 rounded text-[10.5px] text-emerald-400 text-center font-bold font-mono">
                      ✓ CLINICAL DIAGNOSIS IMMUTABLY TRANSLATED TO HEALTH WALLET
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setFeedbackIsSubmitted(true);
                      setWatchLogs(prev => [
                        `[${new Date().toLocaleTimeString()}] CLINIC: Attending MD digitally signed off telemonitoring block. Notes locked: "${doctorFeedback}"`,
                        ...prev
                      ]);
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded text-xs transition-colors font-mono uppercase"
                  >
                    Digitally Sign & Validate Remote Patient Telemetry
                  </button>
                </div>
              </div>

              {/* Secure Log Trace (3 cols) */}
              <div className="lg:col-span-3 bg-slate-950 rounded-xl p-4 border border-slate-900 flex flex-col justify-between">
                <div className="space-y-2 h-full flex flex-col justify-start">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">
                    BLE Watch telemetry stream
                  </span>
                  
                  <div className="bg-slate-900 rounded border border-slate-850 p-2.5 h-[230px] overflow-y-auto space-y-2 font-mono text-[9px] text-slate-400 leading-normal flex-grow">
                    {watchLogs.map((log, index) => (
                      <div key={index} className="pb-1.5 border-b border-slate-950 last:border-0 last:pb-0">
                        <span className="text-emerald-400 font-bold">&gt;&gt;</span> {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
