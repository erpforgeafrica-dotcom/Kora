import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const TEAL = "#00e5c8";
const AMBER = "#f59e0b";
const PURPLE = "#a78bfa";
const DANGER = "#ef4444";
const BG = "#0b0d13";
const SURFACE = "#0f1119";
const CARD = "#141720";
const BORDER = "#1e2235";
const TEXT = "#edf0ff";
const MUTED = "#565d82";
const SEC = "#8b92b8";

type ModuleFeature = { name: string; icon: string; detail: string };
type ModuleStat = { label: string; value: string; sub: string };
type ModuleConfig = {
  id: string;
  route: string;
  label: string;
  accent: string;
  icon: string;
  tagline: string;
  desc: string;
  features: ModuleFeature[];
  stats: ModuleStat[];
};

const modules: ModuleConfig[] = [
  {
    id: "client",
    route: "/app/client",
    label: "Client Portal",
    accent: TEAL,
    icon: "◈",
    tagline: "Your complete care & service hub",
    desc: "Book services, manage health records, track loyalty, and connect with providers from one intelligent client experience.",
    features: [
      { name: "Smart Booking Engine", icon: "◈", detail: "AI suggests the best time slots, staff, and services based on history and preferences." },
      { name: "Health Profile", icon: "◇", detail: "Secure records, insurance details, documents, and telehealth context in one place." },
      { name: "Loyalty Intelligence", icon: "△", detail: "Personalised tiers, rewards, referrals, and behaviour-based offers." },
      { name: "Payments & Wallet", icon: "◐", detail: "Saved methods, subscriptions, invoices, and multi-currency wallet history." }
    ],
    stats: [
      { label: "Avg booking time", value: "23s", sub: "with AI autofill" },
      { label: "No-show reduction", value: "67%", sub: "via smart reminders" },
      { label: "Client retention", value: "94%", sub: "loyalty-driven" }
    ]
  },
  {
    id: "business",
    route: "/app/business-admin",
    label: "Business Command",
    accent: AMBER,
    icon: "◇",
    tagline: "Run your entire operation from one surface",
    desc: "Revenue intelligence, booking management, staff oversight, inventory, and AI-powered growth insights in one command centre.",
    features: [
      { name: "Revenue Intelligence", icon: "◈", detail: "Real-time revenue by service, staff, location, and period with anomaly surfacing." },
      { name: "Booking Calendar", icon: "◇", detail: "Multi-staff scheduling with conflict resolution, waitlists, and capacity optimisation." },
      { name: "CRM & Loyalty", icon: "◉", detail: "Churn prediction, engagement scoring, loyalty automation, and referral tracking." },
      { name: "Payment Orchestration", icon: "◆", detail: "Multi-gateway routing, reconciliation, refunds, and financial health visibility." }
    ],
    stats: [
      { label: "Revenue visibility", value: "100%", sub: "real-time, multi-site" },
      { label: "Utilisation lift", value: "+38%", sub: "AI scheduling" },
      { label: "Inventory waste cut", value: "−44%", sub: "auto-deduction" }
    ]
  },
  {
    id: "staff",
    route: "/app/staff",
    label: "Staff Workspace",
    accent: PURPLE,
    icon: "◉",
    tagline: "Every tool your team needs. Nothing they don't.",
    desc: "Appointments, tasks, navigation, customer context, and inventory usage in a focused execution workspace.",
    features: [
      { name: "Smart Schedule", icon: "◈", detail: "Daily schedule with AI priority ordering, buffers, and live change handling." },
      { name: "Customer Context", icon: "◇", detail: "History, preferences, notes, and health flags surfaced before each appointment." },
      { name: "Task Management", icon: "▲", detail: "Assigned task queues, completion checklists, and sign-off capture." },
      { name: "Performance View", icon: "◆", detail: "Personal ratings, review history, and productivity metrics." }
    ],
    stats: [
      { label: "Admin time saved", value: "3.2h", sub: "per staff per day" },
      { label: "Field accuracy", value: "99.1%", sub: "GPS-verified jobs" },
      { label: "SOAP auto-generation", value: "82%", sub: "draft accuracy" }
    ]
  },
  {
    id: "operations",
    route: "/app/operations",
    label: "Operations Centre",
    accent: DANGER,
    icon: "△",
    tagline: "Real-time control of everything, everywhere",
    desc: "Live booking feeds, emergency dispatch, staff monitoring, SLA tracking, and AI anomaly detection in the nerve centre of your operation.",
    features: [
      { name: "Live Operations Feed", icon: "◈", detail: "Severity-ordered stream of bookings, dispatches, incidents, and system events." },
      { name: "Dispatch Console", icon: "◇", detail: "One-click resource assignment, proximity matching, and escalation management." },
      { name: "Staff Location Map", icon: "◉", detail: "Live positions, job overlays, availability states, and ETA tracking." },
      { name: "Payment Incident Watch", icon: "◆", detail: "Real-time failures, fraud signals, refund queues, and gateway health." }
    ],
    stats: [
      { label: "Avg response time", value: "41s", sub: "emergency dispatch" },
      { label: "Incident auto-resolve", value: "73%", sub: "AI-routed" },
      { label: "SLA compliance", value: "98.6%", sub: "platform-wide" }
    ]
  },
  {
    id: "admin",
    route: "/app/kora-admin",
    label: "Platform Admin",
    accent: PURPLE,
    icon: "◎",
    tagline: "The master control layer for the entire ecosystem",
    desc: "Tenant management, global billing, AI oversight, security monitoring, and platform-wide configuration in one root console.",
    features: [
      { name: "Tenant Health", icon: "◈", detail: "Snapshots with revenue, activity, anomalies, and churn risk across tenants." },
      { name: "Global Billing", icon: "◇", detail: "Plans, billing cycles, provider health, and dunning workflows." },
      { name: "RBAC & Access", icon: "△", detail: "Role matrix, API key management, webhook configuration, and audit trails." },
      { name: "Feature Flags", icon: "◐", detail: "Global and per-tenant feature enablement with instant rollout control." }
    ],
    stats: [
      { label: "Tenant onboarding", value: "< 4min", sub: "automated setup" },
      { label: "Platform uptime", value: "99.97%", sub: "SLA guaranteed" },
      { label: "Audit coverage", value: "100%", sub: "every action logged" }
    ]
  }
];

