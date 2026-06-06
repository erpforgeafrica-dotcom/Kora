import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  Search,
  Dumbbell,
  ShoppingBag,
  Truck,
  MapPin,
  Compass,
  Check,
  Plus,
  Trash,
  Play,
  User,
  Star,
  Package,
  CalendarCheck2,
  Siren,
  Hospital,
  AlertOctagon,
  Activity,
  Flame,
  ShieldAlert
} from 'lucide-react';

// Product/Services templates
const servicesCatalog = [
  // Health
  { id: 'h1', name: 'Smart Telemedicine Consultation', category: 'Health', provider: 'Dr. Ada Okpara, MD', price: 75, rating: 4.9, recurring: false, duration: '30 min' },
  { id: 'h2', name: 'Comprehensive Blood Biochemistry Panel', category: 'Health', provider: 'Synlab Health Group', price: 120, rating: 4.8, recurring: false, duration: 'Home Collection' },
  { id: 'h3', name: 'Digital Post-Op Recovery Management Program', category: 'Health', provider: 'Hale Cardiology Clinique', price: 45, rating: 5.0, recurring: true, duration: 'Monthly Membership' },
  
  // Beauty
  { id: 'b1', name: 'Laser Acne & Pigmentation Defense Scan', category: 'Beauty', provider: 'Glow MedSpa London', price: 110, rating: 4.7, recurring: false, duration: '45 min' },
  { id: 'b2', name: 'Youth-Restore Collagen Infusion Treatment', category: 'Beauty', provider: 'Sloane Facial Experts', price: 140, rating: 4.9, recurring: false, duration: '60 min' },
  { id: 'b3', name: 'The Eternal Glow Membership Package', category: 'Beauty', provider: 'Glow MedSpa London', price: 89, rating: 4.8, recurring: true, duration: 'Monthly Spa Package' },
  
  // Fitness
  { id: 'f1', name: 'Private Pilates & Core Alignment Reformer', category: 'Fitness', provider: 'Kinetic Core studios', price: 65, rating: 4.9, recurring: false, duration: '50 min' },
  { id: 'f2', name: 'Metabolic Conditioning Coaching Suite', category: 'Fitness', provider: 'Coach Marcus Vance', price: 30, rating: 4.6, recurring: false, duration: '30 min focus' },
  { id: 'f3', name: 'Unlimited Gym & Sauna Elite Pass', category: 'Fitness', provider: 'Peak Athletic Guild', price: 95, rating: 4.8, recurring: true, duration: 'Monthly Recurring' },
  
  // Lifestyle & Wellness
  { id: 'l1', name: 'Guided Meditation & Sleep Sync Series', category: 'Lifestyle', provider: 'Serene Mindfulness Group', price: 15, rating: 5.0, recurring: true, duration: 'Annual Plan' },
  { id: 'l2', name: 'Personalized Anti-Inflammatory Nutrition Matrix', category: 'Lifestyle', provider: 'Nutra Balance Institute', price: 160, rating: 4.7, recurring: false, duration: 'Full Report' },

  // Products & Supplements
  { id: 's1', name: 'CoQ10 Cardiovascular Booster (60 Capsules)', category: 'Marketplace', provider: 'Kora Labs', price: 29, rating: 4.8, recurring: false, duration: 'Shipped Product' },
  { id: 's2', name: 'Hydra-Restore Hyaluronic Acid Skin Serum', category: 'Marketplace', provider: 'Glow MedSpa London', price: 39, rating: 4.9, recurring: false, duration: 'Shipped Product' },
  { id: 's3', name: 'Premium Wellness Adaptogen Bundle', category: 'Marketplace', provider: 'Kora Labs', price: 79, rating: 5.0, recurring: true, duration: 'Monthly Auto-refill' }
];

interface MarketplacePillarProps {
  currentSubTab?: 'super-app' | 'home-health' | 'emergency-siren';
  onSubTabChange?: (tab: 'super-app' | 'home-health' | 'emergency-siren') => void;
  currentCategory?: 'All' | 'Health' | 'Beauty' | 'Fitness' | 'Lifestyle' | 'Marketplace';
  onCategoryChange?: (category: 'All' | 'Health' | 'Beauty' | 'Fitness' | 'Lifestyle' | 'Marketplace') => void;
}

