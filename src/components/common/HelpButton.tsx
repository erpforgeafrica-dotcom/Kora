import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, BookOpen } from 'lucide-react';

interface HelpContent {
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
}

const HELP_CONTENT: Record<string, HelpContent> = {
  home: {
    title: 'Your Dashboard',
    description: 'This is your main screen. You see everything important happening today in your business.',
    steps: [
      'Look at the numbers at the top to see how you\'re doing',
      'Use the quick action buttons to do common tasks',
      'Check alerts and messages in the feed below',
    ],
    tips: [
      'Numbers update automatically as things happen',
      'Click any card to go directly to that section',
      'Change your theme using the colour dots in the header',
    ],
  },
  bookings: {
    title: 'Appointments & Bookings',
    description: 'Schedule customer visits, assign staff, and track what services they need.',
    steps: [
      'Click "Add New" to create a booking or service',
      'Choose the date, time, and service type',
      'Assign a staff member to handle it',
      'Save — reminders go out automatically',
    ],
    tips: [
      'The system prevents double-booking automatically',
      'Customers get automatic reminder messages',
      'Filter by date, staff, or service type',
    ],
  },
  money: {
    title: 'Money & Payments',
    description: 'Track every naira coming in from customers and going out as expenses.',
    steps: [
      'Click "Add Transaction" to record a payment',
      'Choose Income or Expense',
      'Enter amount, description and payment method',
      'Your live balance updates instantly',
    ],
    tips: [
      '95% of revenue goes to you — 5% is the platform fee',
      'Export transactions for your accountant',
      'Filter by date range to see weekly or monthly totals',
    ],
  },
  team: {
    title: 'Your Team',
    description: 'Add staff, set their roles, track attendance, and manage pay.',
    steps: [
      'Click "Add Team Member" to add someone',
      'Fill in their name, role, and contact details',
      'Upload their ID for verification',
      'They receive an invite to join your workspace',
    ],
    tips: [
      'Staff can clock in using biometric or PIN',
      'See who is working right now in real-time',
      'Commission splits happen automatically per booking',
    ],
  },
  customers: {
    title: 'Your Customers',
    description: 'All your customer contacts, history, notes, and loyalty in one place.',
    steps: [
      'Customers are added automatically when they book',
      'Or add manually using "Add Customer"',
      'Click any customer to see their full visit history',
      'Add preferences like allergies or special notes',
    ],
    tips: [
      'Loyalty stamps are tracked automatically',
      'Send discount codes to customers who haven\'t visited in 30 days',
      'Export your list for bulk messaging',
    ],
  },
  stock: {
    title: 'Supplies & Inventory',
    description: 'Track what you have in stock and get alerts when running low.',
    steps: [
      'Click "Add Item" to add a product or supply',
      'Set stock quantity and low-stock alert level',
      'Record new deliveries when stock arrives',
      'System alerts you automatically when to reorder',
    ],
    tips: [
      'Purchase orders can be auto-created when stock is low',
      'Track expiry dates for perishable items',
      'See which products generate the most revenue',
    ],
  },
  reports: {
    title: 'Reports & Progress',
    description: 'Charts and numbers that show exactly how your business is growing.',
    steps: [
      'Choose what you want to see — money, bookings, or customers',
      'Pick a time period: today, week, month, or year',
      'Read the charts and trend lines',
      'Download PDF reports to share or file',
    ],
    tips: [
      'Compare this month to last month to spot growth',
      'Find which services are most popular',
      'Identify your busiest days and peak hours',
    ],
  },
  rules: {
    title: 'Settings & Standards',
    description: 'Control how your business works — profile, notifications, security, and billing.',
    steps: [
      'Update your Business Profile with name and location',
      'Set notification preferences for bookings and payments',
      'Review Privacy & Security settings',
      'Manage your subscription and billing under Payments & Plan',
    ],
    tips: [
      'Keep your profile complete so customers can find you',
      'Enable 2FA for extra account security',
      'Upgrade your plan to unlock more features',
    ],
  },
  assistant: {
    title: 'Your AI Assistant',
    description: 'Let AI help you run your business smarter — content, forecasts, predictions, and insights.',
    steps: [
      'Click any feature card to open a focused AI conversation',
      'Or click "Open AI Assistant" to chat freely',
      'Ask anything in plain English',
      'Get actionable answers in seconds',
    ],
    tips: [
      'The AI learns your business patterns over time',
      'You are always in control — suggestions are optional',
      'Ask for help anytime, like having a business mentor 24/7',
    ],
  },
};

interface Props {
  module: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'floating' | 'inline';
}

export default function HelpButton({ module, size = 'md', variant = 'inline' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const content = HELP_CONTENT[module] || HELP_CONTENT.home;

  // Open: mount then animate in
  function open() {
    setIsOpen(true);
    requestAnimationFrame(() => setVisible(true));
  }

  // Close: animate out then unmount
  function close() {
    setVisible(false);
    setTimeout(() => setIsOpen(false), 220);
  }

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const iconSize = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }[size];

  return (
    <div className="relative inline-block">
      <button
        onClick={open}
        title="Help"
        aria-label="Open help"
        className="inline-flex items-center justify-center p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
      >
        <HelpCircle className={iconSize} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.22s ease',
            }}
            onClick={close}
          />

          {/* Panel */}
          <div
            ref={panelRef}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pointer-events-none"
          >
            <div
              className="w-full max-w-lg pointer-events-auto"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.97)',
                transition: 'opacity 0.22s cubic-bezier(0.16,1,0.3,1), transform 0.22s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <div className="bg-[#0b142d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-base">{content.title}</div>
                      <div className="text-xs text-white/40">Quick help guide</div>
                    </div>
                  </div>
                  <button
                    onClick={close}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body — full visible, no scroll cutoff */}
                <div className="p-5 space-y-5">

                  {/* Description */}
                  <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> What is this?
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{content.description}</p>
                  </div>

                  {/* Steps */}
                  {content.steps && (
                    <div>
                      <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">📋 How to use it</div>
                      <ol className="space-y-2.5">
                        {content.steps.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm text-white/75">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </span>
                            <span className="pt-0.5 leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Tips */}
                  {content.tips && (
                    <div>
                      <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">💡 Helpful tips</div>
                      <ul className="space-y-2">
                        {content.tips.map((tip, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-white/70">
                            <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Support */}
                  <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-xl px-4 py-3 space-y-2">
                    <div className="text-xs font-bold text-emerald-400">Still need help?</div>
                    <div className="space-y-1 text-xs text-white/60">
                      <p>• Chat with support — usually replies in 2 minutes</p>
                      <p>• Call <span className="text-emerald-400 font-semibold">+234-800-KORA-HELP</span></p>
                      <p>• Email <span className="text-emerald-400 font-semibold">help@kora.africa</span></p>
                    </div>
                    <button
                      onClick={close}
                      className="mt-1 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition"
                    >
                      Chat with Support Now
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Tooltip export preserved
interface TooltipProps { text: string; children: React.ReactNode; }
export function HelpTooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)} className="cursor-help">
        {children}
      </div>
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          style={{ animation: 'slideDown 0.15s cubic-bezier(0.16,1,0.3,1) both' }}>
          <div className="bg-[#0b142d] border border-white/10 rounded-lg px-3 py-2 shadow-xl max-w-xs">
            <p className="text-xs text-white/80 leading-relaxed whitespace-nowrap">{text}</p>
          </div>
        </div>
      )}
    </div>
  );
}
