import React, { useState } from 'react';
import {
  Search, MapPin, Star, Clock, ChevronRight, Sparkles,
  TrendingUp, Heart, Zap, Filter, SlidersHorizontal
} from 'lucide-react';
import KoraChatbot from '../chatbot/KoraChatbot';

// ── Mock data ────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',        label: 'All',       emoji: '✨' },
  { id: 'beauty',     label: 'Beauty',    emoji: '💅' },
  { id: 'health',     label: 'Health',    emoji: '🏥' },
  { id: 'fitness',    label: 'Fitness',   emoji: '🏋️' },
  { id: 'education',  label: 'Education', emoji: '🎓' },
  { id: 'food',       label: 'Food',      emoji: '🍽️' },
  { id: 'logistics',  label: 'Transport', emoji: '🚗' },
];

const BUSINESSES = [
  { id: 'glow-salon', name: 'Glow Salon Lagos', category: 'beauty', rating: 4.9, reviews: 842, location: 'Victoria Island, Lagos', image: '💅', price: '₦3,500', duration: '45 min', tag: 'Most Booked', tagColor: 'emerald', verified: true },
  { id: 'dr-emeka', name: 'Dr Emeka\'s Clinic', category: 'health', rating: 4.8, reviews: 521, location: 'Lekki Phase 1, Lagos', image: '🏥', price: '₦8,000', duration: '30 min', tag: 'Top Rated', tagColor: 'cyan', verified: true },
  { id: 'fitzone', name: 'FitZone Gym', category: 'fitness', rating: 4.7, reviews: 310, location: 'Ikeja, Lagos', image: '🏋️', price: '₦15,000/mo', duration: 'Monthly', tag: 'Trending', tagColor: 'purple', verified: true },
  { id: 'blossom-spa', name: 'Blossom Spa', category: 'beauty', rating: 4.9, reviews: 1203, location: 'Ikoyi, Lagos', image: '🌸', price: '₦12,000', duration: '90 min', tag: 'Luxury Pick', tagColor: 'amber', verified: true },
  { id: 'brightminds', name: 'BrightMinds Tutors', category: 'education', rating: 4.6, reviews: 190, location: 'Surulere, Lagos', image: '🎓', price: '₦5,000/hr', duration: '60 min', tag: 'Highly Rated', tagColor: 'cyan', verified: false },
  { id: 'swift-rides', name: 'Swift Rides', category: 'logistics', rating: 4.5, reviews: 4821, location: 'All of Lagos', image: '🚗', price: '₦1,200', duration: 'On demand', tag: 'Near You', tagColor: 'emerald', verified: true },
];

const LANES = [
  { id: 'trending',    icon: <TrendingUp className="w-4 h-4" />, label: 'Trending Now' },
  { id: 'near_you',   icon: <MapPin className="w-4 h-4" />,      label: 'Near You' },
  { id: 'top_rated',  icon: <Star className="w-4 h-4" />,        label: 'Top Rated' },
  { id: 'for_you',    icon: <Sparkles className="w-4 h-4" />,    label: 'Recommended for You' },
];

const tagColorMap: Record<string, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  cyan:    'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  purple:  'bg-purple-500/15 text-purple-300 border-purple-500/20',
  amber:   'bg-amber-500/15 text-amber-300 border-amber-500/20',
};

interface Props { onViewBusiness?: (slug: string) => void; }

