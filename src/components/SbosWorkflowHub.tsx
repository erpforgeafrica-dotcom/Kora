import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  Users,
  DollarSign,
  Video,
  ShieldCheck,
  Zap,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  ShoppingBag,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Sparkles,
  ClipboardList,
  Calendar,
  Plus,
  RotateCcw,
  Sliders,
  Sparkle,
  Briefcase,
  Layers,
  FileText,
  Percent,
  Settings,
  Truck,
  Database,
  Search,
  Check,
  FileCheck,
  Trash2,
  Edit,
  ArrowRightLeft,
  ChevronLeft,
  Info
} from 'lucide-react';

interface SbosWorkflowHubProps {
  onModuleRoute?: (pillarId: string, subTabId: string) => void;
}

// Global Interfaces for our multi-tenant sandbox
interface Business {
  id: string;
  name: string;
  type: 'Salon' | 'Yoga Studio' | 'Tattoo Parlor' | 'Barber' | 'MedSpa' | 'DigiCare Clinic' | 'Doctor Consult' | 'Gym' | 'Gynecology';
  superModule: 'Selfcare' | 'DigiCare';
  rating: number;
  reviews: number;
  featuredImg: string;
  description: string;
  address: string;
  phone: string;
}

interface ServiceItem {
  id: string;
  businessId: string;
  name: string;
  duration: number; // minutes
  price: number; // NGN
  channel: 'In-Person' | 'Video Call' | 'Audio Consult' | 'Walk-in' | 'Home Visit';
  description: string;
}

interface ProductItem {
  id: string;
  businessId: string;
  name: string;
  price: number; // NGN;
  description: string;
  emoji: string;
  stock: number;
}

interface FieldJob {
  id: string;
  businessName: string;
  workerName: string;
  clientName: string;
  jobType: string;
  address: string;
  status: 'Dispatched' | 'En Route' | 'On Site' | 'Completed';
  etaMinutes: number;
  coordinates: string;
}

interface BookingRecord {
  id: string;
  clientName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  status: 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
  channel: string;
  notes?: string;
}

interface InventoryItem {
  id: string;
  businessId: string;
  name: string;
  category: 'Medical Supps' | 'Salon Supps' | 'Equipment' | 'Consumables';
  stock: number;
  minThreshold: number;
  supplier: string;
}

interface StaffShift {
  id: string;
  businessId: string;
  name: string;
  role: string;
  shift: string; // e.g., "08:00 - 16:00"
  status: 'Checked In' | 'On Break' | 'Absent' | 'On Call';
}

interface BlogArticle {
  id: string;
  title: string;
  author: string;
  category: 'Selfcare' | 'Digital Health' | 'Lifestyle';
  reads: number;
  status: 'Published' | 'Draft';
  summary: string;
}

interface CouponCode {
  code: string;
  discountPct: number;
  domain: 'Selfcare' | 'DigiCare' | 'Universal';
  status: 'Active' | 'Expired';
}

interface CRMLead {
  id: string;
  name: string;
  email: string;
  interest: string;
  score: number; // e.g. 85% hot
  status: 'New' | 'Contacted' | 'Converted' | 'Lost';
}

interface MaintenanceRequest {
  id: string;
  businessName: string;
  item: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Logged' | 'Assigned' | 'Resolved';
  desc: string;
}

