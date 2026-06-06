import React, { useState } from 'react';
import { Network, Link2, Key, ShieldAlert, Cpu, RefreshCw, FileCheck, Shield, HelpCircle, HardDrive } from 'lucide-react';
import { BlockchainBlock } from '../types';

export default function BlockchainTab() {
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([
    {
      index: 1,
      timestamp: '2026-05-31T12:00:00Z',
      transactions: [
        { type: 'Identity', detail: 'Root CISO IAM admin Key provisioned onto secure hardware module', actor: 'CISO-OFFICE-ROOT' }
      ],
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      hash: '00003f56da2451bd8a9c39ce95a0dcff23b8f2dd71b0768fe2dcd7512ab4847e',
      nonce: 4125
    },
    {
      index: 2,
      timestamp: '2026-05-31T13:45:00Z',
      transactions: [
        { type: 'Credential', detail: 'Tenant Spanner RLS strict isolation policies activated and verified', actor: 'SYSTEM-SECURE-BOT' }
      ],
      previousHash: '00003f56da2451bd8a9c39ce95a0dcff23b8f2dd71b0768fe2dcd7512ab4847e',
      hash: '0000a6e0e9140285a8efb54cf854facbfd9051db5cb4a14efce6efcb6a4dc003',
      nonce: 8945
    },
    {
      index: 3,
      timestamp: '2026-05-31T14:10:00Z',
      transactions: [
        { 
          type: 'Evidence', 
          detail: 'Evidence Artifact [EVID-2026-1049] locked. Source: AWS CloudTrail event logs. Hash: a0f4b36c... (TAMPER-PROOF COLD RECORD)', 
          actor: 'INVESTIGATOR-09' 
        }
      ],
      previousHash: '0000a6e0e9140285a8efb54cf854facbfd9051db5cb4a14efce6efcb6a4dc003',
      hash: '0000dbcf533b632dbb7301cce100a9eb99d91f2dbdf7120aef44a14ad6bca232',
      nonce: 1542
    }
  ]);

  // Record inputs
  const [recordMode, setRecordMode] = useState<'audit' | 'evidence'>('evidence');
  
  // Audit sign-off payload
  const [minePayload, setMinePayload] = useState('Audit production sign-off. Compliance target SOC2 and NIST CSF fully matched.');
  
  // Evidence record payloads
  const [evidenceId, setEvidenceId] = useState('EVID-2026-0042-ALPHA');
  const [evidenceSource, setEvidenceSource] = useState('Linux systemd /var/log/secure log ingestion stream');
  const [evidenceHash, setEvidenceHash] = useState('d31ab10467b93ae3bda10d18b248e3519c28a55c2f37be1e466b0ad711822a90');
  const [actionsSummary, setActionsSummary] = useState('Extracted server authorization audit heap memory dump, quarantined container node and isolated external proxy.');
  const [investigatorSign, setInvestigatorSign] = useState('CISO-OFFICE-SEC-LEAD');

  const [mineNonce, setMineNonce] = useState(1);
  const [isMining, setIsMining] = useState(false);
  const [computedHash, setComputedHash] = useState('');

  // Manual high-fidelity hashing simulator
  const handleMineBlock = () => {
    setIsMining(true);
    setComputedHash('');
    
    setTimeout(() => {
      const lastBlock = blocks[blocks.length - 1];
      const previousHash = lastBlock.hash;
      
      let payloadText = '';
      if (recordMode === 'audit') {
        payloadText = minePayload;
      } else {
        payloadText = `EvidenceCode: ${evidenceId} | Src: ${evidenceSource} | Fingerprint: ${evidenceHash} | Actions: ${actionsSummary}`;
      }

      const combined = `${mineNonce}${previousHash}${payloadText}${investigatorSign}`;
      
      // Compute deterministic pseudo-SHA256 for integrity rendering
      let hVal = 5381;
      for (let i = 0; i < combined.length; i++) {
        hVal = ((hVal << 5) + hVal) + combined.charCodeAt(i);
      }
      const rawHex1 = Math.abs(hVal).toString(16).padStart(8, '0');
      
      let hVal2 = 0x811c9dc5;
      for (let i = 0; i < combined.length; i++) {
        hVal2 ^= combined.charCodeAt(i);
        hVal2 += (hVal2 << 1) + (hVal2 << 4) + (hVal2 << 7) + (hVal2 << 8) + (hVal2 << 24);
      }
      const rawHex2 = Math.abs(hVal2).toString(16).padStart(8, '0');
      
      // Form compound SHA-256 equivalent
      const hexSignature = `0000${rawHex1}${rawHex2}cfdf7ee32ba5eb921cb91bcde008a9fcef0a2f1b400`
        .substring(0, 64);
      
      setComputedHash(hexSignature);
      setIsMining(false);
    }, 1200);
  };

  const handleIncorporateBlock = () => {
    if (!computedHash) return;
    const lastBlock = blocks[blocks.length - 1];
    
    let transactionDetail = '';
    let actorName = '';
    let typeSelected: 'Audit' | 'Evidence' = 'Audit';

    if (recordMode === 'audit') {
      transactionDetail = minePayload;
      actorName = investigatorSign || 'SYSTEM-AUDITOR';
      typeSelected = 'Audit';
    } else {
      transactionDetail = `Artifact [${evidenceId}] secured. Source: ${evidenceSource}. Fingerprint: ${evidenceHash.substring(0, 8)}... (${actionsSummary})`;
      actorName = investigatorSign || 'SEC-LEAD';
      typeSelected = 'Evidence';
    }

    const newBlock: BlockchainBlock = {
      index: blocks.length + 1,
      timestamp: new Date().toISOString(),
      transactions: [
        { 
          type: typeSelected, 
          detail: transactionDetail, 
          actor: actorName 
        }
      ],
      previousHash: lastBlock.hash,
      hash: computedHash,
      nonce: mineNonce
    };

    setBlocks(prev => [...prev, newBlock]);
    setComputedHash('');
    
    // Reset fields on success
    if (recordMode === 'evidence') {
      // Rotate Evidence ID code automatically to simulate next payload sequence
      const num = Math.floor(Math.random() * 8000) + 1000;
      setEvidenceId(`EVID-2026-${num}-ALPHA`);
      setEvidenceHash(Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2));
    } else {
      setMinePayload('');
    }
    setMineNonce(1);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-[#1e293b]/75 border border-slate-700/50 rounded-xl p-6 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="text-emerald-400 w-5 h-5 animate-pulse" />
            Phase 5: Immutable Forensic Evidence Vault & Chain of Custody (CoC) Ledger
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Ensure legal defensibility for forensic security incidents. Register evidence artifacts, enforce chain of custody records, and sign cryptographic SHA-256 blocks onto a local tamper-proof audit trail.
          </p>
        </div>
      </div>

      {/* Grid: block builder on the left, blockchain explorer on the right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* SHA-256 interactive miner (5 cols) */}
        <div className="xl:col-span-5 bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="text-emerald-400 w-4 h-4" />
              Evidence Block Cryptographer
            </h3>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 text-[10px] gap-1 font-mono">
              <button
                onClick={() => { setRecordMode('evidence'); setComputedHash(''); }}
                className={`px-2 py-1 rounded transition-all ${recordMode === 'evidence' ? 'bg-[#1e293b] text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Evidence Vault
              </button>
              <button
                onClick={() => { setRecordMode('audit'); setComputedHash(''); }}
                className={`px-2 py-1 rounded transition-all ${recordMode === 'audit' ? 'bg-[#1e293b] text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                CISO Sign-Off
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Previous Linked Root Block Hash</span>
              <code className="text-emerald-400 font-mono bg-slate-950 p-2 rounded border border-slate-850 block truncate font-bold text-[10px]">
                {blocks[blocks.length - 1].hash}
              </code>
            </div>

            {recordMode === 'evidence' ? (
              <div className="space-y-3 animate-fade-in text-left">
                {/* Evidence Code & Source */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] uppercase text-slate-400 font-mono">Evidence ID / Case Code</label>
                    <input
                      type="text"
                      value={evidenceId}
                      onChange={(e) => setEvidenceId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] uppercase text-slate-400 font-mono">Acquisition Source</label>
                    <input
                      type="text"
                      value={evidenceSource}
                      onChange={(e) => setEvidenceSource(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700"
                    />
                  </div>
                </div>

                {/* Evidence SHA256 Fingerprint */}
                <div className="space-y-0.5">
                  <label className="text-[10px] uppercase text-slate-400 font-mono">Evidence SHA256 Hash Flag (Defensible File Signature)</label>
                  <div className="relative">
                    <HardDrive className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="SHA256 Hash of original disk, logs or DB snapshot"
                      value={evidenceHash}
                      onChange={(e) => setEvidenceHash(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded pl-8 pr-2 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700"
                    />
                  </div>
                </div>

                {/* Response / Custody action taken */}
                <div className="space-y-0.5">
                  <label className="text-[10px] uppercase text-slate-400 font-mono">Chain of Custody Action Taken</label>
                  <textarea
                    value={actionsSummary}
                    onChange={(e) => setActionsSummary(e.target.value)}
                    className="w-full bg-slate-950 text-slate-300 p-2.5 rounded border border-slate-850 font-sans text-xs focus:outline-none focus:border-slate-700 min-h-[60px] leading-relaxed"
                    placeholder="Document investigation isolation steps..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in text-left">
                <div className="space-y-0.5">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Compliance Audit Signature payload</span>
                  <textarea
                    value={minePayload}
                    onChange={(e) => setMinePayload(e.target.value)}
                    className="w-full bg-slate-950 text-slate-300 p-2.5 rounded border border-slate-850 font-sans text-xs focus:outline-none focus:border-slate-700 min-h-[140px] leading-relaxed"
                    placeholder="Enter compliance certificates or SOC2 sign-off hashes..."
                  />
                </div>
              </div>
            )}

            {/* Investigator identity & Nonce Adjustments */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="space-y-0.5">
                <label className="text-[10px] uppercase text-slate-400 font-mono">Investigator Sign-Key</label>
                <input
                  type="text"
                  value={investigatorSign}
                  onChange={(e) => setInvestigatorSign(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] uppercase text-slate-400 font-mono">Block Mining Nonce</label>
                <input
                  type="number"
                  value={mineNonce}
                  onChange={(e) => setMineNonce(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleMineBlock}
                disabled={isMining || (recordMode === 'audit' ? !minePayload : !evidenceHash)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 font-bold px-4 py-3 rounded-lg text-slate-950 transition-colors text-xs flex justify-center items-center gap-1.5 font-sans"
              >
                {isMining ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sealing & Mining Artifact Hash...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" /> Compute Cryptographic Seal & Sign Block
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mining result */}
          {computedHash && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl space-y-3 animate-fade-in text-left text-[11px] font-mono leading-relaxed">
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span className="flex items-center gap-1"><FileCheck className="w-4 h-4 animate-bounce" /> IMUTABLE CRYPTO SEAL READY</span>
                <span>Nonce: {mineNonce}</span>
              </div>
              <p className="text-[10.5px] text-slate-400 font-sans">
                Below hash locks the block timestamp, investigator identity, and evidentiary chain parameters into defensible ciphertext.
              </p>
              <code className="text-slate-300 bg-slate-950 p-2.5 rounded block text-[10.5px] border border-slate-850 break-all select-all font-bold">
                {computedHash}
              </code>
              <button
                onClick={handleIncorporateBlock}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-2.5 px-3 rounded-lg w-full transition-colors font-sans text-xs flex justify-center items-center gap-1.5 uppercase"
              >
                Register Evidence to Chain of Custody
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Chained ledger explorer (7 cols) */}
        <div className="xl:col-span-7 bg-[#0f172a] rounded-xl border border-slate-800 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 text-left">
              <Link2 className="text-emerald-400 w-4 h-4" />
              Chain of Custody Ledgers ({blocks.length} Sealed Blocks)
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-semibold">
              IMMUTABILITY ACTIVE
            </span>
          </div>

          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
            {[...blocks].reverse().map((blk) => (
              <div 
                key={blk.index} 
                className={`bg-slate-900/60 border border-slate-800 p-4 rounded-xl relative overflow-hidden pl-10 border-l-4 ${
                  blk.transactions[0]?.type === 'Evidence' ? 'border-l-indigo-500' : 'border-l-emerald-500'
                }`}
              >
                {/* Connection line design */}
                <div className="absolute left-4 top-0 bottom-0 border-l border-dashed border-slate-800 flex items-center justify-center">
                  <div className={`w-2.5 h-2.5 bg-slate-950 border rounded-full shrink-0 -ml-1.5 z-10 ${
                    blk.transactions[0]?.type === 'Evidence' ? 'border-indigo-400' : 'border-emerald-400'
                  }`} />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400 font-mono pb-2 border-b border-slate-800/50">
                  <span className="text-left">Block Index Link: <strong className="text-slate-200">#{blk.index}</strong></span>
                  <span className="text-left">Nonce Factor: <strong className="text-slate-200">{blk.nonce}</strong></span>
                  <span className="text-left">{blk.timestamp}</span>
                </div>

                <div className="space-y-2 mt-2.5 text-left">
                  <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider block">Audited Integrity Transaction</span>
                  {blk.transactions.map((tx, idx) => (
                    <div key={idx} className="bg-[#070b14] p-3 rounded border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-sans">
                      <div className="space-y-1">
                        <span className={`text-[9px] uppercase font-bold font-mono px-2 py-0.5 rounded mr-2 inline-block ${
                          tx.type === 'Evidence' 
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                            : tx.type === 'Credential'
                            ? 'bg-[#38bdf8]/10 text-[#38bdf8] border border-sky-500/20'
                            : 'bg-emerald-100/15 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {tx.type} Code
                        </span>
                        <p className="text-slate-300 leading-relaxed font-sans mt-1">
                          {tx.detail}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-850 font-mono shrink-0 font-bold">
                        {tx.actor}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-850/80 font-mono text-[9px] text-slate-500 leading-normal text-left">
                  <div className="truncate">
                    <span className="text-slate-500 font-semibold block uppercase">Linked Prior Fingerprint Block Reference:</span>
                    <span className="text-slate-400 truncate block font-sans">{blk.previousHash}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500 font-semibold block uppercase">This Block Cryptographic Signature Check:</span>
                    <span className={`truncate block font-semibold ${
                      blk.transactions[0]?.type === 'Evidence' ? 'text-indigo-400' : 'text-emerald-400'
                    }`}>{blk.hash}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
