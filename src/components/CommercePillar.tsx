import React, { useState } from 'react';
import {
  Wallet,
  Coins,
  FileCheck2,
  QrCode,
  Globe2,
  CheckCircle2,
  CreditCard,
  History,
  TrendingDown,
  Building,
  BookmarkCheck,
  Percent,
  Calculator,
  RefreshCcw,
  Sparkles
} from 'lucide-react';

interface CommercePillarProps {
  currentSubTab?: 'health-wallet' | 'insurance-market';
  onSubTabChange?: (tab: 'health-wallet' | 'insurance-market') => void;
}

export default function CommercePillar({ currentSubTab, onSubTabChange }: CommercePillarProps = {}) {
  const [internalTab, setInternalTab] = useState<'health-wallet' | 'insurance-market'>('health-wallet');
  const activeTab = currentSubTab !== undefined ? currentSubTab : internalTab;
  const setActiveTab = onSubTabChange !== undefined ? onSubTabChange : setInternalTab;

  // Wallet rewards points state
  const [rewardsPoints, setRewardsPoints] = useState<number>(1420);
  const [lastCheckinDate, setLastCheckinDate] = useState<string>('Yesterday');
  const [isCheckinLoading, setIsCheckinLoading] = useState(false);
  const [walletLogs, setWalletLogs] = useState<string[]>([
    'Synced +25 points from continuous OMRON BLE sleeping monitor logs.',
    'Redeemed -200 points for a $15 Glow MedSpa treatment voucher.'
  ]);

  // Insurance States
  const [selectedInsurer, setSelectedInsurer] = useState<'bupa' | 'united' | 'aetna'>('bupa');
  const [isVerifyingEligibility, setIsVerifyingEligibility] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<any | null>(null);

  // Claim simulation states
  const [billingCode, setBillingCode] = useState('CPT 99213 (Telemed Outpatient)');
  const [estimatedCost, setEstimatedCost] = useState(75);
  const [claimStatus, setClaimStatus] = useState<'idle' | 'submitting' | 'approved' | 'denied'>('idle');
  const [reimbursementLedger, setReimbursementLedger] = useState<any[]>([]);

  const insurerPlansMetadata = {
    bupa: { name: 'Bupa Global Elite Health Plan', deduction: '$150 remaining', copay: '85% Covered by Insurer', approved: ['Telemedicine Consults (100%)', 'Blood Biochemistry Panels (90%)', 'Physiotherapy Visits (80%)'], policy: 'BP-GL-91823' },
    united: { name: 'UnitedHealthcare Premium HMO Choice', deduction: '$450 remaining', copay: '70% Covered by Insurer', approved: ['Telemedicine Consults (100%)', 'Sports Massage Recovery (50%)', 'In-home Lab Testing (75%)'], policy: 'UH-HMO-44112' },
    aetna: { name: 'Aetna Corporate Elite Platinum Care', deduction: 'Met / $0 remaining', copay: '100% Fully Covered (Co-pay Waived)', approved: ['All Telemedicine & Remote Monitoring (100%)', 'Home Nurse Dispatches (100%)', 'Clinical Adaptogens (50%)'], policy: 'AE-CORP-PLAT' }
  };

  const handleDayCheckin = () => {
    setIsCheckinLoading(true);
    setTimeout(() => {
      setRewardsPoints(prev => prev + 50);
      setLastCheckinDate('Today');
      setWalletLogs(prev => [
        `[${new Date().toLocaleTimeString()}] CHECK-IN: Executed Daily Check-In successfully. Minted +50 Kora Points into wallet ledger.`,
        ...prev
      ]);
      setIsCheckinLoading(false);
    }, 850);
  };

  const handleVerifyEligibility = () => {
    setIsVerifyingEligibility(true);
    setEligibilityResult(null);
    setTimeout(() => {
      setEligibilityResult(insurerPlansMetadata[selectedInsurer]);
      setIsVerifyingEligibility(false);
    }, 900);
  };

  const handleSubmitClaim = () => {
    setClaimStatus('submitting');
    setTimeout(() => {
      const isEligible = true;
      const copayRate = selectedInsurer === 'bupa' ? 0.85 : selectedInsurer === 'united' ? 0.70 : 1.0;
      const covered = Math.round(estimatedCost * copayRate);
      const copayDue = estimatedCost - covered;

      setClaimStatus('approved');
      setReimbursementLedger(prev => [
        {
          id: `CLM-${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
          code: billingCode,
          insurer: insurerPlansMetadata[selectedInsurer].name.split(' ')[0],
          cost: estimatedCost,
          covered,
          copayDue,
          status: 'Cleared & Handshaked'
        },
        ...prev
      ]);
    }, 1200);
  };

  return (
    <div className="space-y-6 text-slate-300">
      
      {/* Upper Module header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 uppercase tracking-widest">
            Pillar 4 // FinTech OS
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Kora Commerce, Wallets & InsurTech Hub
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Safeguard your portable EHR passport, earn check-in wellness tokens, verify HMO eligibility, and clear medical claims instantly.
          </p>
        </div>

        {/* Global Sub Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 text-xs font-mono text-left shrink-0">
          <button
            onClick={() => setActiveTab('health-wallet')}
            className={`px-4 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'health-wallet' ? 'bg-slate-850 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Digital Health Wallet
          </button>
          <button
            onClick={() => setActiveTab('insurance-market')}
            className={`px-4 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'insurance-market' ? 'bg-slate-850 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Benefits & Claims Gateway
          </button>
        </div>
      </div>

      {/* SUB-PANELS */}

      {/* 1. Digital Health Wallet */}
      {activeTab === 'health-wallet' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left">
          
          {/* Virtual Wallet Card (5 cols) */}
          <div className="xl:col-span-4 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block border-b border-slate-850 pb-2">
                Portable Kora Wallet Pass
              </span>

              {/* GORGEOUS CREDIT CARD STYLE PASSPORT */}
              <div className="relative bg-gradient-to-br from-[#0a1b2d] via-[#103058] to-[#040d1a] rounded-2xl border border-sky-500/25 p-5 h-[190px] shadow-2xl flex flex-col justify-between overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[11px] font-mono tracking-widest text-sky-400 font-bold uppercase">KORA MEDICAL IDENTITY CARD</h4>
                    <span className="text-[9px] font-mono text-slate-400">Secure AES-256 Sovereign Node</span>
                  </div>
                  <Wallet className="w-6 h-6 text-sky-400" />
                </div>

                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase">Continuous Patient Identifier</span>
                  <strong className="text-sm font-semibold tracking-wider font-sans">Alex Mercer — Tier Active</strong>
                  <span className="text-[9.5px] font-mono text-sky-300 block">EHR_HASH // sha256_0xae41a...</span>
                </div>

                <div className="flex justify-between items-end border-t border-sky-500/10 pt-2 text-xs">
                  <div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Kora Economy Balance</span>
                    <strong className="font-mono text-yellow-400 font-bold flex items-center gap-1 text-sm">
                      <Coins className="w-4 h-4" /> {rewardsPoints} XP
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[9.5px] font-mono text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.2 rounded uppercase">
                      Pass Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Rewards check-in trigger */}
              <button
                onClick={handleDayCheckin}
                disabled={isCheckinLoading || lastCheckinDate === 'Today'}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-800 disabled:text-slate-600 font-bold text-slate-950 py-2.5 rounded text-xs transition-colors font-mono uppercase tracking-widest flex justify-center items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                {lastCheckinDate === 'Today' ? '✓ Checked-In Today (+50 XP Claimed)' : 'Execute Daily Wellness Check-In'}
              </button>
            </div>

            {/* Quick QR code mock */}
            <div className="bg-slate-950 p-3.5 border border-slate-900 rounded-lg flex items-center justify-between text-xs font-mono">
              <div className="space-y-1 pr-3">
                <span className="text-slate-400 block font-bold text-[10.5px]">Physical Scan QR Pass</span>
                <p className="text-[9.5px] text-slate-500 font-normal leading-normal font-sans">Scan this barcode at partnering MedSpas, gyms, or phlebotomy clinics for seamless eligibility clearance.</p>
              </div>
              <div className="p-1.5 bg-white rounded flex shrink-0">
                <QrCode className="w-12 h-12 text-slate-950" />
              </div>
            </div>
          </div>

          {/* Wallet Records, Prescriptions, Ledger logs (7 cols) */}
          <div className="xl:col-span-8 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[420px]">
            <div className="space-y-4">
              <span className="text-[10.5px] font-bold text-slate-400 font-mono uppercase tracking-widest block border-b border-slate-850 pb-2">
                Unified Sovereign Health Records Locker
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* EHR Medical Records List */}
                <div className="space-y-2 text-xs">
                  <span className="text-[9.5px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Verifiable Electronic Records (HL7 FHIR):</span>
                  <div className="space-y-2">
                    {/* Record 1 */}
                    <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg space-y-1 text-slate-300">
                      <div className="flex justify-between text-[11px]">
                        <strong className="text-slate-200">Biochemistry Panel</strong>
                        <span className="text-slate-500 font-mono">May 28, 2026</span>
                      </div>
                      <p className="text-slate-400 text-[10.5px] font-mono leading-none">Vials: Serum-A, Hydration Ratio: 68% (Low)</p>
                      <span className="text-[9.5px] font-mono text-emerald-400 flex items-center gap-0.5"><FileCheck2 className="w-3.5 h-3.5 text-emerald-400" /> Signed by Synlab Health LLC</span>
                    </div>

                    {/* Record 2 */}
                    <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg space-y-1 text-slate-300">
                      <div className="flex justify-between text-[11px]">
                        <strong className="text-slate-200">Daily Telemetry HRV Log</strong>
                        <span className="text-slate-500 font-mono">May 31, 2026</span>
                      </div>
                      <p className="text-slate-400 text-[10.5px] font-mono leading-none">Smartwatch Sync: Mean Sleep 5.5h, HRV: 48ms</p>
                      <span className="text-[9.5px] font-mono text-emerald-400 flex items-center gap-0.5"><FileCheck2 className="w-3.5 h-3.5 text-emerald-400" /> Signed by Kora Sensor Hub</span>
                    </div>
                  </div>
                </div>

                {/* Secure Active Prescriptions */}
                <div className="space-y-2 text-xs">
                  <span className="text-[9.5px] font-bold font-mono text-slate-500 uppercase tracking-wider block">Connected Active E-Prescriptions:</span>
                  <div className="space-y-2">
                    {/* Prescription 1 */}
                    <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-yellow-500/10 text-yellow-400 font-mono text-[8px] font-bold px-1 rounded-bl">BOOSTER</div>
                      <strong className="text-slate-200 text-[11px] block">Kora Adaptogen Cardiovascular Kit</strong>
                      <span className="text-[9.5px] font-mono text-sky-400 block">Qty: 60 capsules // Refill: Auto-refill active</span>
                      <p className="text-[9.5px] text-slate-500 mt-0.5 font-mono">Authorized: Dr. Ada Okpara, MD (Lic: #NUR-OK)</p>
                    </div>

                    {/* Prescription 2 */}
                    <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 font-mono text-[8px] font-bold px-1 rounded-bl">TREATMENT</div>
                      <strong className="text-slate-200 text-[11px] block">COLLAGEN RESTORER GLOW TREATMENT</strong>
                      <span className="text-[9.5px] font-mono text-sky-400 block">1x MedSpa Facial Peel voucher // Redeemable: London</span>
                      <p className="text-[9.5px] text-slate-500 mt-0.5 font-mono">Authorized: Glow MedSpa Clinical Esthetician</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Wallet logs stream */}
            <div className="space-y-2 pt-4 border-t border-slate-900/60">
              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider block">Wallet Economy Ledger Logs:</span>
              <div className="bg-slate-950 rounded border border-slate-900 p-2.5 h-[90px] overflow-y-auto space-y-1.5 font-mono text-[9.5px] text-slate-400 leading-normal">
                {walletLogs.map((log, index) => (
                  <div key={index} className="pb-1 border-b border-slate-900/40 last:border-0 last:pb-0">
                    {log}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. Insurance + Benefits Marketplace */}
      {activeTab === 'insurance-market' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left animate-fade-in">
          
          {/* Eligibility Verifier (5 cols) */}
          <div className="xl:col-span-5 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Real-time HMO eligibility Scanner
              </h3>
              <p className="text-[11px] text-slate-500">
                Select your current employer healthcare benefits program or private insurer and run real-time coverage verification.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">Select Insurance Program</label>
                <select
                  value={selectedInsurer}
                  onChange={(e) => {
                    setSelectedInsurer(e.target.value as any);
                    setEligibilityResult(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                >
                  <option value="bupa">Bupa Global Healthcare Elite</option>
                  <option value="united">UnitedHealthcare Premium Choice</option>
                  <option value="aetna">Aetna Corporate Enterprise Care</option>
                </select>
              </div>

              <button
                onClick={handleVerifyEligibility}
                disabled={isVerifyingEligibility}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 font-bold text-slate-950 py-2.5 rounded text-xs transition-colors font-mono uppercase tracking-widest flex justify-center items-center gap-1"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isVerifyingEligibility && 'animate-spin'}`} />
                {isVerifyingEligibility ? 'Scanning Policy Registry...' : 'Perform Eligibility Scan'}
              </button>

              {/* Eligibility results panel */}
              {eligibilityResult && (
                <div className="bg-slate-950 p-3.5 border border-slate-900 rounded-xl space-y-2.5 font-sans text-xs">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 font-mono text-[10.5px]">
                    <span className="text-slate-400 font-black">SCAN SUCCESSFUL</span>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 rounded uppercase">Coverage Active</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-200">{eligibilityResult.name}</h5>
                    <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1">
                      <span>DEDUCTIBLE STATE:</span> <strong className="text-slate-300">{eligibilityResult.deduction}</strong>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-500">
                      <span>CO-PAY SHIELD:</span> <strong className="text-sky-400 font-bold">{eligibilityResult.copay}</strong>
                    </div>
                  </div>

                  {/* Benefit highlights list */}
                  <div className="space-y-1 pt-1 border-t border-slate-900">
                    <span className="text-[9.5px] font-mono text-slate-400 font-bold uppercase block">Approved Wellness Benefits:</span>
                    <ul className="list-disc list-inside text-[10.5px] text-slate-300 space-y-0.5">
                      {eligibilityResult.approved.map((item: string, idx: number) => (
                        <li key={idx} className="leading-tight">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instant Claims Clearance (7 cols) */}
          <div className="xl:col-span-7 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[420px]">
            <div className="space-y-4">
              <span className="text-[10.5px] font-bold text-slate-400 font-mono uppercase tracking-widest block border-b border-slate-850 pb-2">
                Instant FHIR Claims Clearance sandbox
              </span>

              <p className="text-[11px] text-slate-500 font-sans leading-normal">
                Submitting a clinical billing code from a consultation (e.g. Pillar 3 CPT 99213) usually takes weeks to clear. Kora FinTech executes instant handshakes with connected HMO core APIs for immediate clearance.
              </p>

              {/* Manual Claims Submission fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-mono text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Medical Procedure Code (CPT)</span>
                  <select
                    value={billingCode}
                    onChange={(e) => {
                      setBillingCode(e.target.value);
                      const cost = e.target.value.includes('99213') ? 75 : e.target.value.includes('99091') ? 45 : 120;
                      setEstimatedCost(cost);
                      setClaimStatus('idle');
                    }}
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
                  >
                    <option value="CPT 99213 (Telemed Outpatient)">CPT 99213 (Telemed Outpatient - $75)</option>
                    <option value="CPT 99091 (Remote Data Monitor Sync)">CPT 99091 (Remote Data Monitor Sync - $45)</option>
                    <option value="CPT 97010 (Home Physiotherapy Therapy)">CPT 97010 (Home Physiotherapy - $120)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Clearance Action</span>
                  <button
                    onClick={handleSubmitClaim}
                    disabled={claimStatus === 'submitting' || !eligibilityResult}
                    className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 font-bold text-slate-950 py-1.5 rounded text-xs px-3 transition-colors uppercase tracking-wider h-9"
                  >
                    {!eligibilityResult ? '⚠ Verify HMO First' : claimStatus === 'submitting' ? 'Submitting claims packet...' : 'Transmit FHIR Packet Now'}
                  </button>
                </div>
              </div>

              {/* Reimbursement history log table */}
              <div className="space-y-2 pt-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider block">Real-time cleared claims history:</span>
                <div className="bg-slate-950 rounded border border-slate-900 p-2 max-h-[140px] overflow-y-auto space-y-1.5 font-mono text-[9.5px]">
                  {reimbursementLedger.length > 0 ? (
                    reimbursementLedger.map((claim) => (
                      <div key={claim.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-2 bg-slate-900/60 border border-slate-850 rounded text-slate-300 text-[10px] gap-2">
                        <div className="flex items-center gap-1.5">
                          <BookmarkCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <strong className="text-slate-200">{claim.id}</strong>
                            <span className="text-slate-500 text-[9px] block uppercase">{claim.code} via {claim.insurer}</span>
                          </div>
                        </div>
                        <div className="flex gap-4 font-mono font-bold shrink-0 text-right">
                          <span className="text-slate-500">Insurer: <strong className="text-emerald-400">${claim.covered}</strong></span>
                          <span className="text-slate-500">Co-pay Due: <strong className="text-sky-400">${claim.copayDue}</strong></span>
                          <span className="text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded scale-90">{claim.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-600 py-6 font-sans">No live-processed reimbursement clearings mapped in this session.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-900 pt-3 text-[9px] font-mono text-slate-500 flex justify-between items-center">
              <span>X12 270/271 FHIR REST CHANNEL</span>
              <span>SIGNER NODE: KORA_FIN_CLEARANCE_SECURE</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