export default function KoraMarketplace({ onViewBusiness }: Props) {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('all');
  const [lane,     setLane]     = useState('trending');
  const [liked,    setLiked]    = useState<Set<string>>(new Set());

  const filtered = BUSINESSES.filter(b =>
    (category === 'all' || b.category === category) &&
    (search === '' || b.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#030610] text-white relative">

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        {/* Gradient background simulating cinematic hero */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#050d1e] to-[#030610]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.15),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.10),_transparent_60%)]" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 text-xs font-semibold">10,000+ verified businesses across Africa</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-tight max-w-3xl">
            Book anything.<br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Instantly.
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-lg">
            Discover top-rated salons, clinics, gyms, tutors, and more — all in one place.
          </p>
          <div className="flex flex-wrap gap-6 pt-2">
            {[
              { emoji: '🏢', value: '10,000+', label: 'Businesses' },
              { emoji: '🌍', value: '12', label: 'African Cities' },
              { emoji: '⭐', value: '4.8', label: 'Avg Rating' },
              { emoji: '📅', value: '500K+', label: 'Bookings Made' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black text-white">{s.emoji} {s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                placeholder="Search salons, doctors, gyms..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl pl-10 pr-4 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                placeholder="Lagos, Nigeria"
                className="w-full sm:w-44 bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl pl-10 pr-4 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <button className="flex items-center gap-2 px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-sm transition">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* ── Category chips ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                category === c.id
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              <span>{c.emoji}</span> {c.label}
            </button>
          ))}
          <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 transition-all ml-auto">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>
        </div>

        {/* ── AI Discovery Lanes ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {LANES.map(l => (
            <button
              key={l.id}
              onClick={() => setLane(l.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                lane === l.id
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {l.icon} {l.label}
            </button>
          ))}
        </div>

        {/* ── How It Works ── */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-white">How KORA Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', emoji: '🔍', title: 'Search', desc: 'Find any service near you — salons, clinics, gyms, tutors, restaurants and more.' },
              { step: '2', emoji: '📅', title: 'Book Instantly', desc: 'Pick a time that works for you and confirm in seconds. No calls, no waiting.' },
              { step: '3', emoji: '✅', title: 'Show Up & Enjoy', desc: 'Get reminders, directions, and rate your experience after.' },
            ].map(h => (
              <div key={h.step} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm">{h.step}</div>
                  <span className="text-2xl">{h.emoji}</span>
                </div>
                <div className="font-bold text-white">{h.title}</div>
                <div className="text-slate-400 text-sm leading-relaxed">{h.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Popular Cities ── */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Popular Cities</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {[
              { city: 'Lagos', emoji: '🌊', count: '4,200+' },
              { city: 'Abuja', emoji: '🏛️', count: '1,800+' },
              { city: 'Nairobi', emoji: '🦁', count: '2,100+' },
              { city: 'Accra', emoji: '🌍', count: '900+' },
              { city: 'Johannesburg', emoji: '💎', count: '3,100+' },
              { city: 'Cairo', emoji: '🏺', count: '1,500+' },
            ].map(c => (
              <button key={c.city} className="flex-shrink-0 flex flex-col items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 rounded-2xl px-6 py-4 transition group">
                <span className="text-3xl">{c.emoji}</span>
                <span className="text-white font-semibold text-sm group-hover:text-emerald-300 transition">{c.city}</span>
                <span className="text-slate-500 text-xs">{c.count} businesses</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Business cards grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(biz => (
            <div
              key={biz.id}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 hover:shadow-lg hover:shadow-black/30 transition-all cursor-pointer"
              onClick={() => onViewBusiness?.(biz.id)}
            >
              {/* Card hero */}
              <div className="relative h-36 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-6xl">
                {biz.image}
                {/* Like button */}
                <button
                  onClick={e => { e.stopPropagation(); setLiked(l => { const s = new Set(l); s.has(biz.id) ? s.delete(biz.id) : s.add(biz.id); return s; }); }}
                  className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 hover:border-white/30 transition"
                >
                  <Heart className={`w-3.5 h-3.5 transition ${liked.has(biz.id) ? 'fill-red-400 text-red-400' : 'text-slate-400'}`} />
                </button>
                {/* Tag */}
                <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold border ${tagColorMap[biz.tagColor]}`}>
                  {biz.tag}
                </div>
                {biz.verified && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="text-[9px] text-emerald-300 font-semibold">Verified</span>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-white font-semibold text-sm group-hover:text-emerald-300 transition">{biz.name}</h3>
                  <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                    <MapPin className="w-3 h-3" />{biz.location}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-white text-xs font-bold">{biz.rating}</span>
                    <span className="text-slate-500 text-xs">({biz.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <Clock className="w-3 h-3" />{biz.duration}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-emerald-400 font-bold text-sm">from {biz.price}</span>
                  <button className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition">
                    Book Now <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-slate-500 space-y-2">
              <div className="text-4xl">🔍</div>
              <p>No businesses found. Try a different search or category.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating chatbot */}
      <KoraChatbot tenantName="Kora" tenantId="marketplace" />
    </div>
  );
}
