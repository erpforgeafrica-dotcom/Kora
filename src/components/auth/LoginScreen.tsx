import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props { onSuccess: () => void; onRegisterClick: () => void; }

export default function LoginScreen({ onSuccess, onRegisterClick }: Props) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    const { error: authErr } = await (supabase as any).auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authErr) { setError('Wrong email or password. Please try again.'); return; }
    onSuccess();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030610] via-[#070d1f] to-[#030610] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-black tracking-widest text-sm font-mono uppercase">KORA</span>
          </div>
          <p className="text-slate-400 text-xs mt-2">Welcome back</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/40 space-y-5">
          <h2 className="text-white text-xl font-bold">Sign in to your account</h2>

          <input
            type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
          />
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
            />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-4 top-3.5 text-slate-400 hover:text-white transition">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && <p className="text-red-400 text-xs bg-red-400/10 rounded-xl px-4 py-2">{error}</p>}

          <button
            onClick={handleLogin} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-5">
          New to Kora?{' '}
          <button onClick={onRegisterClick} className="text-emerald-400 hover:text-emerald-300 transition">Create a free account</button>
        </p>
      </div>
    </div>
  );
}
