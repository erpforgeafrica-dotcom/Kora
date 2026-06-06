import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; text: string; time: string; }

interface Props { tenantId: string; tenantName: string; initialPrompt?: string; onClose?: () => void; }

// ── Mock FAQ responses (before real AI call) ─────────────────
function getMockResponse(msg: string, bizName: string): string {
  const q = msg.toLowerCase();
  if (q.includes('hour') || q.includes('open') || q.includes('time'))
    return `${bizName} is open Monday–Saturday, 9am–7pm, and Sundays 10am–5pm.`;
  if (q.includes('price') || q.includes('cost') || q.includes('how much'))
    return `Prices at ${bizName} start from ₦3,500. Check our services tab for full pricing.`;
  if (q.includes('book') || q.includes('appointment') || q.includes('slot'))
    return `Available slots today: 11:00am, 2:00pm, 4:30pm. Tap "Book Now" on any service to confirm.`;
  if (q.includes('location') || q.includes('address') || q.includes('where'))
    return `We're located at Victoria Island, Lagos. Use Google Maps → search "${bizName}".`;
  if (q.includes('cancel') || q.includes('reschedule'))
    return `You can cancel or reschedule up to 2 hours before your appointment from "My Bookings".`;
  if (q.includes('pay') || q.includes('payment') || q.includes('card'))
    return `We accept card, bank transfer, and Kora Wallet. Pay securely at checkout.`;
  return `Thanks for asking! I'll get the team at ${bizName} to follow up. Is there anything else I can help with?`;
}

export default function KoraChatbot({ tenantId, tenantName, initialPrompt, onClose }: Props) {
  const [open, setOpen] = useState(!!initialPrompt); // auto-open if prompt given
  const [input,    setInput]    = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: `Hi! 👋 I'm ${tenantName}'s AI assistant. Ask me anything — hours, pricing, bookings, or availability.`, time: now() },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Send initial prompt automatically if provided
  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', text, time: now() };
    setMessages(m => [...m, userMsg]);
    setLoading(true);

    // Attempt real Gemini call; fall back to mock
    let reply = '';
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY ?? (import.meta as any).env?.GEMINI_API_KEY;
      if (apiKey) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are the helpful AI assistant for "${tenantName}" (business ID: ${tenantId}).
Answer ONLY questions about this business. Be concise and friendly. Never discuss other businesses.
Customer asks: ${text}`,
                }],
              }],
            }),
          }
        );
        const json = await res.json();
        reply = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      }
    } catch (_) { /* fall through */ }

    if (!reply) reply = getMockResponse(text, tenantName);

    setMessages(m => [...m, { role: 'assistant', text: reply, time: now() }]);
    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      <button
      onClick={() => { setOpen(o => !o); if (open && onClose) onClose(); }}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl shadow-emerald-900/40 transition-all duration-300 ${
          open
            ? 'bg-slate-800 border border-slate-600 text-slate-300'
            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:scale-105'
        }`}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        <span className="text-sm font-bold">{open ? 'Close' : `Ask ${tenantName.split(' ')[0]}`}</span>
        {!open && <div className="w-2 h-2 bg-white rounded-full animate-ping absolute -top-0.5 -right-0.5" />}
      </button>

      {/* Chat widget */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[340px] max-h-[520px] flex flex-col bg-[#06091a]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden animate-fade-in">

          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/8 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">{tenantName} AI</div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Online now
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-slate-950 rounded-br-sm'
                    : 'bg-white/8 border border-white/8 text-slate-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                  <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-emerald-900/70' : 'text-slate-500'}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/8 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick reply chips */}
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
            {['Opening hours', 'Book a slot', 'Prices'].map(chip => (
              <button key={chip} onClick={() => { setInput(chip); }}
                className="text-[11px] whitespace-nowrap px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white hover:border-white/20 transition shrink-0">
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-3 border-t border-white/8">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask anything..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            <button
              onClick={send} disabled={!input.trim() || loading}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