export default function SbosWorkflowHub({ onModuleRoute }: SbosWorkflowHubProps) {
  // Global active role switcher representing user constraints
  const [activeRole, setActiveRole] = useState<'client' | 'merchant' | 'admin'>('client');

  // Shared Multi-Tenant Data States simulating real database
  const [businesses, setBusinesses] = useState<Business[]>([
    {
      id: 'biz-01',
      name: 'GlowUp Aesthetics & Salon',
      type: 'Salon',
      superModule: 'Selfcare',
      rating: 4.9,
      reviews: 142,
      featuredImg: '✨',
      description: 'Award-winning hair styling, custom beauty treatments, and aesthetic nail care experts.',
      address: 'Plot 14, Admiralty Way, Lekki Phase 1, Lagos',
      phone: '+234 812 345 6789'
    },
    {
      id: 'biz-02',
      name: 'Zen Flow Yoga & Pilates',
      type: 'Yoga Studio',
      superModule: 'Selfcare',
      rating: 4.8,
      reviews: 98,
      featuredImg: '🧘',
      description: 'An elegant retreat offering vinyasa flow, mindfulness pranayama, and pilates reformers.',
      address: '22, Victoria Island Sector B, Lagos',
      phone: '+234 815 678 1234'
    },
    {
      id: 'biz-03',
      name: 'Apex Botanical MedSpa',
      type: 'MedSpa',
      superModule: 'Selfcare',
      rating: 4.9,
      reviews: 74,
      featuredImg: '💎',
      description: 'Advanced non-invasive cosmetic procedures, chemical peels, and cellular hydration therapies.',
      address: 'Ikoyi High Street, Unit 5, Lagos',
      phone: '+234 803 999 0000'
    },
    {
      id: 'biz-04',
      name: 'Lagos DigiCare & Diagnostics Clinic',
      type: 'DigiCare Clinic',
      superModule: 'DigiCare',
      rating: 4.7,
      reviews: 215,
      featuredImg: '🏥',
      description: 'Integrated digital clinic connecting board-certified doctors, remote nurses, and rapid diagnostic labs.',
      address: 'Wuse II Medical Park, Lagos-Abuja Link',
      phone: '+234 701 444 8888'
    },
    {
      id: 'biz-05',
      name: 'Dr. Emeka Nwachukwu Consults',
      type: 'Doctor Consult',
      superModule: 'DigiCare',
      rating: 5.0,
      reviews: 320,
      featuredImg: '🩺',
      description: 'Specialist consultations focusing on metabolic health, diabetic control, and continuous bio-vitals telemetry.',
      address: 'Telepresence Hub Alpha / Lekki Clinics',
      phone: '+234 812 999 1111'
    },
    {
      id: 'biz-06',
      name: 'Vivid Alchemy Tattoo Studio',
      type: 'Tattoo Parlor',
      superModule: 'Selfcare',
      rating: 4.9,
      reviews: 112,
      featuredImg: '🎨',
      description: 'Premium body art, custom sterile linework illustrations, and safe cosmetic pigments.',
      address: 'Admiralty High Road, Block 3, Lekki, Lagos',
      phone: '+234 803 111 2222'
    },
    {
      id: 'biz-07',
      name: 'Royal Crown Barbers & Spa',
      type: 'Barber',
      superModule: 'Selfcare',
      rating: 4.8,
      reviews: 154,
      featuredImg: '💈',
      description: 'Exceptional executive facial grooms, hot towel shaves, and botanical head care treatments.',
      address: '5a, Ozumba Mbadiwe Ave, Victoria Island, Lagos',
      phone: '+234 902 444 5555'
    },
    {
      id: 'biz-08',
      name: 'Iron Temple Fitness & Gym',
      type: 'Gym',
      superModule: 'Selfcare',
      rating: 4.9,
      reviews: 280,
      featuredImg: '🏋️',
      description: 'State-of-the-art strength training equipment, aerobic suites, and corporate physical performance tracking.',
      address: 'Aminu Kano Crescent, Wuse II, Abuja',
      phone: '+234 809 777 8888'
    },
    {
      id: 'biz-09',
      name: 'Dr. Miriam Cole - Gynecology Wellness',
      type: 'Gynecology',
      superModule: 'DigiCare',
      rating: 5.0,
      reviews: 94,
      featuredImg: '🌸',
      description: 'Compassionate maternal healthcare, pre-natal telehealth consults, and hormone-balance panels.',
      address: 'Ikoyi Health Hub, Suite B4, Lagos',
      phone: '+234 811 555 7777'
    }
  ]);

  const [services, setServices] = useState<ServiceItem[]>([
    { id: 'srv-01', businessId: 'biz-01', name: 'Hair Trim & Custom Styling', duration: 45, price: 10000, channel: 'In-Person', description: 'Includes deep organic botanical conditioning wash and signature hot blowout.' },
    { id: 'srv-02', businessId: 'biz-01', name: 'Aesthetic Hand Hydration Mani', duration: 30, price: 6500, channel: 'In-Person', description: 'Deep collagen glove wrap followed by meticulous classic cut and paint.' },
    { id: 'srv-03', businessId: 'biz-02', name: 'Deep Rest Vinyasa Class', duration: 60, price: 8000, channel: 'In-Person', description: 'Core-strengthening alignments paired with advanced meditative breathing cycles.' },
    { id: 'srv-04', businessId: 'biz-03', name: 'Dermal Acid Peel & Laser Hydrate', duration: 40, price: 25000, channel: 'In-Person', description: 'Medical-grade glycolic peel targeting cellular renewal and pigment repair.' },
    { id: 'srv-05', businessId: 'biz-04', name: 'DigiCare Video Medical Consult', duration: 25, price: 15000, channel: 'Video Call', description: 'HIPAA-compliant encrypted telemedicine session with a consulting general practitioner.' },
    { id: 'srv-06', businessId: 'biz-04', name: 'Rapid Nurse Walk-In Vitals Check', duration: 15, price: 5000, channel: 'Walk-in', description: 'Physical assessment of blood pressure, glucose, and oxygen profiles with card log synced.' },
    { id: 'srv-07', businessId: 'biz-05', name: 'Diabetic Telehealth Consultation', duration: 30, price: 18000, channel: 'Video Call', description: 'In-depth assessment of CGM telemetry graphs, glucose trends, and lifestyle modifications.' },
    { id: 'srv-08', businessId: 'biz-06', name: 'Vivid Custom Linework Art', duration: 120, price: 45000, channel: 'In-Person', description: 'Custom tattoo outline includes dermatologically tested recovery film and sterile ink prep.' },
    { id: 'srv-09', businessId: 'biz-07', name: 'Premium Royal Shave & Cut', duration: 45, price: 12000, channel: 'In-Person', description: 'Bespoke shear cut and hot-shave detailing using organic eucalyptus pre-shave oils.' },
    { id: 'srv-10', businessId: 'biz-08', name: 'HIIT Performance Coaching', duration: 60, price: 15000, channel: 'In-Person', description: 'High-intensity athletic session targeting VO2 capacity indicators.' },
    { id: 'srv-11', businessId: 'biz-09', name: 'Pre-natal Wellness Tele-Consult', duration: 45, price: 25000, channel: 'Video Call', description: 'Personalized clinical consulting, diagnostic panel analysis, and bio-vital recommendations.' },
    { id: 'srv-12', businessId: 'biz-01', name: 'Home In-call Massage Harmony', duration: 75, price: 30000, channel: 'Home Visit', description: 'Certified mobile masseuse dispatched with a heated table and essential oils directly to your home.' },
    { id: 'srv-13', businessId: 'biz-09', name: 'Mobile Nurse Post-natal Check', duration: 60, price: 22000, channel: 'Home Visit', description: 'Maternal health nurse dispatched to do post-natal vitals checks, infant care routing, and lab orders.' }
  ]);

  const [products, setProducts] = useState<ProductItem[]>([
    { id: 'prd-01', businessId: 'biz-01', name: 'Botanical Growth Seed Oil 100ml', price: 12500, description: 'Stimulate follicle roots organically with cold-pressed rosemary and custom rosehip oil.', emoji: '🌿', stock: 45 },
    { id: 'prd-02', businessId: 'biz-01', name: 'Hydra-Firm Collagen Face Cream', price: 18500, description: 'Medical-grade moisture lock utilizing pure plant ceramides.', emoji: '🧴', stock: 20 },
    { id: 'prd-03', businessId: 'biz-02', name: 'Non-Slip Organic Cork Yoga Mat', price: 22000, description: 'Sustainable, high-density cork grip perfect for rigorous hot yoga sessions.', emoji: '🧘', stock: 15 },
    { id: 'prd-04', businessId: 'biz-04', name: 'Vitals Care Home Test Kit', price: 9500, description: 'Hygienic multi-measurement kit including instant urinalysis panels and lancets.', emoji: '🧪', stock: 60 },
    { id: 'prd-05', businessId: 'biz-05', name: 'WearOS CGM Bio-Link Transmitter', price: 48000, description: 'Continuous glucose telemetry monitor linked to Kora analytics dashboard.', emoji: '🩺', stock: 8 },
    { id: 'prd-06', businessId: 'biz-06', name: 'Shield Recovery Tattoo Pomade', price: 5500, description: 'Fast cell-renewing recovery cream infused with vitamins A and D.', emoji: '🎨', stock: 35 },
    { id: 'prd-07', businessId: 'biz-07', name: 'Menthol Shave Balm Conditioner', price: 6500, description: 'Cooling post-cut hydration balm preventing ingrown follicles.', emoji: '💈', stock: 24 },
    { id: 'prd-08', businessId: 'biz-08', name: 'Athletic Raw Protein Shake Powder', price: 24000, description: 'Ultra-pure isolate protein facilitating speedy skeletal muscle repair.', emoji: '🏋️', stock: 19 },
    { id: 'prd-09', businessId: 'biz-09', name: 'Prenatal Multi-Vitamin Bio-Caps', price: 16000, description: 'Folic acid and bio-available minerals optimized for maternal absorption.', emoji: '🌸', stock: 30 }
  ]);

  const [fieldJobs, setFieldJobs] = useState<FieldJob[]>([
    { id: 'job-01', businessName: 'GlowUp Aesthetics & Salon', workerName: 'Therapist Jessica Harrison', clientName: 'Adaeze Okonkwo', jobType: 'Home In-call Massage Harmony', address: 'Plot 14, Admiralty Way, Lekki', status: 'En Route', etaMinutes: 12, coordinates: '6.4281° N, 3.4219° E' },
    { id: 'job-02', businessName: 'Dr. Miriam Cole - Gynecology Wellness', workerName: 'Nurse Blessing Nwosu', clientName: 'Ibrahim Lawal (Spouse)', jobType: 'Mobile Nurse Post-natal Check', address: '5, Victoria Island B, Lagos', status: 'Dispatched', etaMinutes: 28, coordinates: '6.4311° N, 3.4155° E' }
  ]);

  const [bookings, setBookings] = useState<BookingRecord[]>([
    { id: 'bk-01', clientName: 'Adaeze Okonkwo', businessName: 'GlowUp Aesthetics & Salon', serviceName: 'Hair Trim & Custom Styling', date: '2026-06-01', time: '10:00 AM', price: 10000, status: 'Completed', channel: 'In-Person' },
    { id: 'bk-02', clientName: 'Adaeze Okonkwo', businessName: 'Dr. Emeka Nwachukwu Consults', serviceName: 'Diabetic Telehealth Consultation', date: '2026-06-02', time: '12:30 PM', price: 18000, status: 'Approved', channel: 'Video Call', notes: 'Diabetes follow-up. WearOS CGM active.' },
    { id: 'bk-03', clientName: 'Ibrahim Lawal', businessName: 'Lagos DigiCare & Diagnostics Clinic', serviceName: 'Rapid Nurse Walk-In Vitals Check', date: '2026-06-03', time: '09:00 AM', price: 5000, status: 'Pending', channel: 'Walk-in' }
  ]);

  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'inv-01', businessId: 'biz-04', name: 'Sterilized Capillary Lancets', category: 'Medical Supps', stock: 120, minThreshold: 50, supplier: 'MedSupply West Africa' },
    { id: 'inv-02', businessId: 'biz-04', name: 'Blood Glucose Test Strips', category: 'Medical Supps', stock: 15, minThreshold: 40, supplier: 'MedSupply West Africa' }, // Low stock trigger
    { id: 'inv-03', businessId: 'biz-01', name: 'Hydro-Moist Shampoos 1L', category: 'Salon Supps', stock: 24, minThreshold: 10, supplier: 'GlowCosmetics Ltd' },
    { id: 'inv-04', businessId: 'biz-01', name: 'Collagen Nail Spa Gloves', category: 'Consumables', stock: 8, minThreshold: 15, supplier: 'Lagos Beauty Depot' } // Low stock trigger
  ]);

  const [staff, setStaff] = useState<StaffShift[]>([
    { id: 'stf-01', businessId: 'biz-05', name: 'Dr. Emeka Nwachukwu', role: 'Chief Medical Consultant', shift: '09:00 - 17:00', status: 'Checked In' },
    { id: 'stf-02', businessId: 'biz-04', name: 'Nurse Blessing Nwosu', role: 'Emergency Vitals Specialist', shift: '08:00 - 16:00', status: 'Checked In' },
    { id: 'stf-03', businessId: 'biz-01', name: 'Jessica Harrison', role: 'Senior Aesthetic Stylist', shift: '10:00 - 19:00', status: 'Checked In' },
    { id: 'stf-04', businessId: 'biz-02', name: 'Yogi Maya', role: 'Vinyasa Breathe Master', shift: '07:00 - 13:00', status: 'On Break' }
  ]);

  const [blogs, setBlogs] = useState<BlogArticle[]>([
    { id: 'art-01', title: '5 Indicators of Fasting Glucose Trends', author: 'Dr. Emeka Nwachukwu', category: 'Digital Health', reads: 1420, status: 'Published', summary: 'How to use lightweight bluetooth monitors to accurately plot glycemic peaks.' },
    { id: 'art-02', title: 'Choosing the Right Cellular Acid Peel', author: 'Aesthetician Jessica', category: 'Selfcare', reads: 890, status: 'Published', summary: 'Understanding alpha-hydroxy vs glycolic acids for safe home skincare.' },
    { id: 'art-03', title: 'Breath Control Routines for Insomnia Relief', author: 'Yogi Maya', category: 'Lifestyle', reads: 430, status: 'Draft', summary: 'Ancient pranayama breathing geometries configured for deep vagal relaxation.' }
  ]);

  const [coupons, setCoupons] = useState<CouponCode[]>([
    { code: 'GLOW20', discountPct: 20, domain: 'Selfcare', status: 'Active' },
    { code: 'DIGICARE50', discountPct: 50, domain: 'DigiCare', status: 'Active' },
    { code: 'KORAFREE', discountPct: 100, domain: 'Universal', status: 'Active' }
  ]);

  const [leads, setLeads] = useState<CRMLead[]>([
    { id: 'ld-01', name: 'Osas Igbinoha', email: 'osas@corp.ng', interest: 'Corporate MedSpa Pass', score: 92, status: 'New' },
    { id: 'ld-02', name: 'Chidera Nwesu', email: 'chidera@nailhub.com', interest: 'Mani-Pedis Bulk Offer', score: 80, status: 'Contacted' },
    { id: 'ld-03', name: 'Fatima Yar’Adua', email: 'fatima@diacontrol.org', interest: 'Bluetooth Wearable Monitor Bundle', score: 95, status: 'Converted' }
  ]);

  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([
    { id: 'mn-01', businessName: 'GlowUp Aesthetics & Salon', item: 'Electric Styling Chair hydraulic leak', priority: 'Medium', status: 'Logged', desc: 'Hydraulic lift fails to lock in place when raised.' },
    { id: 'mn-02', businessName: 'Lagos DigiCare & Diagnostics Clinic', item: 'ECG Bluetooth Receiver calibration', priority: 'High', status: 'Assigned', desc: 'No connectivity with master clinic interface telemetry receiver.' }
  ]);

  // Merchant Role Selection State
  const [selectedMerchantBiz, setSelectedMerchantBiz] = useState<string>('biz-01');

  // Input states for dynamic adding
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(10000);
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServiceChannel, setNewServiceChannel] = useState<'In-Person' | 'Video Call' | 'Audio Consult' | 'Walk-in' | 'Home Visit'>('In-Person');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Product adding inputs
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState(5000);
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductEmoji, setNewProductEmoji] = useState('🧴');
  const [newProductStock, setNewProductStock] = useState(20);
  const [catalogTab, setCatalogTab] = useState<'services' | 'products'>('services');

  // Field jobs dispatch inputs
  const [newJobType, setNewJobType] = useState('Home In-call Massage Harmony');
  const [newJobStaff, setNewJobStaff] = useState('Jessica Harrison');
  const [newJobAddress, setNewJobAddress] = useState('Plot 14, Admiralty Way, Lekki');

  // Blog editor inputs
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogCategory, setNewBlogCategory] = useState<'Selfcare' | 'Digital Health' | 'Lifestyle'>('Selfcare');
  const [newBlogSummary, setNewBlogSummary] = useState('');

  // Brand Booking trigger state (Client Flow)
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedServiceToBook, setSelectedServiceToBook] = useState<ServiceItem | null>(null);
  const [bookedSuccessMsg, setBookedSuccessMsg] = useState(false);

  // Smart Platform AI copywriting Helper (for merchants to advertise themselves)
  const [aiHeadlinePrompt, setAiHeadlinePrompt] = useState('Hair style organic blowout');
  const [aiHeadlineResult, setAiHeadlineResult] = useState('');
  const [generatingAd, setGeneratingAd] = useState(false);

  // Coupon creator inputs
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPct, setNewCouponPct] = useState(15);
  const [newCouponDomain, setNewCouponDomain] = useState<'Selfcare' | 'DigiCare' | 'Universal'>('Selfcare');

  // Current active subtab inside Merchant view
  const [merchantSubSub, setMerchantSubSub] = useState<'profile' | 'catalog' | 'clients' | 'procurement' | 'hrm' | 'marketing' | 'maintenance' | 'field_work' | 'analytics' | 'blog' | 'finance'>('profile');

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName) return;
    const item: ProductItem = {
      id: `prd-${Date.now()}`,
      businessId: selectedMerchantBiz,
      name: newProductName,
      price: newProductPrice,
      description: newProductDesc || 'Premium retail product listing.',
      emoji: newProductEmoji,
      stock: newProductStock
    };
    setProducts(prev => [...prev, item]);
    setNewProductName('');
    setNewProductPrice(5000);
    setNewProductDesc('');
    alert("Kora SBOS: New product catalog item listed successfully!");
  };

  const handleCreateFieldJob = (e: React.FormEvent) => {
    e.preventDefault();
    const biz = businesses.find(b => b.id === selectedMerchantBiz);
    const item: FieldJob = {
      id: `job-${Date.now()}`,
      businessName: biz ? biz.name : 'HealthConnect Care',
      workerName: newJobStaff,
      clientName: 'Adaeze Okonkwo',
      jobType: newJobType,
      address: newJobAddress,
      status: 'Dispatched',
      etaMinutes: 25,
      coordinates: '6.4420° N, 3.4290° E'
    };
    setFieldJobs(prev => [item, ...prev]);
    alert("Kora SBOS: Mobile Home Care / Physical Field Service dispatch order initialized!");
  };

  const handleCreateBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogTitle) return;
    const authorName = staff.filter(s => s.businessId === selectedMerchantBiz)[0]?.name || 'Licensed Specialist';
    const item: BlogArticle = {
      id: `art-${Date.now()}`,
      title: newBlogTitle,
      author: authorName,
      category: newBlogCategory,
      reads: 1,
      status: 'Published',
      summary: newBlogSummary || 'Care advice and guidance trends for wellness.'
    };
    setBlogs(prev => [item, ...prev]);
    setNewBlogTitle('');
    setNewBlogSummary('');
    alert("Kora SBOS: New wellness advise article published instantly to your customers' feed!");
  };

  // Dynamic automatic procurement simulation
  const handleSimulateProcurement = (itemId: string) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, stock: item.stock + 50 };
      return item;
    }));
    alert("Kora SBOS dynamic AI procurement triggered: 50 units ordered and delivered instantly to avoid resource bottlenecks!");
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName) return;
    const item: ServiceItem = {
      id: `srv-${Date.now()}`,
      businessId: selectedMerchantBiz,
      name: newServiceName,
      price: newServicePrice,
      duration: newServiceDuration,
      channel: newServiceChannel,
      description: newServiceDesc || 'No custom description provided yet.'
    };
    setServices(prev => [...prev, item]);
    setNewServiceName('');
    setNewServicePrice(10000);
    setNewServiceDesc('');
    alert("New custom service catalog item listed successfully!");
  };

  const handleGenerateAIAd = () => {
    setGeneratingAd(true);
    setTimeout(() => {
      const headlines = [
        `✨ Turn Heads! Relax with GlowUp's Premium ${aiHeadlinePrompt} with 20% Off using GLOW20!`,
        `🩺 Reclaim Control over your metabolism. Book an exclusive consultation focusing on ${aiHeadlinePrompt}.`,
        `🧘 Find your flow & heal. Secure and custom physical ${aiHeadlinePrompt} scheduled at your ease.`,
        `💎 Elevate wellness. Authentic, medically backed ${aiHeadlinePrompt} with immediate walk-in options!`
      ];
      setAiHeadlineResult(headlines[Math.floor(Math.random() * headlines.length)]);
      setGeneratingAd(false);
    }, 800);
  };

  const handleBookService = () => {
    if (!selectedServiceToBook) return;
    const biz = businesses.find(b => b.id === selectedServiceToBook.businessId);
    const item: BookingRecord = {
      id: `bk-${Date.now()}`,
      clientName: 'Adaeze Okonkwo (You)',
      businessName: biz ? biz.name : 'HealthConnect Care',
      serviceName: selectedServiceToBook.name,
      date: '2026-06-05',
      time: '11:00 AM',
      price: selectedServiceToBook.price,
      status: 'Approved',
      channel: selectedServiceToBook.channel,
      notes: 'Self-booked via HealthConnect Portal.'
    };
    setBookings(prev => [item, ...prev]);
    setBookedSuccessMsg(true);
    setTimeout(() => {
      setBookedSuccessMsg(false);
      setBookModalOpen(false);
      setSelectedServiceToBook(null);
    }, 2200);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode) return;
    const item: CouponCode = {
      code: newCouponCode.toUpperCase().replace(/\s+/g, ''),
      discountPct: newCouponPct,
      domain: newCouponDomain,
      status: 'Active'
    };
    setCoupons(prev => [item, ...prev]);
    setNewCouponCode('');
    alert(`Active coupon ${item.code} configured successfully!`);
  };

  return (
    <div className="space-y-6 text-[#cbd5e1] font-sans text-left animate-fade-in pb-16">
      
      {/* ========================================================= */}
      {/* ⚠️ HIGH-QUALITY HERO HEADER (Multi-tenant Service Hub Paradigm) */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-r from-[#0a1226] via-[#09152e] to-[#0a1226] border border-slate-800/90 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-radial-gradient from-teal-500/10 to-transparent pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 h-24 w-1/3 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none rounded-full blur-xl" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl select-none">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-black text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20 uppercase tracking-widest">
                HealthConnect™ SBOS v2.8
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20 uppercase tracking-widest">
                Core Service Hub (Non-Hospital)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Regulated Telemedicine + Local Selfcare Platform
            </h1>
            <p className="text-slate-300 text-xs md:text-[13px] leading-relaxed font-sans">
              Welcome to the single-view operations cockpit. This platform binds local consumer treatments (Salons, Yoga, Spas, Tattoo artistry) and digital clinical consults (Doctors, Nurses, Walk-in diagnostics) into a unified service sandbox. Select your user role context below to explore custom operations 1:1.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setActiveRole('client')}
              className={`flex-1 shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'client'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black border-teal-400 shadow-lg shadow-teal-500/10'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1. Client view</span>
            </button>

            <button
              onClick={() => setActiveRole('merchant')}
              className={`flex-1 shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'merchant'
                  ? 'bg-[#10b981]/20 text-emerald-400 border-[#10b981]/50 shadow-md shadow-emerald-500/5'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>2. Business Tenant vView</span>
            </button>

            <button
              onClick={() => setActiveRole('admin')}
              className={`flex-1 shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                activeRole === 'admin'
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 shadow-md shadow-purple-500/5'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <Settings className="w-4 h-4 animate-spin-slow" />
              <span>3. System Admin view</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PERSPECTIVE A: CLIENT PORTAL (Search, Filter, Book, Read) */}
      {/* ========================================================= */}
      {activeRole === 'client' && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Subheading info */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#070c17]/90 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
                <Search className="w-5 h-5" />
              </div>
              <div className="text-left font-sans select-none">
                <strong className="text-sm font-bold text-white block">Discover Local Selfcare & Digital Care</strong>
                <p className="text-xs text-slate-400">Book trusted high-rated beauty experts, salons, medspas, yoga studios, or clinics safely.</p>
              </div>
            </div>
            
            {/* Direct access to fast emergency trigger */}
            <span className="text-[11px] font-mono text-slate-400">
              Logged in as: <strong className="text-teal-400">Adaeze Okonkwo</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. DISCOVER BUSINESSES SECTION */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                  Discover Top-Rated Services
                </h3>
                <span className="text-xs font-mono text-slate-500">Showing {businesses.length} Premium Hubs</span>
              </div>

              <div className="space-y-4">
                {businesses.map(biz => {
                  // Get services for this business
                  const bizServices = services.filter(s => s.businessId === biz.id);

                  return (
                    <div key={biz.id} className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all space-y-4 relative">
                      
                      {/* Badge for Super Module domain classification */}
                      <span className={`absolute top-4 right-4 text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-widest ${
                        biz.superModule === 'Selfcare' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {biz.superModule === 'Selfcare' ? 'Enterprise Selfcare' : 'DigiCare Tele-Consult'}
                      </span>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shadow-inner select-none shrink-0">
                          {biz.featuredImg}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white tracking-tight">{biz.name}</h4>
                            <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-0.5">
                              ★{biz.rating} <span className="text-[9px] text-slate-500 font-normal">({biz.reviews})</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-teal-400 font-mono uppercase font-black tracking-wide bg-teal-500/5 px-2 py-0.5 rounded inline-block border border-teal-500/10">
                            {biz.type} Hub
                          </p>
                          <p className="text-xs text-slate-400 font-sans leading-relaxed pt-1">{biz.description}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono pt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{biz.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Service listings for this business */}
                      <div className="border-t border-slate-800/60 pt-4 space-y-2.5">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Available Services Menu</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {bizServices.map(srv => (
                            <div key={srv.id} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-between hover:border-slate-700 transition-all">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <strong className="text-xs text-slate-200">{srv.name}</strong>
                                  <span className="text-xs font-mono font-bold text-teal-400 shrink-0">
                                    ₦{srv.price.toLocaleString()}
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-slate-500 block mt-1">
                                  ⏱ {srv.duration} mins · {srv.channel}
                                </span>
                                <p className="text-[11px] text-slate-400 font-sans mt-1.5 leading-relaxed truncate-2-lines">{srv.description}</p>
                              </div>

                              <div className="border-t border-slate-900/60 mt-2.5 pt-2 flex items-center justify-between">
                                <span className={`text-[9px] font-mono uppercase rounded px-1.5 py-0.5 ${
                                  srv.channel === 'Video Call' || srv.channel === 'Audio Consult'
                                    ? 'bg-purple-500/10 text-purple-400'
                                    : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {srv.channel === 'Video Call' || srv.channel === 'Audio Consult' ? 'Online' : 'Walk-In'}
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedServiceToBook(srv);
                                    setBookModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-teal-500/15 hover:bg-teal-500 text-teal-400 hover:text-slate-950 font-semibold font-mono text-[10px] rounded border border-teal-500/25 transition-all cursor-pointer"
                                >
                                  Book Slot
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. SIDEBAR FOR CLIENT (Upcoming schedule, Active prescriptions, Loyalty CRM) */}
            <div className="space-y-6">
              
              {/* Upcoming client bookings ledger */}
              <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>My Upcoming Schedule</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">{bookings.filter(b => b.status === 'Approved').length} booked</span>
                </div>

                <div className="space-y-2.5">
                  {bookings.map(bk => (
                    <div key={bk.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-1.5 relative text-xs">
                      <div className="flex justify-between items-center">
                        <strong className="text-normal text-white truncate max-w-[150px]">{bk.serviceName}</strong>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          bk.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' 
                          : bk.status === 'Completed' ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {bk.status}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400">{bk.businessName}</p>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                        <span>{bk.date} · {bk.time}</span>
                        <span className="text-teal-400 font-bold">₦{bk.price.toLocaleString()}</span>
                      </div>
                      {bk.notes && (
                        <p className="text-[10px] text-cyan-400 font-mono bg-cyan-400/5 p-1 rounded border border-cyan-400/20 mt-1.5 leading-relaxed">
                          📌 Note: {bk.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Loyalty Program Tracker */}
              <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Percent className="w-3.5 h-3.5 text-amber-500" />
                  <span>My Loyalty & Rewards Wallet</span>
                </h4>
                
                <div className="space-y-3.5 text-xs font-sans">
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                    <div className="flex justify-between items-center font-mono">
                      <strong className="text-slate-300">GlowUp Member Card</strong>
                      <span className="text-amber-400">4 / 5 Stamps</span>
                    </div>
                    {/* Stamp progress */}
                    <div className="flex justify-between gap-1">
                      {[1, 2, 3, 4].map(s => (
                        <div key={s} className="flex-1 h-3 rounded bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-[8px] font-bold text-amber-300">★</div>
                      ))}
                      <div className="flex-1 h-3 rounded bg-slate-900 border border-slate-800" />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1">1 more treatment to earn a FREE botanical blowout worth ₦10,000!</p>
                  </div>

                  {/* Active coupon checks */}
                  <div className="space-y-1.5 select-none font-mono text-[10px]">
                    <span className="text-slate-500 uppercase tracking-wider block font-bold">Coupons for My Domain</span>
                    <div className="grid grid-cols-2 gap-1.5 text-center">
                      <div className="bg-emerald-500/5 border border-emerald-500/20 p-2 rounded">
                        <strong className="text-emerald-400 block text-xs">GLOW20</strong>
                        <span className="text-slate-500 block leading-tight">20% off Selfcare</span>
                      </div>
                      <div className="bg-cyan-500/5 border border-cyan-500/20 p-2 rounded">
                        <strong className="text-cyan-400 block text-xs">DIGICARE50</strong>
                        <span className="text-slate-500 block leading-tight">50% off Consults</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart blog advise feed */}
              <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-3.5">
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider border-b border-slate-800 pb-2">
                  📰 Smart Client Care Blog
                </h4>

                <div className="space-y-3">
                  {blogs.filter(b => b.status === 'Published').map(art => (
                    <div key={art.id} className="space-y-1 text-xs">
                      <span className="text-[8.5px] font-mono uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded tracking-wider">
                        {art.category}
                      </span>
                      <strong className="text-slate-200 block font-semibold hover:text-white transition-all cursor-pointer">
                        {art.title}
                      </strong>
                      <p className="text-slate-400 text-[11px] leading-relaxed font-sans">{art.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* PERSPECTIVE B: MERCHANT PANEL (Profiles, listings, HRM, shift, Inventory) */}
      {/* ========================================================= */}
      {activeRole === 'merchant' && (
        <div className="space-y-6 animate-fade-in text-left font-sans">
          
          {/* Tenant Business Switcher */}
          <div className="p-4 bg-[#070c17]/95 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Choose your Business Tenant Console</span>
              <div className="flex flex-wrap gap-2">
                {businesses.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedMerchantBiz(b.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                      selectedMerchantBiz === b.id
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span>{b.featuredImg} {b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Classification identifier */}
            <div className="text-right select-none font-mono">
              <span className="text-[9px] text-slate-500 uppercase block font-bold">Active Branch Core</span>
              <strong className="text-emerald-400 text-xs uppercase tracking-wide">
                {businesses.find(b => b.id === selectedMerchantBiz)?.superModule === 'Selfcare' 
                  ? '💅 Selfcare Domain Module' 
                  : '🩺 DigiCare Medical Module'
                }
              </strong>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Merchant Inner Sub Nav */}
            <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
              <button
                onClick={() => setMerchantSubSub('profile')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-left transition-all shrink-0 cursor-pointer ${
                  merchantSubSub === 'profile' ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🏢 Profile Setup</span>
              </button>
              <button
                onClick={() => setMerchantSubSub('catalog')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-left transition-all shrink-0 cursor-pointer ${
                  merchantSubSub === 'catalog' ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📜 Unified Catalog</span>
              </button>
              <button
                onClick={() => setMerchantSubSub('clients')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-left transition-all shrink-0 cursor-pointer ${
                  merchantSubSub === 'clients' ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👥 Bookings Ledger</span>
              </button>
              <button
                onClick={() => setMerchantSubSub('field_work')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-left transition-all shrink-0 cursor-pointer ${
                  merchantSubSub === 'field_work' ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🚒 Field Dispatch</span>
              </button>
              <button
                onClick={() => setMerchantSubSub('procurement')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-left transition-all shrink-0 cursor-pointer ${
                  merchantSubSub === 'procurement' ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📦 Supply & Inventory</span>
              </button>
              <button
                onClick={() => setMerchantSubSub('analytics')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-left transition-all shrink-0 cursor-pointer ${
                  merchantSubSub === 'analytics' ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📈 Performance & Alerts</span>
              </button>
              <button
                onClick={() => setMerchantSubSub('blog')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-left transition-all shrink-0 cursor-pointer ${
                  merchantSubSub === 'blog' ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📰 Blog Composer</span>
              </button>
              <button
                onClick={() => setMerchantSubSub('hrm')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-left transition-all shrink-0 cursor-pointer ${
                  merchantSubSub === 'hrm' ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👨‍⚕️ Rota & Commissions</span>
              </button>
              <button
                onClick={() => setMerchantSubSub('finance')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-left transition-all shrink-0 cursor-pointer ${
                  merchantSubSub === 'finance' ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🏦 Finance & split Ledger</span>
              </button>
              <button
                onClick={() => setMerchantSubSub('marketing')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-left transition-all shrink-0 cursor-pointer ${
                  merchantSubSub === 'marketing' ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>📣 CRM & Coupons</span>
              </button>
              <button
                onClick={() => setMerchantSubSub('maintenance')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-left transition-all shrink-0 cursor-pointer ${
                  merchantSubSub === 'maintenance' ? 'bg-[#10b981]/15 text-emerald-400 font-bold border border-emerald-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🔧 Maintenance Log</span>
              </button>
            </div>

            {/* Merchant Sub-sub Workspace Dashboard content */}
            <div className="lg:col-span-3 space-y-4">

              {/* PROFILE SETUP SUBTAB */}
              {merchantSubSub === 'profile' && (
                <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center select-none font-mono">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Business Profile Setup</span>
                    <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Verified Tenant</span>
                  </div>

                  {businesses.filter(b => b.id === selectedMerchantBiz).map(b => (
                    <div key={b.id} className="space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-400">Business Public Name</label>
                          <input
                            type="text"
                            value={b.name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setBusinesses(prev => prev.map(item => item.id === b.id ? { ...item, name: v } : item));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 font-mono text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-400">Business Service Class</label>
                          <input
                            type="text"
                            readOnly
                            value={b.type}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs cursor-default font-mono text-slate-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-400">Public Contact Address Phone</label>
                          <input
                            type="text"
                            value={b.phone}
                            onChange={(e) => {
                              const v = e.target.value;
                              setBusinesses(prev => prev.map(item => item.id === b.id ? { ...item, phone: v } : item));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 font-mono text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-400">Regional Physical address</label>
                          <input
                            type="text"
                            value={b.address}
                            onChange={(e) => {
                              const v = e.target.value;
                              setBusinesses(prev => prev.map(item => item.id === b.id ? { ...item, address: v } : item));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 font-mono text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Advertising Bio Description</label>
                        <textarea
                          value={b.description}
                          onChange={(e) => {
                            const v = e.target.value;
                            setBusinesses(prev => prev.map(item => item.id === b.id ? { ...item, description: v } : item));
                          }}
                          className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-500 font-sans leading-relaxed text-slate-300"
                        />
                      </div>

                      {/* AI Branding helper widget for profile list completeness */}
                      <div className="bg-emerald-500/5 border border-[#10b981]/15 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-1.5 select-none font-mono">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <strong className="text-xs text-emerald-400 uppercase tracking-wider">Kora AI Branding Copywriter</strong>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed font-sans">Enter a few terms below to automatically draft copy slogans with coupons embedded:</p>
                        
                        <div className="flex gap-2 font-mono text-xs max-w-lg">
                          <input
                            type="text"
                            value={aiHeadlinePrompt}
                            onChange={(e) => setAiHeadlinePrompt(e.target.value)}
                            className="flex-grow bg-slate-950 border border-slate-800/80 rounded py-1 px-2.5 text-white"
                            placeholder="e.g. skin repair treatment, pilates"
                          />
                          <button
                            onClick={handleGenerateAIAd}
                            disabled={generatingAd}
                            className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded cursor-pointer"
                          >
                            {generatingAd ? 'Drafting...' : 'Generate Copy'}
                          </button>
                        </div>
                        {aiHeadlineResult && (
                          <div className="bg-slate-950/60 border border-slate-800 rounded p-3 select-all text-xs text-white italic font-serif leading-relaxed">
                            {aiHeadlineResult}
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}

              {/* CATALOG ITEMS SUBTAB */}
              {merchantSubSub === 'catalog' && (
                <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 select-none font-mono">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Unified Catalog & Offerings</span>
                      <p className="text-[10px] text-slate-500">Manage either treatment slots or physical retail items</p>
                    </div>
                    
                    {/* TABS SELECTOR */}
                    <div className="flex gap-1.5 bg-slate-950 border border-slate-850 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCatalogTab('services')}
                        className={`px-3 py-1 text-[10px] rounded font-bold uppercase transition-all ${
                          catalogTab === 'services'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ⏱ Services ({services.filter(s => s.businessId === selectedMerchantBiz).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatalogTab('products')}
                        className={`px-3 py-1 text-[10px] rounded font-bold uppercase transition-all ${
                          catalogTab === 'products'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        📦 Products ({products.filter(p => p.businessId === selectedMerchantBiz).length})
                      </button>
                    </div>
                  </div>

                  {catalogTab === 'services' ? (
                    <div className="space-y-4">
                      {/* List current services under selected business */}
                      <span className="text-[9px] uppercase tracking-widest font-mono text-slate-500 block">Active Service Catalog ({services.filter(s => s.businessId === selectedMerchantBiz).length})</span>
                      <div className="space-y-2 font-mono text-xs">
                        {services.filter(s => s.businessId === selectedMerchantBiz).map(s => (
                          <div key={s.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg flex items-center justify-between gap-4">
                            <div>
                              <strong className="text-sm text-slate-200 font-sans block leading-none">{s.name}</strong>
                              <span className="text-[10px] text-slate-500 mt-1 block">Tariff: <span className="text-teal-400 font-bold">₦{s.price.toLocaleString()}</span> · Duration: {s.duration} mins · Mode: {s.channel}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setServices(prev => prev.filter(item => item.id !== s.id))}
                              className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 border border-rose-500/25 text-rose-400 rounded text-[10px] transition-all font-mono cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Service form */}
                      <form onSubmit={handleCreateService} className="border-t border-slate-850 pt-4 space-y-4">
                        <span className="text-[11px] uppercase text-slate-400 tracking-wider font-mono block">Add New Catalog Service offering</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase text-slate-400">Offer Name</label>
                            <input
                              type="text"
                              value={newServiceName}
                              onChange={(e) => setNewServiceName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                              placeholder="e.g. Signature Dermal Sculpt"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase text-slate-400">Tariff NGN</label>
                            <input
                              type="number"
                              value={newServicePrice}
                              onChange={(e) => setNewServicePrice(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase text-slate-400">Duration in Minutes</label>
                            <input
                              type="number"
                              value={newServiceDuration}
                              onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase text-slate-400">Channel Mode</label>
                            <select
                              value={newServiceChannel}
                              onChange={(e) => setNewServiceChannel(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                            >
                              <option value="In-Person">In-Person at Studio</option>
                              <option value="Video Call">Telehealth Video consult</option>
                              <option value="Audio Consult">Audio consult</option>
                              <option value="Walk-in">Walk-in immediate slot</option>
                              <option value="Home Visit">Home visitation sweep</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-400">Detailed Description</label>
                          <input
                            type="text"
                            value={newServiceDesc}
                            onChange={(e) => setNewServiceDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-slate-200"
                            placeholder="Explain steps, benefits, outcomes, post-care recommendations..."
                          />
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#10b981] text-slate-950 font-bold font-mono text-xs rounded-lg hover:bg-emerald-400 transition-all cursor-pointer"
                        >
                          + Save & Publish Catalog offering
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Products list under business */}
                      <span className="text-[9px] uppercase tracking-widest font-mono text-slate-500 block">Active Retail Products ({products.filter(p => p.businessId === selectedMerchantBiz).length})</span>
                      <div className="space-y-2 font-mono text-xs">
                        {products.filter(p => p.businessId === selectedMerchantBiz).length > 0 ? (
                          products.filter(p => p.businessId === selectedMerchantBiz).map(p => (
                            <div key={p.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span className="text-xl shrink-0 select-none">{p.emoji}</span>
                                <div>
                                  <strong className="text-sm text-slate-200 font-sans block leading-none">{p.name}</strong>
                                  <span className="text-[10px] text-slate-500 mt-1 block">
                                    Price: <span className="text-teal-400 font-bold">₦{p.price.toLocaleString()}</span> · Stock: {p.stock} items left
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-0.5 font-sans leading-tight">{p.description}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setProducts(prev => prev.filter(item => item.id !== p.id))}
                                className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 border border-rose-500/25 text-rose-400 rounded text-[10px] transition-all font-mono cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 bg-slate-950/20 border border-slate-800/50 rounded-lg text-slate-500 text-xs">
                            No physical retail items registered for this tenant branch yet. Use the form below to list some!
                          </div>
                        )}
                      </div>

                      {/* Add Product form */}
                      <form onSubmit={handleCreateProduct} className="border-t border-slate-850 pt-4 space-y-4">
                        <span className="text-[11px] uppercase text-slate-400 tracking-wider font-mono block">List New Physical Product / Skin Care / Supplement SKU</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-2">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase text-slate-400">Product Name</label>
                            <input
                              type="text"
                              value={newProductName}
                              onChange={(e) => setNewProductName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                              placeholder="e.g. Pure Botanical Hair Restoration Dropper"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase text-slate-400">Retail price NGN</label>
                            <input
                              type="number"
                              value={newProductPrice}
                              onChange={(e) => setNewProductPrice(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase text-slate-400">Initial Stock Stockpile</label>
                            <input
                              type="number"
                              value={newProductStock}
                              onChange={(e) => setNewProductStock(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase text-slate-400">Product Image Icon Emoji</label>
                            <select
                              value={newProductEmoji}
                              onChange={(e) => setNewProductEmoji(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-white font-mono"
                            >
                              <option value="🌿">🌿 Botanical Extract</option>
                              <option value="🧴">🧴 Face Serum / Gel</option>
                              <option value="🧘">🧘 Organic Mat</option>
                              <option value="🧪">🧪 Clinical Test Kit</option>
                              <option value="🩺">🩺 Bio Link Wearable</option>
                              <option value="🎨">🎨 Tattoo Recovery Balm</option>
                              <option value="💈">💈 Styling Menthol Gel</option>
                              <option value="🏋️">🏋️ Shake Powder Mix</option>
                              <option value="🌸">🌸 Vitamins Bottle</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5 col-span-2">
                          <label className="text-[10px] font-mono uppercase text-slate-400">Product Features Short description</label>
                          <input
                            type="text"
                            value={newProductDesc}
                            onChange={(e) => setNewProductDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500 text-slate-200"
                            placeholder="State benefits, usage directions, certifications, organic ingredients list..."
                          />
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#10b981] text-slate-950 font-bold font-mono text-xs rounded-lg hover:bg-emerald-400 transition-all cursor-pointer"
                        >
                          + Save & Stock physical SKU
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* CLIENT BOOKINGS LEDGER SUBTAB */}
              {merchantSubSub === 'clients' && (
                <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center select-none font-mono">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Client Management & bookings ledger</span>
                    <span className="text-[10px] text-slate-500">Live active reservations</span>
                  </div>

                  {/* List bookings matching this business */}
                  {bookings.filter(b => b.businessName === businesses.find(bz => bz.id === selectedMerchantBiz)?.name).length > 0 ? (
                    <div className="space-y-2.5">
                      {bookings.filter(b => b.businessName === businesses.find(bz => bz.id === selectedMerchantBiz)?.name).map(bf => (
                        <div key={bf.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="text-sm font-sans text-white block leading-tight">{bf.clientName}</strong>
                              <span className="text-[10px] text-slate-500 font-mono">Service: <span className="text-slate-300 font-bold">{bf.serviceName}</span></span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              bf.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : bf.status === 'Completed' ? 'bg-slate-850 text-slate-400'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {bf.status}
                            </span>
                          </div>

                          <div className="border-t border-slate-900 pt-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                            <span>📅 Schedule: <strong className="text-slate-200">{bf.date} · {bf.time}</strong></span>
                            <span>💳 Ledger Value: <strong className="text-teal-400">₦{bf.price.toLocaleString()}</strong></span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                setBookings(prev => prev.map(b => b.id === bf.id ? { ...b, status: 'Approved' } : b));
                                alert("Appointment reservation approved successfully!");
                              }}
                              className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded text-[10px]"
                            >
                              Approve Booking
                            </button>
                            <button
                              onClick={() => {
                                setBookings(prev => prev.map(b => b.id === bf.id ? { ...b, status: 'Completed' } : b));
                                alert("Session completed and ticket finalized at POS ledger!");
                              }}
                              className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-emerald-400 rounded text-[10px]"
                            >
                              Complete & Invoice
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-600 font-mono text-xs bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                      <ClipboardList className="w-8 h-8 mx-auto text-slate-700 animate-pulse" />
                      <p>No active reservations registered for this business console currently.</p>
                    </div>
                  )}
                </div>
              )}

              {/* SUPPLY & INVENTORY PROCUREMENT SUBTAB */}
              {merchantSubSub === 'procurement' && (
                <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center select-none font-mono">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Supply & inventory records</span>
                    <span className="text-[10px] text-slate-500">Auto-Refill Threshold checks</span>
                  </div>

                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    HealthConnect SBOS triggers automatic procurement models the instant resource quantities dip below nominal safety thresholds. Avoid diagnostic or styling bottlenecks.
                  </p>

                  <div className="space-y-3 font-mono text-xs">
                    {inventory.filter(item => {
                      if (selectedMerchantBiz === 'biz-04' || selectedMerchantBiz === 'biz-05') return item.businessId === 'biz-04';
                      return item.businessId === 'biz-01';
                    }).map(item => {
                      const isLow = item.stock < item.minThreshold;

                      return (
                        <div key={item.id} className="p-3.5 bg-slate-950/40 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-sm font-sans text-slate-200">{item.name}</strong>
                              <span className="text-[9px] text-slate-500 uppercase bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">{item.category}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">Current Stock: <strong className={isLow ? 'text-rose-400 font-bold' : 'text-slate-300'}>{item.stock} units</strong> · Min Safety: {item.minThreshold}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isLow && (
                              <span className="text-[9px] font-bold text-rose-400 animate-pulse bg-rose-500/15 border border-rose-500/25 px-2 py-1 rounded">⚠️ REFILL NEEDED</span>
                            )}
                            <button
                              onClick={() => handleSimulateProcurement(item.id)}
                              className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-teal-400 text-xs rounded transition-all cursor-pointer"
                            >
                              Refill Stock (+50)
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STAFF SHIFTS & ROSTERS SUBTAB */}
              {merchantSubSub === 'hrm' && (
                <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center select-none font-mono">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Human Resource Shifts & logs</span>
                    <span className="text-[10px] text-slate-500">Checked-in status Rota</span>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {staff.map(st => (
                      <div key={st.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg flex items-center justify-between">
                        <div>
                          <strong className="text-sm font-sans text-white block leading-tight">{st.name}</strong>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">{st.role} · Shift Hours: {st.shift}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-1 rounded">
                            {st.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CRM CAMPAIGN & LEADS COCKPIT */}
              {merchantSubSub === 'marketing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Lead list */}
                  <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4 text-xs font-mono">
                    <span className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 block">CRM Lead Capture Log</span>
                    <div className="space-y-2">
                      {leads.map(ld => (
                        <div key={ld.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-1">
                          <div className="flex justify-between items-center">
                            <strong className="text-slate-200">{ld.name}</strong>
                            <span className="text-[9px] text-[#22c55e] font-bold bg-[#10b981]/10 px-1 rounded">{ld.score}% Hot</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{ld.email} · Interest in: {ld.interest}</p>
                          <span className="text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded font-bold border border-slate-800 inline-block mt-1">Status: {ld.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coupon generator */}
                  <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-3.5 text-xs font-mono">
                    <span className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 block">Active Coupons / Discounts generator</span>
                    
                    <form onSubmit={handleCreateCoupon} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 uppercase">Promo Code Text</label>
                        <input
                          type="text"
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2.5 text-white"
                          placeholder="e.g. SUMMER30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 uppercase">Discount Percentage</label>
                        <input
                          type="number"
                          value={newCouponPct}
                          onChange={(e) => setNewCouponPct(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2.5 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500">Domain scope restricts to:</label>
                        <select
                          value={newCouponDomain}
                          onChange={(e) => setNewCouponDomain(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded text-slate-300 py-1"
                        >
                          <option value="Selfcare">Selfcare Services only</option>
                          <option value="DigiCare">DigiCare Clinic only</option>
                          <option value="Universal">Universal entire SBOS</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-1.5 bg-emerald-500 text-slate-950 font-bold rounded cursor-pointer mt-2"
                      >
                        Create active Coupon code
                      </button>
                    </form>
                  </div>

                </div>
              )}

              {/* MAINTENANCE REQUEST LOG */}
              {merchantSubSub === 'maintenance' && (
                <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center select-none font-mono">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Business Facility & hardware Maintenance Logs</span>
                    <span className="text-[10px] text-slate-500">Logged tickets</span>
                  </div>

                  <p className="text-slate-400 text-xs font-sans">
                    Keep your clinic routers, diagnostic ECG sensors, massage reformers, or hair-styling setups maintained with automated help requests logged below.
                  </p>

                  <div className="space-y-2.5 font-mono text-xs">
                    {maintenance.map(mn => (
                      <div key={mn.id} className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-1.5">
                        <div className="flex justify-between items-center">
                          <strong className="text-sm underline text-slate-200">{mn.item}</strong>
                          <span className={`text-[9px] font-bold px-1.5 rounded ${
                            mn.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-500'
                          }`}>{mn.priority} PRIORITY</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed font-sans">{mn.desc}</p>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-900 text-[10px] text-slate-500">
                          <span>Origin: {mn.businessName}</span>
                          <span className="text-[#10b981] font-bold">Status: {mn.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FIELD WORK DISPATCH SYSTEM */}
              {merchantSubSub === 'field_work' && (
                <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center select-none font-mono">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">🚒 Home Visite & Mobile Field Dispatch</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/20 font-bold">Kora Dispatcher Active</span>
                  </div>

                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    Dispatch mobile therapists, home nursing assistants, physical trainers, or styling crews directly to client coordinates. Track ETA countdowns and spatial maps.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Active Jobs layout */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">Current Dispatch Route Logs</span>
                      {fieldJobs.map(job => (
                        <div key={job.id} className="p-3.5 bg-slate-950/40 border border-slate-805 rounded-xl space-y-2 font-mono text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="text-sm font-sans text-white block">{job.jobType}</strong>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Assigned to: <span className="text-emerald-400 font-bold">{job.workerName}</span></span>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                              job.status === 'Completed' ? 'bg-slate-800 text-slate-400'
                              : job.status === 'En Route' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            }`}>
                              {job.status}
                            </span>
                          </div>

                          <div className="border-t border-slate-900 pt-2 text-[11px] text-slate-400 space-y-1">
                            <div>📍 Address: <span className="text-slate-200 font-bold">{job.address}</span></div>
                            <div className="flex justify-between">
                              <span>🗺 Coordinates: <span className="text-slate-505">{job.coordinates}</span></span>
                              <span>⏱ ETA: <span className="text-amber-400 font-bold">{job.etaMinutes} mins</span></span>
                            </div>
                          </div>

                          {job.status !== 'Completed' && (
                            <div className="flex gap-1.5 pt-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setFieldJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'On Site', etaMinutes: 0 } : j));
                                  alert("Kora SBOS: Practitioner confirmed On-Site with patient/client.");
                                }}
                                className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-emerald-400 text-[10px] rounded cursor-pointer"
                              >
                                Mark On Site
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFieldJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Completed', etaMinutes: 0 } : j));
                                  alert("Kora SBOS: Field trip successfully completed and ticket checked.");
                                }}
                                className="px-2 py-1 bg-[#10b981]/15 border border-[#10b981]/25 text-[#10b981] text-[10px] rounded cursor-pointer"
                              >
                                Mark Completed
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* New Dispatch Form */}
                    <form onSubmit={handleCreateFieldJob} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3 text-xs font-mono">
                      <span className="text-[10px] uppercase tracking-widest text-[#10b981] block font-bold">Instantiate Emergency / Home Dispatch</span>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 uppercase">Field Job Type / Treatment</label>
                        <select
                          value={newJobType}
                          onChange={(e) => setNewJobType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2 text-white"
                        >
                          <option value="Home In-call Massage Harmony">💆 Home In-call Massage Harmony</option>
                          <option value="Mobile Nurse Post-natal Check">🩺 Mobile Nurse Post-natal Check</option>
                          <option value="Mobile Barber Grooming Call">💈 Mobile Barber Grooming Call</option>
                          <option value="Home visit Yoga Therapy session">🧘 Home visit Yoga Therapy session</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 uppercase">Assign Available On-Call Staff</label>
                        <select
                          value={newJobStaff}
                          onChange={(e) => setNewJobStaff(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2 text-white"
                        >
                          {staff.map(s => (
                            <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 uppercase">Destination Physical Coordinates/Address</label>
                        <input
                          type="text"
                          value={newJobAddress}
                          onChange={(e) => setNewJobAddress(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2 text-white"
                          placeholder="Plot 14, Penthouse W, Lagos"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-500 text-slate-950 font-bold font-mono text-xs rounded-lg hover:bg-emerald-400 cursor-pointer mt-1"
                      >
                        🚀 Dispatch Field Crew Location
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* PERFORMANCE REPORTS & CAPACITY ANALYTICS */}
              {merchantSubSub === 'analytics' && (
                <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center select-none font-mono">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">📈 Performance analytics & Forecaster</span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20 font-mono">Real-Time Data Active</span>
                  </div>

                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    Visual diagnostic feedback for multi-tenant billing models, active branch capacity limits, and AI forecasted revenue loops.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    {/* Capacity indicators */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase block">Active Shift Capacity Warnings</span>
                      <div className="text-xl font-bold text-slate-200">78% Utilized</div>
                      <div className="bg-amber-400/10 border border-amber-400/20 p-2 rounded text-[10px] text-amber-300 leading-tight">
                        ⚠️ Alert: High demand expected during upcoming Lagos holiday weekend. Encourage clients to book remote consults or walk-in offpeak.
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase block">Patient/Client Satisfaction Key</span>
                      <div className="text-xl font-bold text-[#10b981]">★ 4.93 / 5.00</div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">Derived across {businesses.map(b=>b.reviews).reduce((a,b)=>a+b, 0)} certified reviews globally.</p>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase block">Database Sandboxing Health</span>
                      <div className="text-xl font-bold text-[#10b981]">● Isolated Green</div>
                      <div className="text-[10px] text-slate-400 space-y-0.5">
                        <div>Latency: <span className="text-slate-200">8.2ms query</span></div>
                        <div>tenant Guard: <span className="text-slate-200">Active Row-Level</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue forecasting SVG */}
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">SBOS Dynamic Revenue & Commission Forecast Model (NGN)</span>
                    <div className="h-28 flex items-end justify-between gap-4 pt-4 border-b border-slate-800 max-w-lg mx-auto font-mono text-[9px] text-slate-500">
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-white">₦420k</div>
                        <div className="w-full bg-slate-800 hover:bg-slate-700 transition-[height,background] rounded-t" style={{ height: '35px' }} />
                        <span>Apr (Real)</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-white">₦580k</div>
                        <div className="w-full bg-[#10b981]/50 hover:bg-[#10b981] transition-[height,background] rounded-t" style={{ height: '55px' }} />
                        <span>May (Real)</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-emerald-400 font-bold">₦850k</div>
                        <div className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t animate-pulse" style={{ height: '80px' }} />
                        <span className="font-bold text-slate-400">Jun (AI Goal)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SMART BLOG COMPOSER */}
              {merchantSubSub === 'blog' && (
                <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center select-none font-mono">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">📰 Core specialist blog composer</span>
                    <span className="text-[10px] text-slate-500">Partner Authority Publishing</span>
                  </div>

                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    Write high-quality care advice, wellness guidelines, hairstyle looks, and pilates regimes. Educated advisors and certified practitioners gain instant discoverability.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Create Form */}
                    <form onSubmit={handleCreateBlog} className="space-y-3 text-xs font-mono bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                      <span className="text-[10px] uppercase text-[#10b981] tracking-widest block font-bold">Draft specialist advisory</span>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 uppercase">Article Title Header</label>
                        <input
                          type="text"
                          value={newBlogTitle}
                          onChange={(e) => setNewBlogTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 px-2.5 text-white"
                          placeholder="e.g. 3 Scalp Oils preventing Pre-natal Alopecia"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 col-span-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500">Subject Category</label>
                          <select
                            value={newBlogCategory}
                            onChange={(e) => setNewBlogCategory(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded text-slate-300 py-1 px-2"
                          >
                            <option value="Selfcare">Selfcare & Skincare Advice</option>
                            <option value="Digital Health">Digital Health Care / Clinical Guidance</option>
                            <option value="Lifestyle">Lifestyle Gym & Pilates Wisdom</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500">Detailed Short summary advice content</label>
                        <textarea
                          value={newBlogSummary}
                          onChange={(e) => setNewBlogSummary(e.target.value)}
                          className="w-full h-20 bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                          placeholder="Write key steps, evidence, and professional recommendations with dynamic readability..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-bold rounded cursor-pointer transition-all"
                      >
                        Publish Specialist Article
                      </button>
                    </form>

                    {/* Dynamic feed of current logs */}
                    <div className="space-y-3 text-xs font-mono">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Your Published Articles</span>
                      <div className="space-y-2">
                        {blogs.map(art => (
                          <div key={art.id} className="p-3 bg-slate-950/30 border border-slate-800/80 rounded-lg space-y-1">
                            <div className="flex justify-between items-start gap-1">
                              <strong className="text-slate-200 hover:text-white leading-tight font-sans text-sm block">{art.title}</strong>
                              <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">{art.status}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{art.summary}</p>
                            <div className="flex justify-between text-[9px] text-slate-500 pt-1.5 border-t border-slate-900 font-mono">
                              <span>By: {art.author}</span>
                              <span className="font-bold text-teal-400">⏱ {art.reads} Active Reads</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* FINANCE LEDGER, COMMISSION SPLITTING & POS */}
              {merchantSubSub === 'finance' && (
                <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center select-none font-mono">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">🏦 Finance payouts, performance & split POS ledger</span>
                    <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-bold uppercase tracking-wide">Liquidity settlement live</span>
                  </div>

                  <p className="text-slate-400 text-xs font-sans leading-relaxed">
                    View real-time direct checkout ledger values, platform transactional fee escrows (5% automated split via system gateways), and dynamic commission or flat rate compensation.
                  </p>

                  {/* Financial KPI board */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs text-left">
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Total Gross Sales</span>
                      <div className="text-xl font-extrabold text-white mt-1">₦{
                        (bookings.filter(b => b.status === 'Completed' || b.status === 'Approved').map(b=>b.price).reduce((a,b)=>a+b, 0) +
                        products.filter(p=>p.businessId === selectedMerchantBiz).map(p=>p.price * 4).reduce((a,b)=>a+b, 0)).toLocaleString()
                      }</div>
                      <span className="text-[9px] text-[#10b981] block mt-1">Sum of completed services & product sales</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                      <span className="text-[10px] text-slate-300 uppercase block font-bold">Platform Transaction Split</span>
                      <div className="text-xl font-extrabold text-teal-400 mt-1">₦{
                        ((bookings.filter(b => b.status === 'Completed' || b.status === 'Approved').map(b=>b.price).reduce((a,b)=>a+b, 0) +
                        products.filter(p=>p.businessId === selectedMerchantBiz).map(p=>p.price * 4).reduce((a,b)=>a+b, 0)) * 0.05).toLocaleString()
                      }</div>
                      <span className="text-[9px] text-slate-500 block mt-1">5% automatic platform service fee split active</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                      <span className="text-[10px] text-[#10b981] uppercase block font-bold">Payouts ready on Paystack</span>
                      <div className="text-xl font-extrabold text-emerald-400 mt-1">₦{
                        ((bookings.filter(b => b.status === 'Completed' || b.status === 'Approved').map(b=>b.price).reduce((a,b)=>a+b, 0) +
                        products.filter(p=>p.businessId === selectedMerchantBiz).map(p=>p.price * 4).reduce((a,b)=>a+b, 0)) * 0.95).toLocaleString()
                      }</div>
                      <span className="text-[9px] text-slate-500 block mt-1">Net instant payout balance cleared</span>
                    </div>
                  </div>

                  {/* Multi-tenant payroll structure */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Pay structure explains details */}
                    <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold font-semibold">Dynamic performance compensation models</span>
                      
                      <div className="space-y-2.5 font-sans leading-relaxed text-slate-300">
                        <div className="flex gap-2 items-start">
                          <span className="text-emerald-400 font-mono font-bold select-none">1.</span>
                          <div>
                            <strong className="text-slate-200">Lifestyle Selfcare Commissions:</strong> 
                            <p className="text-[11px] text-slate-400">Hair Stylists, Yoga Instructors, and Tattoo Artists earn a performance commission (typically 20% on booking slot tickets). High ticket volumes trigger bonus multipliers.</p>
                          </div>
                        </div>

                        <div className="flex gap-2 items-start">
                          <span className="text-cyan-400 font-mono font-bold select-none">2.</span>
                          <div>
                            <strong className="text-slate-200">DigiCare Clinical Flat Rates:</strong> 
                            <p className="text-[11px] text-slate-400">Licensed Doctors and on-site Nurses receive professional, guaranteed hourly or flat session rates (regulated HIPAA compliance) to maintain service delivery margins.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive POS Checkout Simulator */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                      <span className="text-[10px] text-slate-500 uppercase block font-bold">Instant POS Checkout Terminal</span>
                      <p className="text-slate-400 text-[11px]">Simulate physical payments on walk-in tickets with instant digital receipt dispatching.</p>
                      
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Selected branch:</span>
                          <span className="text-white font-bold">{businesses.find(b=>b.id === selectedMerchantBiz)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Calculated Paystack Fee:</span>
                          <span className="text-pink-400 font-bold">₦{((bookings.filter(b => b.businessName === businesses.find(bz => bz.id === selectedMerchantBiz)?.name).map(bf=>bf.price).reduce((a,b)=>a+b, 0)) * 0.015).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-400 border-t border-slate-805 pt-1.5 border-dashed">
                          <span>Instantly Settled Total:</span>
                          <span>₦{(bookings.filter(b => b.businessName === businesses.find(bz => bz.id === selectedMerchantBiz)?.name).map(bf=>bf.price).reduce((a,b)=>a+b, 0)).toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => alert("POS Transaction synchronized with Central Tax Audit Ledger & Paystack escrow API hook!")}
                        className="w-full py-1.5 bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs rounded transition-all cursor-pointer"
                      >
                        Confirm Instant Card Swipe POS
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* PERSPECTIVE C: ADMIN PORTAL (See All, Global Ledgers, Audits) */}
      {/* ========================================================= */}
      {activeRole === 'admin' && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* Admin KPI Board */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-4.5 space-y-1 relative overflow-hidden select-none">
              <div className="absolute right-3 top-3 opacity-10"><DollarSign className="w-8 h-8 text-emerald-400" /></div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Global Platform Settled Tariffs</span>
              <strong className="text-xl font-bold font-mono text-white block">₦4.8M <span className="text-xs text-slate-500">MRR</span></strong>
              <div className="text-[10px] text-[#10b981] font-mono">↑ 22% monthly growth</div>
            </div>

            <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-4.5 space-y-1 relative overflow-hidden select-none">
              <div className="absolute right-3 top-3 opacity-10"><Briefcase className="w-8 h-8 text-cyan-400" /></div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Registered Platform Tenants</span>
              <strong className="text-xl font-bold font-mono text-white block">{businesses.length} active</strong>
              <div className="text-[10px] text-[#10b981] font-mono">Selfcare / DigiCare unified</div>
            </div>

            <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-4.5 space-y-1 relative overflow-hidden select-none">
              <div className="absolute right-3 top-3 opacity-10"><Activity className="w-8 h-8 text-purple-400" /></div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Uptime latency (30 days)</span>
              <strong className="text-xl font-bold font-mono text-white block">99.98%</strong>
              <div className="text-[10px] text-emerald-400 font-mono">SIEM Active compliance Nominal</div>
            </div>

            <div className="bg-[#070c17]/95 border border-slate-800 rounded-xl p-4.5 space-y-1 relative overflow-hidden select-none">
              <div className="absolute right-3 top-3 opacity-10"><Users className="w-8 h-8 text-pink-400" /></div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Global Active Client pool</span>
              <strong className="text-xl font-bold font-mono text-white block">2,480 users</strong>
              <div className="text-[10px] text-[#10b981] font-mono">142 clinics linked</div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Global Tenants directory for admin overrides */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white">Platform Tenant Overlook list (Global directory)</h3>
                <span className="text-xs font-mono text-[#10b981]">Conforming checks secure</span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                {businesses.map(b => {
                  const bServices = services.filter(s => s.businessId === b.id);
                  const bStaff = staff.filter(s => s.businessId === b.id);

                  return (
                    <div key={b.id} className="p-4 bg-[#070c17]/95 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base">{b.featuredImg}</span>
                          <strong className="text-sm font-sans text-white">{b.name}</strong>
                          <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 text-[9px] rounded uppercase font-bold">{b.type}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">Listed services: {bServices.length} items · staff shifts active: {bStaff.length || 'On-Call Pools'}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setActiveRole('merchant');
                            setSelectedMerchantBiz(b.id);
                          }}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-200 rounded text-[10px]"
                        >
                          Configure Tenant
                        </button>
                        <button
                          onClick={() => {
                            setBusinesses(prev => prev.filter(item => item.id !== b.id));
                            alert("Tenant platform registration suspended successfully!");
                          }}
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500 border border-red-500/25 text-red-400 hover:text-white rounded text-[10px] transition-all"
                        >
                          Suspend Tenant
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Control & Ledger parameters */}
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white">Universal Audit certifications</h3>
              </div>

              <div className="bg-[#070c17]/95 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs font-mono select-none">
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                    <div>
                      <strong className="text-emerald-400 font-bold block leading-tight">ISO 27001 System Conformity</strong>
                      <span className="text-[10px] text-slate-500">Auto-audit checked today</span>
                    </div>
                    <span className="text-[9px] bg-[#10b981] text-slate-950 px-1 py-0.5 rounded font-bold font-mono">CONFORMING</span>
                  </div>

                  <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg flex items-center justify-between">
                    <div>
                      <strong className="text-cyan-400 font-bold block leading-tight">HIPAA Telehealth Encryption</strong>
                      <span className="text-[10px] text-slate-500">Live consult encryption tunnels</span>
                    </div>
                    <span className="text-[9px] bg-cyan-400 text-slate-950 px-1 py-0.5 rounded font-bold font-mono">VERIFIED ENCR</span>
                  </div>

                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg flex items-center justify-between">
                    <div>
                      <strong className="text-purple-400 font-bold block leading-tight">Multi-Tenant isolated queries</strong>
                      <span className="text-[10px] text-slate-500">Spanner RLS Gateway checked</span>
                    </div>
                    <span className="text-[9px] bg-purple-400 text-slate-950 px-1 py-0.5 rounded font-bold font-mono">ACTIVE ISOLATION</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans space-y-2">
                  <p>
                    🛡️ <strong>Global Admin Authority active</strong>. As a Platform administrator, you manage the unified catalog scope and track sales commissions across Paystack payouts.
                  </p>
                  <button
                    onClick={() => onModuleRoute && onModuleRoute('trust_security', 'security')}
                    className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-200 font-mono text-center text-xs rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    Launch CISO Forensic Security Ledger →
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* CLIENT BOOKING SYSTEM MODAL CONTROL */}
      {/* ========================================================= */}
      {bookModalOpen && selectedServiceToBook && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in text-xs font-mono">
          <div className="bg-[#090f1e] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl relative">
            
            <div className="p-5 border-b border-slate-800/80 bg-[#0a1224]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-500/10 rounded border border-teal-500/25 text-teal-400">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left font-sans">
                  <strong className="text-sm font-bold text-white block">Schedule Care Booking</strong>
                  <span className="text-[10px] text-slate-400">Securing your care reservation</span>
                </div>
              </div>
              <button
                onClick={() => setBookModalOpen(false)}
                className="p-1 px-2 hover:bg-slate-800 text-slate-400 rounded cursor-pointer text-xs"
              >
                ESC Cancel
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 select-none">
                <div>
                  <span className="text-[9px] text-[#22c55e] uppercase tracking-widest font-black block">Service details</span>
                  <strong className="text-sm text-white font-sans">{selectedServiceToBook.name}</strong>
                  <span className="text-slate-500 block mt-1">Duration: {selectedServiceToBook.duration} mins · Mode: {selectedServiceToBook.channel}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-400">Ledger Tariff rate:</span>
                  <strong className="text-teal-400 text-sm">₦{selectedServiceToBook.price.toLocaleString()}</strong>
                </div>
              </div>

              {bookedSuccessMsg ? (
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 text-center space-y-1.5 animate-fade-in text-emerald-400">
                  <Check className="w-8 h-8 mx-auto text-emerald-400 animate-bounce" />
                  <strong className="text-xs font-bold uppercase block">Booking approved successfully!</strong>
                  <p className="text-[10px] text-slate-400 font-sans">Slot reserved. Automatically logged to Dr. / Stylist check-in shifts pool.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase">Set Date</label>
                    <input type="date" defaultValue="2026-06-05" className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase">Choose Time Slot</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs focus:outline-none">
                      <option>10:00 AM</option>
                      <option>11:00 AM</option>
                      <option>12:30 PM</option>
                      <option>02:00 PM</option>
                      <option>04:15 PM</option>
                    </select>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-2">
                    🚨 <strong>HIPAA & SecOps verification</strong>: Your data is isolated using Spanner Row-level constraints. Standard cancellation requires at least 48 hours notice.
                  </p>

                  <button
                    onClick={handleBookService}
                    className="w-full py-2.5 bg-teal-500 text-slate-950 font-bold font-mono text-xs rounded-lg hover:bg-teal-400 transition-all cursor-pointer"
                  >
                    Confirm Care Reservation Slot
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