const aiCapabilities = [
  { label: "No-show prediction", accuracy: 82, accent: TEAL, icon: "◈" },
  { label: "Demand forecasting", accuracy: 78, accent: AMBER, icon: "◇" },
  { label: "Churn detection", accuracy: 85, accent: PURPLE, icon: "◉" },
  { label: "Revenue anomaly", accuracy: 91, accent: DANGER, icon: "△" }
];

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

function StatCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const count = useCountUp(value);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function hex2rgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export function LandingPage() {
  const [activeModule, setActiveModule] = useState("client");
  const [activeFeature, setActiveFeature] = useState(0);
  const [navVisible, setNavVisible] = useState(false);
  const current = modules.find((module) => module.id === activeModule) ?? modules[0];

  useEffect(() => {
    const onScroll = () => setNavVisible(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "'Courier New', monospace", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .kora-display { font-family: 'Playfair Display', Georgia, serif !important; }
        .kora-mono { font-family: 'DM Mono', 'Courier New', monospace !important; }
        .nav-fixed { position: fixed; top: 0; left: 0; right: 0; z-index: 100; transition: all 200ms ease; }
        .nav-scrolled { background: rgba(11,13,19,0.92) !important; backdrop-filter: blur(20px); border-bottom: 1px solid ${BORDER}; }
        .hero-grain { position: absolute; inset: 0; pointer-events: none; z-index: 1; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); opacity: 0.55; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes orbitPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,229,200,0.4); } 50% { box-shadow: 0 0 0 12px rgba(0,229,200,0); } }
        @keyframes progressFill { from { width: 0%; } to { width: var(--target-width); } }
        .live-dot { animation: orbitPulse 2s infinite; }
        .module-card { transition: all 160ms ease; cursor: pointer; }
        .module-card:hover { transform: translateY(-2px); }
        .feature-item { transition: all 140ms ease; cursor: pointer; }
        .feature-item:hover { background: rgba(255,255,255,0.04) !important; }
        .cta-primary { transition: all 160ms ease; cursor: pointer; }
        .cta-primary:hover { transform: translateY(-1px); filter: brightness(1.08); }
        .ai-bar { animation: progressFill 1.2s cubic-bezier(0.4,0,0.2,1) forwards; }
        @media (max-width: 980px) { .hero-grid, .platform-grid, .module-shell, .ai-grid, .pricing-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <nav className={`nav-fixed ${navVisible ? "nav-scrolled" : ""}`} style={{ padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />
          <span className="kora-display" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.05em" }}>K<span style={{ color: TEAL }}>Ó</span>RA</span>
        </div>
        <div className="kora-mono" style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {["Platform", "Modules", "AI Engine", "Pricing"].map((item) => <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} style={{ fontSize: 11, letterSpacing: "0.12em", color: SEC, textDecoration: "none" }}>{item.toUpperCase()}</a>)}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/app" style={{ background: "transparent", border: `1px solid ${BORDER}`, color: SEC, padding: "7px 18px", borderRadius: 6, fontSize: 11, letterSpacing: "0.1em", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>LOG IN</Link>
          <Link to="/app/client/book" className="cta-primary" style={{ background: TEAL, color: BG, padding: "7px 18px", borderRadius: 6, fontSize: 11, letterSpacing: "0.1em", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>START FREE</Link>
        </div>
      </nav>

      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "120px 60px 80px", position: "relative", overflow: "hidden" }}>
        <div className="hero-grain" />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 50% at 10% 50%, rgba(0,229,200,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 90% 20%, rgba(167,139,250,0.05) 0%, transparent 60%), radial-gradient(ellipse 30% 30% at 80% 80%, rgba(245,158,11,0.04) 0%, transparent 60%)" }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,229,200,0.08)", border: "1px solid rgba(0,229,200,0.2)", borderRadius: 4, padding: "5px 12px", marginBottom: 28 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: TEAL, animation: "blink 1.5s infinite" }} />
                <span className="kora-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: TEAL, fontWeight: 500 }}>INTELLIGENT OPERATIONS PLATFORM · LIVE</span>
              </div>
              <h1 className="kora-display" style={{ fontSize: "clamp(42px, 5vw, 68px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.02em", marginBottom: 24 }}>
                Every part of<br />your operation,<br />
                <span style={{ background: `linear-gradient(135deg, ${TEAL}, ${TEAL}aa)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>orchestrated.</span>
              </h1>
              <p className="kora-mono" style={{ fontSize: 14, color: SEC, lineHeight: 1.8, maxWidth: 500, marginBottom: 36 }}>
                KÓRA unifies booking, clinical workflows, emergency dispatch, staff execution, inventory, and financial intelligence into one AI-powered command surface.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link to="/app/client/book" className="cta-primary" style={{ background: TEAL, color: BG, padding: "14px 28px", borderRadius: 8, fontSize: 12, letterSpacing: "0.1em", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>START YOUR COMMAND CENTRE →</Link>
                <Link to="/app/operations" className="cta-primary" style={{ background: "transparent", border: `1px solid ${BORDER}`, color: SEC, padding: "14px 24px", borderRadius: 8, fontSize: 12, letterSpacing: "0.1em", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>OPEN OPERATIONS ▶</Link>
              </div>
              <div style={{ display: "flex", gap: 32, marginTop: 40, flexWrap: "wrap" }}>
                {[
                  { label: "Bookings today", val: 12847, suffix: "", prefix: "" },
                  { label: "Active businesses", val: 892, suffix: "+", prefix: "" },
                  { label: "Revenue processed", val: 847293, suffix: "", prefix: "$" }
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="kora-display" style={{ fontSize: 22, fontWeight: 700 }}><StatCounter value={stat.val} suffix={stat.suffix} prefix={stat.prefix} /></div>
                    <div className="kora-mono" style={{ fontSize: 9, color: MUTED, letterSpacing: "0.12em", marginTop: 2 }}>{stat.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", boxShadow: `0 40px 80px rgba(0,0,0,0.4), 0 0 0 1px ${BORDER}` }}>
              <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 5 }}>{[DANGER, AMBER, TEAL].map((color, index) => <div key={index} style={{ width: 7, height: 7, borderRadius: "50%", background: color, opacity: 0.7 }} />)}</div>
                <span className="kora-mono" style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em", marginLeft: 6 }}>KÓRA · OPERATIONS COMMAND</span>
              </div>
              <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Revenue Today", value: "₦847K", delta: "+12%", accent: TEAL },
                  { label: "Active Bookings", value: "143", delta: "+8", accent: AMBER },
                  { label: "Emergency Active", value: "2", delta: "CRITICAL", accent: DANGER }
                ].map((kpi) => (
                  <div key={kpi.label} style={{ background: BG, borderRadius: 8, border: `1px solid ${BORDER}`, padding: "10px 12px" }}>
                    <div className="kora-mono" style={{ fontSize: 8, color: MUTED, marginBottom: 4, letterSpacing: "0.1em" }}>{kpi.label.toUpperCase()}</div>
                    <div className="kora-display" style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{kpi.value}</div>
                    <div className="kora-mono" style={{ fontSize: 8, color: kpi.accent, fontWeight: 700 }}>{kpi.delta}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(0,229,200,0.04)", border: "1px solid rgba(0,229,200,0.15)" }}>
                  <div className="kora-mono" style={{ fontSize: 8, color: TEAL, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>AI INSIGHT · 94% CONFIDENCE</div>
                  <p className="kora-mono" style={{ fontSize: 9, color: SEC, lineHeight: 1.6 }}>Peak demand window in 2h. 4 staff slots under-covered. Recommend activating standby team.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" style={{ padding: "100px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="kora-mono" style={{ fontSize: 9, letterSpacing: "0.25em", color: TEAL, marginBottom: 14 }}>00 · WHAT IS KÓRA</div>
          <h2 className="kora-display" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 700, lineHeight: 1.15, marginBottom: 20 }}>One platform.<br /><em style={{ fontStyle: "italic", color: SEC }}>Every vertical you operate in.</em></h2>
          <p className="kora-mono" style={{ fontSize: 13, color: SEC, lineHeight: 1.9, maxWidth: 620, margin: "0 auto" }}>KÓRA is not a booking tool. It is not an EHR. It is not a dispatch system. It is all three — plus the financial intelligence that connects them.</p>
        </div>
        <div className="platform-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {[
            { num: "01", title: "Service & Wellness", accent: TEAL, desc: "Bookings, CRM, loyalty, telehealth, and financial reconciliation for service businesses.", verticals: ["Spa & Salon", "Gym & Fitness", "Wellness Clinic", "Home Services"] },
            { num: "02", title: "Clinical & Healthcare", accent: AMBER, desc: "Patient records, SOAP notes, prescriptions, compliance tracking, and inventory in one clinical surface.", verticals: ["General Practice", "Specialist Clinics", "Diagnostics Labs", "Pharmacy"] },
            { num: "03", title: "Emergency & Dispatch", accent: DANGER, desc: "Incident management, GPS dispatch, response queues, SLA monitoring, and post-incident audit trails.", verticals: ["Ambulance Services", "Security Response", "Field Operations", "Crisis Management"] }
          ].map((value, index) => (
            <div key={value.title} style={{ background: CARD, padding: "40px 32px", borderLeft: index === 0 ? "none" : `1px solid ${BORDER}`, position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: value.accent }} />
              <div className="kora-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: value.accent, marginBottom: 16 }}>{value.num}</div>
              <h3 className="kora-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 14 }}>{value.title}</h3>
              <p className="kora-mono" style={{ fontSize: 11, color: SEC, lineHeight: 1.8, marginBottom: 24 }}>{value.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {value.verticals.map((vertical) => (
                  <div key={vertical} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 3, height: 3, borderRadius: "50%", background: value.accent }} />
                    <span className="kora-mono" style={{ fontSize: 10, color: MUTED }}>{vertical}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="modules" style={{ padding: "100px 0", background: SURFACE, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 60px" }}>
          <div style={{ marginBottom: 48 }}>
            <div className="kora-mono" style={{ fontSize: 9, letterSpacing: "0.25em", color: TEAL, marginBottom: 12 }}>01 · FIVE DASHBOARDS. EVERY ROLE.</div>
            <h2 className="kora-display" style={{ fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 700, lineHeight: 1.15 }}>Role-built.<br /><em style={{ color: SEC }}>AI-powered throughout.</em></h2>
          </div>

          <div style={{ display: "flex", gap: 2, marginBottom: 1, overflowX: "auto" }}>
            {modules.map((module) => (
              <button key={module.id} onClick={() => { setActiveModule(module.id); setActiveFeature(0); }} className="module-card" style={{ background: activeModule === module.id ? module.accent : CARD, border: "none", padding: "14px 22px", color: activeModule === module.id ? BG : SEC, fontFamily: "inherit", fontSize: 10, letterSpacing: "0.12em", fontWeight: activeModule === module.id ? 700 : 400, whiteSpace: "nowrap", borderBottom: activeModule === module.id ? `2px solid ${module.accent}` : "2px solid transparent" }}>
                <span style={{ marginRight: 6 }}>{module.icon}</span>{module.label.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `2px solid ${current.accent}` }}>
            <div className="module-shell" style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: 460 }}>
              <div style={{ borderRight: `1px solid ${BORDER}`, padding: "28px 0" }}>
                <div style={{ padding: "0 24px 20px" }}>
                  <div className="kora-mono" style={{ fontSize: 8, letterSpacing: "0.2em", color: current.accent, marginBottom: 6 }}>{current.route}</div>
                  <div className="kora-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{current.label}</div>
                  <div className="kora-mono" style={{ fontSize: 10, color: current.accent, marginBottom: 10 }}>{current.tagline}</div>
                  <p className="kora-mono" style={{ fontSize: 10, color: SEC, lineHeight: 1.7 }}>{current.desc}</p>
                </div>
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
                  {current.features.map((feature, index) => (
                    <div key={feature.name} className="feature-item" onClick={() => setActiveFeature(index)} style={{ padding: "11px 24px", borderLeft: `2px solid ${index === activeFeature ? current.accent : "transparent"}`, background: index === activeFeature ? `rgba(${hex2rgb(current.accent)},0.06)` : "transparent", display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: index === activeFeature ? current.accent : MUTED, fontSize: 11 }}>{feature.icon}</span>
                      <span className="kora-mono" style={{ fontSize: 10, color: index === activeFeature ? TEXT : SEC }}>{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "36px 40px", display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <span style={{ color: current.accent, fontSize: 20 }}>{current.features[activeFeature].icon}</span>
                      <h3 className="kora-display" style={{ fontSize: 24, fontWeight: 700 }}>{current.features[activeFeature].name}</h3>
                    </div>
                    <p className="kora-mono" style={{ fontSize: 12, color: SEC, lineHeight: 1.9, maxWidth: 560, borderLeft: `2px solid ${current.accent}`, paddingLeft: 16 }}>{current.features[activeFeature].detail}</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {current.features.map((feature, index) => (
                      <div key={feature.name} onClick={() => setActiveFeature(index)} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", borderRadius: 6, cursor: "pointer", background: index === activeFeature ? `rgba(${hex2rgb(current.accent)},0.08)` : "transparent", border: `1px solid ${index === activeFeature ? `rgba(${hex2rgb(current.accent)},0.3)` : "transparent"}` }}>
                        <span style={{ color: index === activeFeature ? current.accent : MUTED, fontSize: 10 }}>{feature.icon}</span>
                        <span className="kora-mono" style={{ fontSize: 9.5, color: index === activeFeature ? TEXT : MUTED }}>{feature.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 24, paddingTop: 24, borderTop: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
                  {current.stats.map((stat) => (
                    <div key={stat.label}>
                      <div className="kora-display" style={{ fontSize: 26, fontWeight: 700, color: current.accent }}>{stat.value}</div>
                      <div className="kora-mono" style={{ fontSize: 8, color: TEXT, marginTop: 3 }}>{stat.label}</div>
                      <div className="kora-mono" style={{ fontSize: 8, color: MUTED, marginTop: 1 }}>{stat.sub}</div>
                    </div>
                  ))}
                  <div style={{ marginLeft: "auto" }}>
                    <Link to={current.route} style={{ textDecoration: "none" }}>
                      <button className="cta-primary" style={{ background: current.accent, border: "none", color: BG, padding: "10px 20px", borderRadius: 6, fontSize: 10, letterSpacing: "0.1em", fontWeight: 700, cursor: "pointer" }}>EXPLORE {current.label.toUpperCase()} →</button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="ai-engine" style={{ padding: "100px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="ai-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div className="kora-mono" style={{ fontSize: 9, letterSpacing: "0.25em", color: PURPLE, marginBottom: 14 }}>02 · KÓRA AI ENGINE</div>
            <h2 className="kora-display" style={{ fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 700, lineHeight: 1.15, marginBottom: 20 }}>Intelligence that<br /><em style={{ color: SEC }}>works quietly.</em></h2>
            <p className="kora-mono" style={{ fontSize: 12, color: SEC, lineHeight: 1.9, marginBottom: 32 }}>KÓRA's AI surfaces insights inline, at the moment of decision — like a senior operations analyst embedded in your platform.</p>
          </div>
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
              <span style={{ color: PURPLE }}>◈</span>
              <span className="kora-mono" style={{ fontSize: 9, letterSpacing: "0.15em", color: PURPLE, fontWeight: 700 }}>AI PREDICTION ACCURACY</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {aiCapabilities.map((capability) => (
                <div key={capability.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: capability.accent, fontSize: 10 }}>{capability.icon}</span>
                      <span className="kora-mono" style={{ fontSize: 10, color: SEC }}>{capability.label}</span>
                    </div>
                    <span className="kora-mono" style={{ fontSize: 11, color: capability.accent, fontWeight: 700 }}>{capability.accuracy}%</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: capability.accent, width: `${capability.accuracy}%`, ["--target-width" as string]: `${capability.accuracy}%` }} className="ai-bar" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" style={{ padding: "100px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="kora-mono" style={{ fontSize: 9, letterSpacing: "0.25em", color: TEAL, marginBottom: 14 }}>03 · PRICING</div>
          <h2 className="kora-display" style={{ fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 700, lineHeight: 1.15 }}>One platform. Scale freely.</h2>
        </div>
        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: BORDER }}>
          {[
            { tier: "Starter", price: "$49", period: "/month", accent: TEAL, popular: false, desc: "For single-location service businesses getting started with intelligent operations.", modules: ["Client Portal", "Booking Engine", "1 Staff Dashboard", "Basic AI Insights"] },
            { tier: "Operations", price: "$149", period: "/month", accent: AMBER, popular: true, desc: "For growing businesses managing multiple services, staff, and locations.", modules: ["Business Command", "Unlimited Staff", "Full AI Engine", "Operations Centre"] },
            { tier: "Clinical+", price: "$299", period: "/month", accent: PURPLE, popular: false, desc: "For healthcare operators, emergency services, and multi-vertical enterprises.", modules: ["Clinical Module", "Emergency Dispatch", "KÓRA Admin Console", "Custom integrations"] }
          ].map((plan) => (
            <div key={plan.tier} style={{ background: plan.popular ? SURFACE : CARD, padding: "40px 32px", position: "relative" }}>
              {plan.popular ? <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: plan.accent }} /> : null}
              <div className="kora-mono" style={{ fontSize: 9, letterSpacing: "0.2em", color: plan.accent, marginBottom: 10 }}>{plan.tier.toUpperCase()}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span className="kora-display" style={{ fontSize: 40, fontWeight: 900 }}>{plan.price}</span>
                <span className="kora-mono" style={{ fontSize: 11, color: MUTED }}>{plan.period}</span>
              </div>
              <p className="kora-mono" style={{ fontSize: 10, color: SEC, lineHeight: 1.7, marginBottom: 24, minHeight: 50 }}>{plan.desc}</p>
              <Link to="/app/client/book" style={{ textDecoration: "none" }}>
                <button className="cta-primary" style={{ width: "100%", padding: 12, borderRadius: 7, background: plan.popular ? plan.accent : "transparent", border: `1px solid ${plan.popular ? plan.accent : BORDER}`, color: plan.popular ? BG : SEC, fontSize: 11, letterSpacing: "0.1em", fontWeight: 700, cursor: "pointer", marginBottom: 24 }}>START {plan.tier.toUpperCase()}</button>
              </Link>
              <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
                {plan.modules.map((module) => (
                  <div key={module} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: plan.accent, fontSize: 8 }}>◈</span>
                    <span className="kora-mono" style={{ fontSize: 10, color: SEC }}>{module}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: "100px 60px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="kora-mono" style={{ fontSize: 9, letterSpacing: "0.25em", color: TEAL, marginBottom: 16 }}>READY TO COMMAND YOUR OPERATION</div>
          <h2 className="kora-display" style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>Your entire business,<br /><em>visible in one glance.</em></h2>
          <p className="kora-mono" style={{ fontSize: 12, color: SEC, lineHeight: 1.9, marginBottom: 36 }}>KÓRA is live. 14-day free trial. No credit card required.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/app/client/book" className="cta-primary" style={{ background: TEAL, color: BG, padding: "16px 36px", borderRadius: 8, fontSize: 12, letterSpacing: "0.12em", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>START FREE TRIAL →</Link>
            <Link to="/app/business-admin" className="cta-primary" style={{ background: "transparent", border: `1px solid ${BORDER}`, color: SEC, padding: "16px 28px", borderRadius: 8, fontSize: 12, letterSpacing: "0.1em", textDecoration: "none", display: "inline-flex", alignItems: "center" }}>BOOK A DEMO</Link>
          </div>
        </div>
      </section>

      <footer style={{ background: BG, borderTop: `1px solid ${BORDER}`, padding: "40px 60px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, animation: "blink 2s infinite" }} />
          <span className="kora-display" style={{ fontSize: 16, fontWeight: 700 }}>K<span style={{ color: TEAL }}>Ó</span>RA</span>
        </div>
        <span className="kora-mono" style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em" }}>INTELLIGENT OPERATIONS PLATFORM · ALL RIGHTS RESERVED · 2026</span>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Privacy", href: "/app/settings" },
            { label: "Terms", href: "/app/settings" },
            { label: "Security", href: "/app/kora-admin" },
            { label: "Status", href: "/app/operations" }
          ].map((link) => (
            <Link key={link.label} to={link.href} className="kora-mono" style={{ fontSize: 9, color: MUTED, letterSpacing: "0.1em", textDecoration: "none" }}>{link.label.toUpperCase()}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
