import React, { useState } from 'react';
import {
  User, Building2, MapPin, ShieldCheck, Sparkles,
  ChevronRight, ChevronLeft, Eye, EyeOff, Camera,
  Fingerprint, Upload, CheckCircle2, Loader2, Globe,
  Briefcase, Heart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props { onSuccess: () => void; onLoginClick: () => void; }

const INDUSTRIES = [
  { id: 'BEAUTY',      label: 'Beauty & Wellness',   emoji: '💅' },
  { id: 'HEALTHCARE',  label: 'Healthcare',           emoji: '🏥' },
  { id: 'FITNESS',     label: 'Fitness & Sports',     emoji: '🏋️' },
  { id: 'EDUCATION',   label: 'Education',            emoji: '🎓' },
  { id: 'RETAIL',      label: 'Retail & Commerce',    emoji: '🛍️' },
  { id: 'LOGISTICS',   label: 'Logistics & Transport',emoji: '🚚' },
  { id: 'FINANCE',     label: 'Finance & Fintech',    emoji: '💰' },
  { id: 'HOSPITALITY', label: 'Hospitality',          emoji: '🏨' },
  { id: 'TECHNOLOGY',  label: 'Technology',           emoji: '💻' },
  { id: 'OTHER',       label: 'Something Else',       emoji: '✨' },
];

const STEP_LABELS = ['Who are you?', 'Your Business', 'Location', 'Verify You', 'You\'re in!'];

export default function RegisterWizard({ onSuccess, onLoginClick }: Props) {
  const [step,      setStep]    = useState(0);
  const [loading,   setLoading] = useState(false);
  const [showPw,    setShowPw]  = useState(false);
  const [faceAnim,  setFaceAnim] = useState(false);
  const [error,     setError]   = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
    accountType: '' as 'BUSINESS_OWNER' | 'CONSUMER' | '',
    businessName: '', tenantCode: '', industry: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    region: 'NG', city: '', address: '',
    biometricConsent: false, termsAccepted: false,
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    if (!form.termsAccepted) { setError('Please accept the terms to continue.'); return; }
    setLoading(true); setError('');
    try {
      // 1. Auth signup
      const { data: authData, error: authErr } = await (supabase as any).auth.signUp({
        email: form.email, password: form.password,
      });
      if (authErr || !authData.user) throw new Error(authErr?.message ?? 'Signup failed');
      const userId = authData.user.id;

      if (form.accountType === 'BUSINESS_OWNER') {
        // 2. Create tenant
        const { data: tenant, error: tErr } = await (supabase as any).from('tenants').insert({
          name: form.businessName, tenant_code: form.tenantCode.toLowerCase().replace(/\s/g, '-'),
          industry: form.industry, region: form.region, tier: 'BASIC',
          status: 'ACTIVE', base_currency: 'USD', metadata: {}, settings: {},
        }).select().single();
        if (tErr || !tenant) throw new Error(tErr?.message ?? 'Business setup failed');

        // 3. Entity graph
        await (supabase as any).from('entity_graph').insert({
          auth_user_id: userId, tenant_id: tenant.id, entity_type: 'BUSINESS_OWNER',
          role: 'OWNER', first_name: form.firstName, last_name: form.lastName,
          email: form.email, phone: form.phone, timezone: form.timezone, metadata: {},
        });

        // 4. Event
        await (supabase as any).from('event_stream').insert({
          tenant_id: tenant.id, event_type: 'tenant.registered',
          payload: { industry: form.industry, tier: 'BASIC' }, occurred_at: new Date().toISOString(),
        });
      } else {
        // Consumer — create a system tenant or use a public tenant_id
        // For now, insert entity_graph with a placeholder; real flow resolves via marketplace tenant
        await (supabase as any).from('entity_graph').insert({
          auth_user_id: userId, tenant_id: '00000000-0000-0000-0000-000000000001',
          entity_type: 'CONSUMER', role: 'CONSUMER',
          first_name: form.firstName, last_name: form.lastName,
          email: form.email, phone: form.phone, timezone: form.timezone, metadata: {},
        });
      }

      setStep(4);
      setTimeout(onSuccess, 1800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const canNext = [
    form.accountType !== '',
    form.accountType === 'CONSUMER' || (form.businessName.length > 1 && form.industry !== ''),
    form.city.length > 1,
    form.firstName.length > 0 && form.lastName.length > 0 && form.email.includes('@') && form.password.length >= 8,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030610] via-[#070d1f] to-[#030610] flex items-center justify-center p-4">
      {/* Glassmorphism card */}
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-black tracking-widest text-sm font-mono uppercase">KORA</span>
          </div>
          <p className="text-slate-400 text-xs mt-2">Your Global Business Operating System</p>
        </div>

        {/* Progress bar */}
        {step < 4 && (
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              {STEP_LABELS.slice(0, 4).map((label, i) => (
                <span key={i} className={`text-[10px] font-mono ${i <= step ? 'text-emerald-400' : 'text-slate-600'}`}>{label}</span>
              ))}
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${((step + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40">

          {/* ── STEP 0: Account Type ── */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-white text-xl font-bold">What brings you to Kora?</h2>
              <p className="text-slate-400 text-sm">Pick what describes you best — you can switch later.</p>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { type: 'BUSINESS_OWNER', icon: <Briefcase className="w-6 h-6" />, label: 'I run a business', sub: 'Salon, clinic, shop, freelance, or enterprise' },
                  { type: 'CONSUMER',       icon: <Heart className="w-6 h-6" />,     label: 'I\'m a customer',   sub: 'Book services, shop, and manage my life' },
                ] .map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => set('accountType', opt.type)}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                      form.accountType === opt.type
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-white/10 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${form.accountType === opt.type ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'}`}>
                      {opt.icon}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.sub}</div>
                    </div>
                    {form.accountType === opt.type && <CheckCircle2 className="w-5 h-5 text-emerald-400 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: Business Setup (skip for consumer) ── */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              {form.accountType === 'CONSUMER' ? (
                <>
                  <h2 className="text-white text-xl font-bold">What are you into?</h2>
                  <p className="text-slate-400 text-sm">We'll personalise your experience.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {INDUSTRIES.slice(0, 6).map(ind => (
                      <button
                        key={ind.id}
                        onClick={() => set('industry', ind.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          form.industry === ind.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-2xl mb-1">{ind.emoji}</div>
                        <div className="text-xs text-slate-300 font-medium">{ind.label}</div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-white text-xl font-bold">Tell us about your business</h2>
                  <input
                    placeholder="Business name (e.g. Glow Salon Lagos)"
                    value={form.businessName}
                    onChange={e => set('businessName', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                  <input
                    placeholder="Short URL name (e.g. glow-salon)"
                    value={form.tenantCode}
                    onChange={e => set('tenantCode', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                  <p className="text-slate-500 text-xs">Pick your industry:</p>
                  <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {INDUSTRIES.map(ind => (
                      <button
                        key={ind.id}
                        onClick={() => set('industry', ind.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs transition-all ${
                          form.industry === ind.id ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-white/10 hover:border-white/20 text-slate-400'
                        }`}
                      >
                        <span className="text-base">{ind.emoji}</span>
                        <span>{ind.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP 2: Location ── */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <MapPin className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold">Where are you based?</h2>
                  <p className="text-slate-400 text-xs">This helps us localise currency and compliance.</p>
                </div>
              </div>
              <select
                value={form.region}
                onChange={e => set('region', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="NG">🇳🇬 Nigeria</option>
                <option value="GH">🇬🇭 Ghana</option>
                <option value="KE">🇰🇪 Kenya</option>
                <option value="ZA">🇿🇦 South Africa</option>
                <option value="UK">🇬🇧 United Kingdom</option>
                <option value="US">🇺🇸 United States</option>
                <option value="EU">🇪🇺 Europe</option>
                <option value="AE">🇦🇪 UAE</option>
              </select>
              <input
                placeholder="Your city"
                value={form.city}
                onChange={e => set('city', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
              <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-400 text-xs">Detected timezone: <strong className="text-slate-200">{form.timezone}</strong></span>
              </div>
            </div>
          )}

          {/* ── STEP 3: Identity + Biometrics ── */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <ShieldCheck className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold">Create your account</h2>
                  <p className="text-slate-400 text-xs">Your data is encrypted end-to-end.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First name" value={form.firstName} onChange={e => set('firstName', e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition" />
                <input placeholder="Last name" value={form.lastName} onChange={e => set('lastName', e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition" />
              </div>
              <input placeholder="Phone number" value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition" />
              <input placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition" />
              <div className="relative">
                <input placeholder="Password (8+ characters)" value={form.password} onChange={e => set('password', e.target.value)}
                  type={showPw ? 'text' : 'password'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition" />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-3.5 text-slate-400 hover:text-white transition">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Biometric affordance section */}
              <div className="border border-white/10 rounded-2xl p-4 space-y-3 bg-white/3">
                <p className="text-slate-300 text-xs font-semibold">Optional: Set up face & fingerprint login</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Face scan affordance */}
                  <button
                    onClick={() => { setFaceAnim(true); setTimeout(() => setFaceAnim(false), 1500); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      faceAnim ? 'border-cyan-400 bg-cyan-400/10 scale-95' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`relative ${faceAnim ? 'animate-pulse' : ''}`}>
                      <Camera className="w-8 h-8 text-cyan-400" />
                      {faceAnim && <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping" />}
                    </div>
                    <span className="text-xs text-slate-400">Face ID</span>
                    <span className="text-[9px] text-slate-600">Look at camera</span>
                  </button>
                  {/* Fingerprint affordance */}
                  <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 hover:border-white/20 transition group">
                    <Fingerprint className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-slate-400">Fingerprint</span>
                    <span className="text-[9px] text-slate-600">Touch sensor</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-600">Biometrics are stored locally. Never uploaded to servers without your permission.</p>
              </div>

              {/* Consent */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => set('termsAccepted', !form.termsAccepted)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.termsAccepted ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-white/40'}`}
                >
                  {form.termsAccepted && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className="text-slate-400 text-xs">I agree to Kora's <span className="text-emerald-400 underline cursor-pointer">Terms of Service</span> and <span className="text-emerald-400 underline cursor-pointer">Privacy Policy</span></span>
              </label>

              {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-xl px-4 py-2">{error}</p>}
            </div>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 4 && (
            <div className="text-center space-y-5 py-4 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-white text-2xl font-bold">Welcome to Kora! 🎉</h2>
              <p className="text-slate-400 text-sm">Your account is ready. Taking you to your dashboard...</p>
              <div className="flex justify-center"><Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /></div>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 4 && (
            <div className={`flex mt-6 gap-3 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:border-white/20 transition">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < 3 ? (
                <button
                  disabled={!canNext[step]}
                  onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled={loading || !form.termsAccepted}
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {loading ? 'Creating account...' : 'Create my account'}
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-5">
          Already have an account?{' '}
          <button onClick={onLoginClick} className="text-emerald-400 hover:text-emerald-300 transition">Sign in</button>
        </p>
      </div>
    </div>
  );
}