export default function MarketplacePillar({
  currentSubTab,
  onSubTabChange,
  currentCategory,
  onCategoryChange
}: MarketplacePillarProps = {}) {
  const [internalTab, setInternalTab] = useState<'super-app' | 'home-health' | 'emergency-siren'>('super-app');
  const activeTab = currentSubTab !== undefined ? currentSubTab : internalTab;
  const setActiveTab = onSubTabChange !== undefined ? onSubTabChange : setInternalTab;

  // Emergency States
  const [ambulanceType, setAmbulanceType] = useState<'basic' | 'cardiac' | 'airvac'>('basic');
  const [pickupLocation, setPickupLocation] = useState('Lagos Mainland Node, Herbert Macaulay Way');
  const [destinationHospital, setDestinationHospital] = useState('Redington Joint Clinical Hospital, Victoria Island');
  const [emergencyStatus, setEmergencyStatus] = useState<'idle' | 'sirens_on' | 'routed' | 'paramedics_onboard' | 'hosp_arrival'>('idle');
  const [emergencyEta, setEmergencyEta] = useState(12);
  const [emergencyLogs, setEmergencyLogs] = useState<string[]>([]);
  const [isTriggeringEmergency, setIsTriggeringEmergency] = useState(false);

  // Super App States
  const [internalCategory, setInternalCategory] = useState<'All' | 'Health' | 'Beauty' | 'Fitness' | 'Lifestyle' | 'Marketplace'>('All');
  const selectedCategory = currentCategory !== undefined ? currentCategory : internalCategory;
  const setSelectedCategory = onCategoryChange !== undefined ? onCategoryChange : setInternalCategory;
  const [searchQuery, setSearchQuery] = useState('');
  const [basket, setBasket] = useState<any[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Home Health states
  const [dispatchType, setDispatchType] = useState<'nurse' | 'physio' | 'blood' | 'massage'>('nurse');
  const [dispatchStatus, setDispatchStatus] = useState<'idle' | 'dispatched' | 'enroute' | 'arrived'>('idle');
  const [droneLatitude, setDroneLatitude] = useState(42);
  const [droneLongitude, setDroneLongitude] = useState(25);
  const [etaRemaining, setEtaRemaining] = useState(15);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);

  const dispatchTypesMetadata = {
    nurse: { name: 'Emergency Clinical Nurse Visit', provider: 'Specialist Sarah Peterson, Registered Nurse', code: 'CLINIC-NUR-81', desc: 'Wound care, injection delivery, or quick vitals screening.' },
    physio: { name: 'Orthopedic Mobile Physiotherapy', provider: 'Physiotherapist David Vance, MSc', code: 'PHYSIO-MBL-44', desc: 'Joint rehabilitation, sports dry needling, and posture clinic.' },
    blood: { name: 'At-home Lab Sample Gathering', provider: 'Phlebotomist Janet Coker, Synlab', code: 'SYNLAB-LAB-22', desc: 'Sterile extraction of biochemistry diagnostics vials.' },
    massage: { name: 'Deep-Tissue Sports Recovery Session', provider: 'Masseuse Clara Hughes, Senior Therapist', code: 'MASSAGE-MBL-99', desc: 'Trigger point manipulation and muscular post-workout relief.' }
  };

  // Dispatch motion simulator timer loop
  useEffect(() => {
    let interval: any;
    if (dispatchStatus === 'dispatched' || dispatchStatus === 'enroute') {
      interval = setInterval(() => {
        setEtaRemaining(prev => {
          if (prev <= 1) {
            setDispatchStatus('arrived');
            setDispatchLogs(logs => [
              `[${new Date().toLocaleTimeString()}] ARRIVED: Practitioner has reached the destination context. Vitals checked and logged in zero-knowledge records vault.`,
              ...logs
            ]);
            return 0;
          }
          // Drift GPS metrics closer to central point
          setDroneLatitude(lat => +(lat + 0.15 * (48 - lat)).toFixed(3));
          setDroneLongitude(lon => +(lon + 0.15 * (55 - lon)).toFixed(3));
          
          if (prev === 8) {
            setDispatchStatus('enroute');
            setDispatchLogs(logs => [
              `[${new Date().toLocaleTimeString()}] ENROUTE: GPS telemetry shows practitioner has cleared edge rate constraints. Speed locked.`,
              ...logs
            ]);
          }
          return prev - 1;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [dispatchStatus]);

  const handleDispatchTrigger = () => {
    setDroneLatitude(35);
    setDroneLongitude(15);
    setEtaRemaining(12);
    setDispatchStatus('dispatched');
    setDispatchLogs([
      `[${new Date().toLocaleTimeString()}] DISPATCHED: Autonomous router allocated nearest medical operator ${dispatchTypesMetadata[dispatchType].provider} from Sector-London.`,
      `[${new Date().toLocaleTimeString()}] LOCK: Immutable GPS trace established. Tracking transaction ID: t_home_${Math.random().toString(16).substring(2, 8)}.`
    ]);
  };

  // Emergency simulator timer loop
  useEffect(() => {
    let interval: any;
    if (emergencyStatus !== 'idle') {
      interval = setInterval(() => {
        setEmergencyEta(prev => {
          if (prev <= 1) {
            setEmergencyStatus('hosp_arrival');
            setEmergencyLogs(logs => [
              `[${new Date().toLocaleTimeString()}] HOSPITAL ENTRY: Secured arrival at Redington Emergency Bay. Diagnostic telemetry handed off to attending Trauma Lead.`,
              ...logs
            ]);
            return 0;
          }
          if (prev === 9) {
            setEmergencyStatus('routed');
            setEmergencyLogs(logs => [
              `[${new Date().toLocaleTimeString()}] AI ROUTING ENGINE: Satellite optimization mapped traffic avoidance corridor. Saved 4 minutes in transit.`,
              ...logs
            ]);
          } else if (prev === 5) {
            setEmergencyStatus('paramedics_onboard');
            setEmergencyLogs(logs => [
              `[${new Date().toLocaleTimeString()}] BLE TELEMETRY LINKED: Patient vitals (Heart rate, blood pressure, SPO2) are streaming directly to emergency medical console.`,
              ...logs
            ]);
          }
          return prev - 1;
        });
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [emergencyStatus]);

  const triggerEmergencyAmbulance = () => {
    setEmergencyEta(12);
    setEmergencyStatus('sirens_on');
    setEmergencyLogs([
      `[${new Date().toLocaleTimeString()}] TRANSIT ALARM: Sirens ON. ${ambulanceType.toUpperCase()} Rescue Vehicle dispatched from Lagos Emergency Command.`,
      `[${new Date().toLocaleTimeString()}] AUDIT BLOCK: Encrypted rescue trace locked into security forensic records ledger.`
    ]);
  };

  const addToBasket = (item: any) => {
    setBasket(prev => {
      const exists = prev.find(p => p.id === item.id);
      if (exists) return prev;
      return [...prev, item];
    });
  };

  const removeFromBasket = (id: string) => {
    setBasket(prev => prev.filter(p => p.id !== id));
  };

  const handleCheckout = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBasket([]);
    }, 3000);
  };

  const filteredServices = servicesCatalog.filter(service => {
    const matchesCat = selectedCategory === 'All' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalSum = basket.reduce((acc, b) => acc + b.price, 0);

  return (
    <div className="space-y-6 text-slate-300">
      
      {/* Upper Module header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase tracking-widest">
            Pillar 2 // Discovery Portal
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Care Marketplace & Super App Space
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Discover consumer health catalogs, build basket-subscriptions, or program GPS-tracked Home Health dispatches.
          </p>
        </div>

        {/* Global Sub Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 text-xs font-mono text-left shrink-0">
          <button
            onClick={() => setActiveTab('super-app')}
            className={`px-4 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'super-app' ? 'bg-slate-850 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Super App Portal
          </button>
          <button
            onClick={() => setActiveTab('home-health')}
            className={`px-4 py-1.5 rounded transition-all flex items-center gap-1.5 ${
              activeTab === 'home-health' ? 'bg-slate-850 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Home Health Dispatch
          </button>
          <button
            onClick={() => setActiveTab('emergency-siren')}
            className={`px-4 py-1.5 rounded transition-all flex items-center gap-1.5 relative border border-transparent ${
              activeTab === 'emergency-siren' 
                ? 'bg-rose-950/80 text-rose-200 font-bold border-rose-800/50 animate-pulse' 
                : 'text-rose-400/80 hover:text-rose-300'
            }`}
          >
            <Siren className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            Emergency Rescue
            {emergencyStatus !== 'idle' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'super-app' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left">
          
          {/* Main Marketplace catalog (8 cols) */}
          <div className="xl:col-span-8 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            
            {/* Search and Category matrix */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between pb-3 border-b border-slate-850">
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Query services, vitamins, or clinics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-slate-300 pl-8 pr-3 py-2 rounded-lg border border-slate-850 focus:outline-none focus:border-slate-700 font-sans"
                />
              </div>

              {/* Category Scrollers */}
              <div className="flex flex-wrap gap-1.5 justify-end">
                {(['All', 'Health', 'Beauty', 'Fitness', 'Lifestyle', 'Marketplace'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded text-[10.5px] font-mono font-bold capitalize transition-colors ${
                      selectedCategory === cat
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/25'
                        : 'bg-slate-950 text-slate-500 border border-slate-850 hover:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {filteredServices.map(service => (
                <div
                  key={service.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-900/80 hover:border-slate-800 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[9.5px] font-mono leading-none tracking-wider px-2 py-0.5 rounded font-black uppercase ${
                        service.category === 'Health' ? 'bg-red-500/10 text-red-400 border border-red-500/15' :
                        service.category === 'Beauty' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/15' :
                        service.category === 'Fitness' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                        service.category === 'Lifestyle' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                        'bg-sky-500/10 text-sky-400 border border-sky-500/15'
                      }`}>
                        {service.category}
                      </span>
                      {service.recurring && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 rounded animate-pulse">
                          MEMBERSHIP
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-200 font-sans mt-2.5 line-clamp-1">{service.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{service.provider}</p>
                    
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5 font-sans">
                      <span className="text-amber-400 font-bold flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400" /> {service.rating}</span>
                      <span className="text-slate-600 font-black">•</span>
                      <span>{service.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 mt-4.5 pt-3">
                    <span className="text-base font-bold text-white font-mono">${service.price}</span>
                    <button
                      onClick={() => addToBasket(service)}
                      disabled={basket.some(b => b.id === service.id)}
                      className={`px-3 py-1.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 transition-all uppercase ${
                        basket.some(b => b.id === service.id)
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      {basket.some(b => b.id === service.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Booked
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Add Basket
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Super App Basket & Memberships (4 cols) */}
          <div className="xl:col-span-4 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            
            <div className="space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <h3 className="text-xs font-bold font-mono uppercase text-slate-300 flex items-center gap-1.5">
                  <ShoppingBag className="text-sky-400 w-4 h-4" />
                  Kora Wellness Basket ({basket.length})
                </h3>
                <span className="text-[10px] bg-slate-950 border border-slate-900 px-2 py-0.5 rounded font-mono text-slate-500">
                  Secure Checkout
                </span>
              </div>

              {basket.length > 0 ? (
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {basket.map(item => (
                    <div key={item.id} className="p-2.5 rounded bg-slate-950 border border-solid border-slate-900 flex justify-between items-center text-xs">
                      <div className="truncate pr-1.5">
                        <strong className="text-slate-200 block truncate font-sans">{item.name}</strong>
                        <span className="text-[10px] text-slate-500 block truncate font-mono">{item.provider}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono shrink-0">
                        <span className="font-bold text-sky-400">${item.price}</span>
                        <button
                          onClick={() => removeFromBasket(item.id)}
                          className="p-1 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition-colors"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 space-y-2 font-sans">
                  <Package className="w-9 h-9 text-slate-700 mx-auto animate-pulse" />
                  <p>Your Kora wellness basket is empty. Browse the discovery list on the left to add clinical slots or supplements.</p>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 text-xs font-mono space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="text-slate-300 font-bold">${totalSum}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Commission Fee (0% OS):</span>
                  <span className="text-slate-300 font-semibold">$0</span>
                </div>
                <div className="flex justify-between text-slate-300 text-sm border-t border-slate-900 pt-2 font-bold">
                  <span>Total Due:</span>
                  <span className="text-sky-400">${totalSum}</span>
                </div>
              </div>

              {bookingSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded text-xs text-emerald-400 font-bold animate-pulse font-mono flex items-center justify-center gap-1 text-center">
                  <CalendarCheck2 className="w-3.5 h-3.5" /> CHECKOUT SUCCESS! APPOINTMENTS IMMUTABLY REGISTERED.
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={basket.length === 0}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold py-3 rounded-lg text-xs font-sans tracking-wider transition-all uppercase"
              >
                Checkout & Subscribe ({basket.length} items)
              </button>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'home-health' && (
        /* HOME HEALTH GPS MODULE */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left animate-fade-in">
          
          {/* Dispatch parameters */}
          <div className="xl:col-span-5 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-850 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Home Health Dispatch Control Center
              </h3>
              <p className="text-[11px] text-slate-500">
                Book authorized licensed practitioners directly to the consumer home. Completely GPS-monitored.
              </p>
            </div>

            {/* Practitioner Selectors */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                1. Select Practitioner Type
              </span>

              <div className="grid grid-cols-2 gap-2">
                {(['nurse', 'physio', 'blood', 'massage'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setDispatchType(type);
                      setDispatchStatus('idle');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all font-sans ${
                      dispatchType === type
                        ? 'bg-slate-950 border-sky-500/30 text-sky-400 font-bold shadow-md shadow-sky-500/5'
                        : 'bg-slate-950/40 border-slate-900 text-slate-400'
                    }`}
                  >
                    <span className="block font-sans text-xs font-black">{dispatchTypesMetadata[type].name.split(' ')[1]}</span>
                    <span className="text-[9px] text-slate-500 block truncate">{dispatchTypesMetadata[type].name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dispatch details summary */}
            <div className="bg-slate-950 p-3.5 border border-slate-900 rounded-lg text-xs leading-relaxed space-y-2">
              <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold uppercase block">
                Selected Medical Provider
              </span>
              <div>
                <strong className="text-slate-200 block font-sans">{dispatchTypesMetadata[dispatchType].name}</strong>
                <span className="text-sky-400 font-mono text-[10px] block">{dispatchTypesMetadata[dispatchType].provider}</span>
                <span className="text-slate-500 text-[9.5px] block mt-0.5 italic">{dispatchTypesMetadata[dispatchType].desc}</span>
              </div>
            </div>

            {/* Dispatch action button */}
            <button
              onClick={handleDispatchTrigger}
              disabled={dispatchStatus !== 'idle' && dispatchStatus !== 'arrived'}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold py-3 rounded-lg text-xs transition-colors font-mono uppercase tracking-wider flex justify-center items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" /> Initiate Home Dispatch Sequence
            </button>
          </div>

          {/* Interactive GPS map tracking */}
          <div className="xl:col-span-7 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between min-h-[440px]">
            <div>
              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <span className="text-[10.5px] font-bold text-slate-400 font-mono uppercase">
                  Continuous GPS Geo-Telemetry Monitor
                </span>

                {/* Status Indicator bubble */}
                <span className={`text-[9.5px] font-black font-mono border px-2 py-0.5 rounded-full uppercase ${
                  dispatchStatus === 'idle' ? 'bg-slate-950 text-slate-500 border-slate-850' :
                  dispatchStatus === 'dispatched' ? 'bg-amber-500/15 text-amber-500 border-amber-500/20 animate-pulse' :
                  dispatchStatus === 'enroute' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20 animate-pulse' :
                  'bg-emerald-500/11 text-emerald-400 border border-emerald-500/20 font-bold'
                }`}>
                  {dispatchStatus === 'idle' && 'SYSTEM_STANDBY'}
                  {dispatchStatus === 'dispatched' && 'PRACTITIONER_ALLOCATED'}
                  {dispatchStatus === 'enroute' && 'PRACTITIONER_ENROUTE'}
                  {dispatchStatus === 'arrived' && 'ARRIVED_OK'}
                </span>
              </div>

              {/* Geo Grid Map */}
              <div className="relative bg-slate-950 rounded-xl border border-slate-900/80 h-[210px] mt-4 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:16px_16px]" />
                
                {/* Simulated Path Tracer line */}
                {dispatchStatus !== 'idle' && (
                  <svg className="absolute inset-0 w-full h-full">
                    <line
                      x1="10%" y1="90%"
                      x2={`${10 + (droneLatitude - 35) * 6}%`}
                      y2={`${90 - (droneLongitude - 15) * 3}%`}
                      stroke="rgba(56, 189, 248, 0.35)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  </svg>
                )}

                {/* Patient / Dispatch Home reference pin */}
                <div className="absolute left-[8%] bottom-[8%] flex flex-col items-center">
                  <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/25 animate-ping absolute scale-75" />
                  <MapPin className="text-sky-400 w-5 h-5 z-10" />
                  <span className="text-[8px] font-mono text-slate-500 font-bold mt-1">PATIENT_HOME</span>
                </div>

                {/* Moving practitioner representation */}
                {dispatchStatus !== 'idle' && (
                  <div
                    style={{
                      left: `${10 + (droneLatitude - 35) * 6}%`,
                      bottom: `${10 + (droneLongitude - 15) * 3}%`
                    }}
                    className="absolute -translate-x-1/2 translate-y-1/2 flex flex-col items-center transition-all duration-1000"
                  >
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30 animate-pulse">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-[8px] font-mono text-emerald-400 font-bold mt-1 uppercase">PRACTITIONER</span>
                  </div>
                )}

                {/* Display grid markers */}
                <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-600 font-bold">GRID ACCURACY: ±2.4m // GPS ENCRYPTED_LINK</div>
                <div className="absolute bottom-2 right-2 text-[8px] font-mono text-slate-600 font-bold">
                  LAT: {droneLatitude}°N // LON: {droneLongitude}°E
                </div>

                {dispatchStatus === 'idle' && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <Compass className="w-8 h-8 text-slate-600 animate-spin-slow" />
                    <span className="text-xs font-mono text-slate-400 font-semibold uppercase">GPS GEO-MAP STOOD DOWN</span>
                    <p className="text-[10px] text-slate-600 font-sans max-w-xs leading-relaxed">Book a clinical home visit to activate interactive micro-tracking and GPS coordinates transmission.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ETA & Live Logs */}
            <div className="space-y-3 pt-4">
              {dispatchStatus !== 'idle' && (
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-950 p-2 border border-slate-900 rounded">
                    <span className="text-slate-500 text-[10px] block">ETA POSITION</span>
                    <strong className="text-sky-400">{etaRemaining > 0 ? `${etaRemaining} Mins` : ' Practitioner Arrived'}</strong>
                  </div>
                  <div className="bg-slate-950 p-2 border border-slate-900 rounded">
                    <span className="text-slate-500 text-[10px] block">TRANSACTION SIGNER</span>
                    <strong className="text-emerald-400">KORA_GPS_DISPATCHER</strong>
                  </div>
                </div>
              )}

              <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-wider block">Real-time Dispatch Ledger Events:</span>
              <div className="bg-slate-950 p-2 rounded border border-slate-900 h-[80px] overflow-y-auto space-y-1.5 font-mono text-[9px] text-slate-400 leading-normal">
                {dispatchLogs.length > 0 ? (
                  dispatchLogs.map((log, index) => (
                    <div key={index} className="pb-1 border-b border-slate-900/60 last:border-0 last:pb-0">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-600 py-4 font-sans">No active geo-routing log traces in this session.</div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* EMERGENCY RIDE BOOKING (AMBULANCE OUTFLOW) */}
      {activeTab === 'emergency-siren' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left animate-fade-in text-slate-300">
          {/* Rescue controls (6 cols) */}
          <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-850 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-rose-400 font-sans">
                  <Siren className="w-4 h-4 animate-pulse text-rose-500" /> Kora Emergency Dispatch & Transit
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Decouple and override standard travel times. Dispatched responders sync continuous WearOS biometric bands.
                </p>
              </div>
              <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest font-black animate-pulse shadow">
                911 Priority Link
              </span>
            </div>

            {/* Selector parameters */}
            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Select Rescue Response Level</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['basic', 'cardiac', 'airvac'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setAmbulanceType(type)}
                      className={`p-2.5 rounded border text-left transition-all relative ${
                        ambulanceType === type 
                          ? 'bg-rose-950/40 border-rose-800/60 text-rose-250 font-bold' 
                          : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      <span className="block text-[10.5px] uppercase">
                        {type === 'basic' ? '🚑 Basic BLS' : type === 'cardiac' ? '⚡ Cardiac ACLS' : '🚁 AirVac Aero'}
                      </span>
                      <span className="block text-[8.5px] text-slate-500 mt-0.5">
                        {type === 'basic' ? '₦45k Baseline' : type === 'cardiac' ? '₦110k Baseline' : '₦750k Baseline'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Pickup Site (Continuous GPS Link)</span>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded px-3 py-2 text-slate-300 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Target Destination Trauma Center</span>
                <select
                  value={destinationHospital}
                  onChange={(e) => setDestinationHospital(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded px-2.5 py-2 text-slate-300 focus:outline-none font-sans"
                >
                  <option value="Redington Joint Clinical Hospital, Victoria Island">Redington Emergency Clinical Hospital, VI (Lagos Master Node)</option>
                  <option value="Lagos University Teaching Hospital (LUTH), Idi-Araba">Lagos University Teaching Hospital (LUTH) Core Trauma</option>
                  <option value="St. Nicholas Emergency Hospital, Lagos Island">St. Nicholas Emergency Hospital, Lagos Island</option>
                </select>
              </div>

              <div className="bg-slate-950 rounded-lg p-3 border border-slate-900 text-[11px] text-slate-400 space-y-2 leading-relaxed">
                <div className="flex items-center justify-between text-slate-300 text-[10px] font-bold uppercase font-mono">
                  <span>Wearable Watch Telemetry Sync:</span>
                  <span className="text-emerald-400">ACTIVE ON BLE // OPT-INED</span>
                </div>
                <p className="text-[9.5px] text-slate-600 font-sans leading-normal">
                  By enabling prioritized dispatch, cardiac telemetry and body heat indexes from linked biometric watches (WearOS / Apple Watch) will continuously sync with the attending paramedics box.
                </p>
              </div>

              {/* Siren trigger button */}
              <button
                onClick={() => {
                  triggerEmergencyAmbulance();
                }}
                className="w-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold py-3.5 rounded-xl uppercase transition-colors tracking-widest flex items-center justify-center gap-2 text-xs shadow-lg shadow-rose-950/50 font-mono"
              >
                <Siren className="w-4 h-4 animate-bounce text-white" /> DEPLOY TRANSIT RIDE & EMERGENCY SIRENS
              </button>
            </div>
          </div>

          {/* Interactive rescue map (6 cols) */}
          <div className="lg:col-span-6 bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <div className="flex items-center gap-1.5">
                  <Activity className="text-rose-500 w-4 h-4 animate-pulse" />
                  <h4 className="text-xs font-bold font-mono uppercase text-slate-300">Tactical Satellite Emergency Map</h4>
                </div>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-black border uppercase ${
                  emergencyStatus === 'idle' ? 'bg-slate-950 border-slate-800 text-slate-500' :
                  emergencyStatus === 'sirens_on' ? 'bg-rose-500/15 border-rose-500/25 text-rose-400 animate-pulse' :
                  emergencyStatus === 'routed' ? 'bg-amber-500/15 border-amber-500/25 text-amber-400' :
                  emergencyStatus === 'paramedics_onboard' ? 'bg-sky-500/15 border-sky-500/25 text-sky-400' :
                  'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                }`}>
                  {emergencyStatus === 'idle' && 'STANDBY'}
                  {emergencyStatus === 'sirens_on' && '🚨 DEPLOYED: OUTFLOW ROLL'}
                  {emergencyStatus === 'routed' && '🧭 AI FAST-ROUTE COMPILING'}
                  {emergencyStatus === 'paramedics_onboard' && '🚑 BOARDED: BLE SYNC'}
                  {emergencyStatus === 'hosp_arrival' && '🏥 SECURED IN BAY'}
                </span>
              </div>

              {/* Graphic Simulator */}
              <div className="relative bg-slate-950 rounded-xl border border-slate-900 h-[210px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e11d4807_1px,transparent_1px),linear-gradient(to_bottom,#e11d4807_1px,transparent_1px)] bg-[size:16px_16px]" />
                
                {emergencyStatus !== 'idle' ? (
                  <>
                    {/* Simulated pulse circles around pickup */}
                    <div className="absolute left-[30%] top-[40%] flex flex-col items-center">
                      <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 animate-ping absolute scale-50" />
                      <div className="p-2 bg-rose-500/20 border border-rose-500/40 rounded-full z-10 text-rose-250">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="text-[8px] font-mono text-rose-400 mt-1 font-bold">PICK_UP</span>
                    </div>

                    {/* Target Hospital */}
                    <div className="absolute right-[20%] bottom-[20%] flex flex-col items-center">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                        <Hospital className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="text-[8px] font-mono text-emerald-400 mt-1 font-bold font-mono">TRAUMA_BAY</span>
                    </div>

                    {/* Animated Route Line */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <path
                        d="M 120 80 Q 200 60, 280 140"
                        fill="none"
                        stroke={emergencyStatus === 'hosp_arrival' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(244, 63, 94, 0.6)'}
                        strokeWidth="3.5"
                        strokeDasharray={emergencyStatus === 'hosp_arrival' ? 'none' : '5 5'}
                        className={emergencyStatus === 'hosp_arrival' ? '' : 'animate-pulse'}
                      />
                    </svg>

                    <div className="absolute top-2 left-2 text-[8.5px] font-mono text-rose-400 animate-pulse font-bold flex items-center gap-1">
                      <Siren className="w-3 h-3" /> RADAR STREAM ACTIVE // PRIORITY LEVEL 1
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <Siren className="w-8 h-8 text-rose-700 mx-auto animate-pulse" />
                    <span className="text-xs font-mono text-slate-500 block font-bold uppercase">TRAUMA RADAR SYSTEM WAITING</span>
                    <p className="text-[9.5px] text-slate-600 font-sans max-w-xs leading-normal">
                      Launch Emergency sirens above to initiate dynamic GPS path avoidance algorithms.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Logs & dynamic ETA */}
            <div className="space-y-3">
              {emergencyStatus !== 'idle' && (
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-950 p-2.5 border border-slate-900 rounded">
                    <span className="text-slate-500 text-[10px] block font-bold uppercase">TRAUMA TRANSIT ETA</span>
                    <strong className="text-rose-400 uppercase">
                      {emergencyEta > 0 ? `${emergencyEta} MINS` : 'EMERGENCY SECURED'}
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 border border-slate-900 rounded text-right">
                    <span className="text-slate-500 text-[10px] block font-bold uppercase">ACTIVE SATELLITE</span>
                    <strong className="text-emerald-400 uppercase">SYS_NODE_CISO_OVERRIDE</strong>
                  </div>
                </div>
              )}

              <span className="text-[9.5px] font-bold text-slate-500 uppercase font-mono tracking-wider block">Live Rescue Dispatch Logs:</span>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-900 h-[105px] overflow-y-auto space-y-1.5 font-mono text-[9px] text-slate-400 leading-normal">
                {emergencyLogs.length > 0 ? (
                  emergencyLogs.map((log, index) => (
                    <div key={index} className="pb-1 border-b border-slate-900/60 last:border-0 last:pb-0 font-mono">
                      <span className="text-rose-500 font-black font-mono">•</span> {log}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-600 py-6 font-sans">911 Prioritized logs will stream here continuously over the transit lifecycle.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
