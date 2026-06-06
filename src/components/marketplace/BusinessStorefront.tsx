import React, { useState } from 'react';
import {
  MapPin, Star, Phone, Globe, Instagram, CheckCircle2,
  ChevronLeft, Clock, Calendar, ShoppingBag, MessageCircle
} from 'lucide-react';
import KoraChatbot from '../chatbot/KoraChatbot';

// Mock storefront data — in production, fetched by slug from Supabase
const MOCK_STOREFRONTS: Record<string, {
  id: string; name: string; tagline: string; description: string;
  emoji: string; rating: number; reviews: number; location: string;
  phone: string; website: string; instagram: string; verified: boolean;
  services: { name: string; price: string; duration: string; emoji: string }[];
  products: { name: string; price: string; emoji: string }[];
}> = {
  'glow-salon': {
    id: 'glow-salon', name: 'Glow Salon Lagos', emoji: '💅',
    tagline: 'Lagos\'s #1 luxury hair & beauty destination.',
    description: 'We believe everyone deserves to look and feel their absolute best. Our team of certified stylists brings 10+ years of expertise to every appointment. Walk in as you are, leave as who you want to be.',
    rating: 4.9, reviews: 842, location: 'Victoria Island, Lagos', verified: true,
    phone: '+234 800 123 4567', website: 'glowsalon.ng', instagram: '@glow_salon_lagos',
    services: [
      { name: 'Classic Haircut', price: '₦3,500', duration: '45 min', emoji: '✂️' },
      { name: 'Full Colour Treatment', price: '₦25,000', duration: '3 hr', emoji: '🎨' },
      { name: 'Luxury Facial', price: '₦12,000', duration: '90 min', emoji: '✨' },
      { name: 'Gel Nails', price: '₦8,000', duration: '60 min', emoji: '💅' },
    ],
    products: [
      { name: 'Argan Oil Serum', price: '₦4,500', emoji: '🧴' },
      { name: 'Moisture Mask', price: '₦3,200', emoji: '🫧' },
      { name: 'Silk Hair Spray', price: '₦2,800', emoji: '💨' },
    ],
  },
  'dr-emeka': {
    id: 'dr-emeka', name: 'Dr Emeka\'s Clinic', emoji: '🏥',
    tagline: 'Quality healthcare you can trust.',
    description: 'A modern private clinic offering general consultations, telemedicine, and specialist referrals. MDCN-certified. We prioritise your health above everything.',
    rating: 4.8, reviews: 521, location: 'Lekki Phase 1, Lagos', verified: true,
    phone: '+234 800 456 7890', website: 'dremeka.ng', instagram: '@dr_emeka_clinic',
    services: [
      { name: 'General Consultation', price: '₦8,000', duration: '30 min', emoji: '🩺' },
      { name: 'Video Consultation', price: '₦5,000', duration: '20 min', emoji: '📹' },
      { name: 'Annual Health Check', price: '₦45,000', duration: '2 hr', emoji: '🔬' },
    ],
    products: [
      { name: 'Wellness Pack', price: '₦12,000', emoji: '💊' },
    ],
  },
};

interface Props { slug: string; onBack?: () => void; }

export default function BusinessStorefront({ slug, onBack }: Props) {
  const biz = MOCK_STOREFRONTS[slug] ?? MOCK_STOREFRONTS['glow-salon'];
  const [tab, setTab] = useState<'services' | 'products' | 'about'>('services');

  return (
    <div className="min-h-screen bg-[#030610] text-white relative">

      {/* ── Hero ── */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-[#030610] flex items-center justify-center text-[8rem]">
          {biz.emoji}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#030610] via-transparent to-transparent" />
        {onBack && (
          <button onClick={onBack}
            className="absolute top-5 left-5 flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl text-sm text-slate-300 hover:text-white transition">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
      </div>

      {/* ── Business info ── */}
      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-10 space-y-6 pb-24">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white">{biz.name}</h1>
                {biz.verified && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
              </div>
              <p className="text-slate-400 text-sm">{biz.tagline}</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition shrink-0">
              <Calendar className="w-4 h-4" /> Book Now
            </button>
          </div>

          {/* Ratings + meta */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-bold text-white">{biz.rating}</span>
              <span className="text-slate-500">({biz.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-4 h-4" />{biz.location}
            </div>
          </div>

          {/* Contact row */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-white/5">
            <a href={`tel:${biz.phone}`} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 hover:text-white hover:border-white/20 transition">
              <Phone className="w-3.5 h-3.5" /> {biz.phone}
            </a>
            <a className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 hover:text-white hover:border-white/20 transition">
              <Globe className="w-3.5 h-3.5" /> {biz.website}
            </a>
            <a className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 hover:text-white hover:border-white/20 transition">
              <Instagram className="w-3.5 h-3.5" /> {biz.instagram}
            </a>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300 hover:bg-cyan-500/20 transition">
              <MessageCircle className="w-3.5 h-3.5" /> Chat with us
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
          {(['services', 'products', 'about'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition ${tab === t ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
              {t === 'services' ? '📋 Services' : t === 'products' ? '🛍️ Products' : 'ℹ️ About'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'services' && (
          <div className="space-y-3">
            {biz.services.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition group">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.emoji}</span>
                  <div>
                    <div className="text-white font-semibold text-sm">{s.name}</div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                      <Clock className="w-3 h-3" />{s.duration}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold text-sm">{s.price}</span>
                  <button className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition">
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'products' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {biz.products.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-white font-semibold text-sm">{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-sm">{p.price}</span>
                  <button className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/20 transition">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'about' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <h3 className="text-white font-semibold">Our Story</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{biz.description}</p>
          </div>
        )}
      </div>

      {/* Chatbot — locked to this business's tenant */}
      <KoraChatbot tenantName={biz.name} tenantId={biz.id} />
    </div>
  );
}
