import React, { useState } from 'react';
import { Bot, Sparkles, Brain, Shield, TrendingUp } from 'lucide-react';
import HelpButton from '../../common/HelpButton';
import KoraChatbot from '../../chatbot/KoraChatbot';

const FEATURES = [
  { icon: <Sparkles className="w-5 h-5" />, emoji: '✨', label: 'Generate Content',      desc: 'Posts, flyers, ads, emails',              color: 'emerald', prompt: 'Help me create marketing content for my business' },
  { icon: <Brain className="w-5 h-5" />,    emoji: '🧠', label: 'Customer Predictions',  desc: 'Who will come back, who might leave',     color: 'cyan',    prompt: 'Analyze my customer patterns and predict who might churn' },
  { icon: <Shield className="w-5 h-5" />,   emoji: '🛡️', label: 'Security Monitor',      desc: 'Fraud detection and alerts',              color: 'red',     prompt: 'Check my business for any suspicious activity or fraud risks' },
  { icon: <TrendingUp className="w-5 h-5" />,emoji: '📈', label: 'Business Forecasts',   desc: 'Revenue and demand predictions',          color: 'amber',   prompt: 'Give me a revenue forecast and demand prediction for my business' },
];

export default function AssistantModule() {
  const [chatOpen, setChatOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');

  function openWithPrompt(prompt: string) {
    setInitialPrompt(prompt);
    setChatOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            Your AI Personal Assistant
          </h1>
          <p className="text-slate-400 text-sm mt-1">Let AI help you run your business smarter</p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton module="assistant" variant="inline" size="md" />
          <button
            onClick={() => openWithPrompt('How can you help me run my business better?')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
          >
            <Bot className="w-4 h-4" />
            Ask AI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {FEATURES.map((item, i) => (
          <button
            key={i}
            onClick={() => openWithPrompt(item.prompt)}
            className="flex items-center gap-4 p-5 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-2xl text-left transition-all group"
          >
            <div className="flex items-center gap-2">
              <div className={`p-3 rounded-xl text-${item.color}-400 bg-${item.color}-500/10`}>{item.icon}</div>
              <span className="text-2xl">{item.emoji}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{item.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">🤖</div>
          <div>
            <h3 className="text-white font-semibold">AI is Ready to Help</h3>
            <p className="text-slate-400 text-sm mt-1">Click any feature above or ask anything about your business</p>
          </div>
        </div>
        <button
          onClick={() => openWithPrompt('What insights do you have about my business today?')}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition"
        >
          <Bot className="w-4 h-4" />
          Open AI Assistant
        </button>
      </div>

      {chatOpen && <KoraChatbot tenantName="My Business" tenantId="dashboard" initialPrompt={initialPrompt} onClose={() => setChatOpen(false)} />}
    </div>
  );
}
