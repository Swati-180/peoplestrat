import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import OptiNXtLogo from "../components/OptiNXtLogo.jsx";

/* ─────────────────────────────────────────────
   Tiny inline SVG icons (no extra deps needed)
───────────────────────────────────────────── */
const IconBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.6A3 3 0 0 1 4 12a3 3 0 0 1 2.5-2.97A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.6A3 3 0 0 0 20 12a3 3 0 0 0-2.5-2.97A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);
const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IconBattery = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/><path d="M6 11h4"/>
  </svg>
);
const IconGap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
  </svg>
);
const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconPeople = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ─────────────────────────────────────────────
   Dashboard Preview Mock Component
───────────────────────────────────────────── */
function DashboardMock() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.97)",
      borderRadius: "16px",
      boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
      overflow: "hidden",
      width: "100%",
      maxWidth: "580px",
      border: "1px solid rgba(255,255,255,0.3)"
    }}>
      {/* Window bar */}
      <div style={{ background: "#f0f2f5", padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ marginLeft: 12, fontSize: 11, color: "#64748b", fontWeight: 600 }}>
          OptiNXT · Workforce Intelligence Command Center
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <span style={{ fontSize: 10, background: "#e0f2fe", color: "#0284c7", borderRadius: 4, padding: "2px 7px", fontWeight: 700 }}>MANAGER</span>
          <span style={{ fontSize: 10, background: "#fef3c7", color: "#d97706", borderRadius: 4, padding: "2px 7px", fontWeight: 700 }}>LIVE</span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ padding: "14px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 12 }}>
        {[
          { label: "WORKFORCE", value: "171", icon: "👥", color: "#3b82f6" },
          { label: "FITMENT INDEX", value: "61%", icon: "🎯", color: "#10b981" },
          { label: "BURNOUT RISK", value: "0%", icon: "⚡", color: "#f59e0b" },
          { label: "AUTOMATION", value: "$70", icon: "🤖", color: "#8b5cf6" },
        ].map((kpi, i) => (
          <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>{kpi.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {/* Fitment donut */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>FITMENT HEALTH</div>
          <svg viewBox="0 0 36 36" style={{ width: 70, height: 70, margin: "0 auto" }}>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.5"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3.5"
              strokeDasharray="61 39" strokeDashoffset="25" strokeLinecap="round"/>
            <text x="18" y="20" textAnchor="middle" fill="#1e40af" fontSize="7" fontWeight="800">61%</text>
          </svg>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Fit Rate</div>
        </div>

        {/* Burnout donut */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>BURNOUT RISK</div>
          <svg viewBox="0 0 36 36" style={{ width: 70, height: 70, margin: "0 auto" }}>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.5"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3.5"
              strokeDasharray="9 91" strokeDashoffset="25" strokeLinecap="round"/>
            <text x="18" y="20" textAnchor="middle" fill="#b45309" fontSize="7" fontWeight="800">9%</text>
          </svg>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>At Risk</div>
        </div>

        {/* Automation savings */}
        <div style={{ background: "linear-gradient(135deg,#1e40af,#7c3aed)", borderRadius: 10, padding: "12px", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 8, opacity: 0.85 }}>AUTOMATION SAVINGS</div>
          <div style={{ fontSize: 22, fontWeight: 900, margin: "10px 0" }}>$3.2M</div>
          <div style={{ fontSize: 10, opacity: 0.75 }}>Annual Potential</div>
          <div style={{ marginTop: 8, background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "4px 8px", fontSize: 10, fontWeight: 700 }}>↑ 14% vs last yr</div>
        </div>
      </div>

      {/* Bar chart row */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 10, padding: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, marginBottom: 10 }}>DEPARTMENT FITMENT DISTRIBUTION</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 50 }}>
            {[70, 85, 55, 92, 60, 78, 45, 88].map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{
                  width: "100%", height: `${h * 0.5}px`,
                  background: h > 80 ? "linear-gradient(180deg,#10b981,#059669)" : h > 60 ? "linear-gradient(180deg,#3b82f6,#2563eb)" : "linear-gradient(180deg,#f59e0b,#d97706)",
                  borderRadius: "3px 3px 0 0"
                }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Landing Page
───────────────────────────────────────────── */
export default function LandingPage() {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-cycle features
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % 4), 3000);
    return () => clearInterval(t);
  }, []);

  const features = [
    { icon: <IconChart />, title: "Workforce Intelligence", desc: "Real-time analytics of workforce productivity and performance metrics.", color: "#3b82f6", bg: "#eff6ff" },
    { icon: <IconTarget />, title: "Fitment Analysis", desc: "AI analyzes employee-role alignment to maximize job satisfaction and output.", color: "#f97316", bg: "#fff7ed" },
    { icon: <IconBattery />, title: "Fatigue Monitoring", desc: "Detect burnout risk early using workload analytics and sentiment signals.", color: "#8b5cf6", bg: "#f5f3ff" },
    { icon: <IconGap />, title: "Skill Gap Detection", desc: "Identify training needs across departments with precision AI mapping.", color: "#10b981", bg: "#ecfdf5" },
  ];

  const benefits = [
    { icon: <IconBrain />, title: "AI-Driven Decisions", desc: "Replace guesswork with data-backed workforce intelligence that learns over time.", color: "#6366f1" },
    { icon: <IconShield />, title: "Compliance & Security", desc: "Enterprise-grade data security with role-based access for managers and employees.", color: "#0ea5e9" },
    { icon: <IconPeople />, title: "Employee-First Design", desc: "Dual portals ensure both managers and employees get tailored experiences.", color: "#10b981" },
    { icon: <IconChart />, title: "Automation Savings", desc: "Identify up to $3.2M+ in annual automation opportunities across your org.", color: "#f59e0b" },
  ];

  const stats = [
    { value: "61%", label: "Avg. Fitment Score Boost" },
    { value: "9%", label: "Burnout Risk Reduction" },
    { value: "$3.2M", label: "Automation Opportunities" },
    { value: "171+", label: "Workforce Profiles Analyzed" },
  ];


  const s = {
    page: { fontFamily: "'Inter', 'Segoe UI', sans-serif", color: "#0f172a", overflowX: "hidden", background: "#fff" },
    // NAV
    nav: {
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 5%",
      height: 68,
      transition: "all 0.3s ease",
      background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(226,232,240,0.8)" : "none",
      boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.06)" : "none",
    },
    navLogo: { display: "flex", alignItems: "center", gap: 4, cursor: "pointer", textDecoration: "none" },
    navLogoText: { fontSize: 22, fontWeight: 800, color: scrolled ? "#0f172a" : "#fff", letterSpacing: "-0.03em" },
    navLogoAccent: { color: "#f97316" },
    navLinks: { display: "flex", gap: 32, alignItems: "center" },
    navLink: { fontSize: 14, fontWeight: 500, color: scrolled ? "#475569" : "rgba(255,255,255,0.85)", cursor: "pointer", textDecoration: "none", transition: "color 0.2s" },
    navActions: { display: "flex", gap: 10, alignItems: "center" },
    btnOutline: {
      padding: "9px 22px", borderRadius: 8, fontSize: 14, fontWeight: 600,
      border: `2px solid ${scrolled ? "#e2e8f0" : "rgba(255,255,255,0.5)"}`,
      color: scrolled ? "#0f172a" : "#fff", background: "transparent", cursor: "pointer", transition: "all 0.2s"
    },
    btnPrimary: {
      padding: "9px 22px", borderRadius: 8, fontSize: 14, fontWeight: 700,
      background: "linear-gradient(135deg,#f97316,#ea580c)", color: "#fff",
      border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(249,115,22,0.4)", transition: "all 0.2s"
    },
    // HERO
    hero: {
      minHeight: "100vh", display: "flex", alignItems: "center",
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #0f172a 100%)",
      position: "relative", overflow: "hidden", padding: "0 5%"
    },
    heroGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", width: "100%", maxWidth: 1200, margin: "0 auto", paddingTop: 80 },
    eyebrow: {
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)",
      borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700,
      color: "#fb923c", letterSpacing: "0.08em", marginBottom: 20
    },
    h1: { fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900, lineHeight: 1.1, color: "#fff", margin: "0 0 20px", letterSpacing: "-0.03em" },
    h1Accent: { color: "#f97316" },
    heroSub: { fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: "0 0 36px", maxWidth: 460 },
    heroBtns: { display: "flex", gap: 14, flexWrap: "wrap" },
    heroBtnPrimary: {
      padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 700,
      background: "linear-gradient(135deg,#f97316,#dc2626)", color: "#fff",
      border: "none", cursor: "pointer", boxShadow: "0 8px 24px rgba(249,115,22,0.45)",
      display: "flex", alignItems: "center", gap: 8, transition: "all 0.25s"
    },
    heroBtnSecondary: {
      padding: "14px 32px", borderRadius: 10, fontSize: 16, fontWeight: 600,
      background: "rgba(255,255,255,0.08)", color: "#fff",
      border: "1.5px solid rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.25s",
      backdropFilter: "blur(10px)"
    },
    // FEATURES
    section: { padding: "80px 5%" },
    sectionCenter: { textAlign: "center", maxWidth: 600, margin: "0 auto 56px" },
    chip: {
      display: "inline-block", borderRadius: 20, padding: "4px 14px", fontSize: 12,
      fontWeight: 700, letterSpacing: "0.07em", marginBottom: 12,
      background: "linear-gradient(135deg,#eff6ff,#dbeafe)", color: "#2563eb"
    },
    h2: { fontSize: "clamp(26px,4vw,38px)", fontWeight: 800, margin: "0 0 14px", letterSpacing: "-0.02em" },
    subtext: { fontSize: 16, color: "#64748b", lineHeight: 1.7 },
    featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, maxWidth: 1100, margin: "0 auto" },
    // STATS
    statsSection: {
      background: "linear-gradient(135deg,#0f172a,#1e3a5f)", padding: "72px 5%", textAlign: "center"
    },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 32, maxWidth: 900, margin: "0 auto" },
    // PRICING
    // FOOTER / CTA
    cta: {
      background: "linear-gradient(135deg,#f97316,#dc2626,#9333ea)", padding: "80px 5%", textAlign: "center", color: "#fff"
    },
    footer: { background: "#0f172a", color: "rgba(255,255,255,0.5)", padding: "40px 5%", textAlign: "center", fontSize: 14 },
  };

  return (
    <div style={s.page}>
      {/* ── NAVBAR ── */}
      <nav style={s.nav}>
        <div style={s.navLogo} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <OptiNXtLogo variant="full" size="sm" style={{ gap: 6 }} />
        </div>

        {/* Desktop links */}
        <div style={{ ...s.navLinks, display: window.innerWidth < 768 ? "none" : "flex" }}>
          {["Home", "Features", "Solutions", "About"].map(l => (
            <a key={l} style={s.navLink} href={`#${l.toLowerCase()}`}>{l}</a>
          ))}
        </div>

        <div style={s.navActions}>
          <button style={s.btnOutline} onClick={() => navigate("/login")}>Log In</button>
          <button style={s.btnPrimary} onClick={() => navigate("/register")}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="home" style={s.hero}>
        {/* Background orbs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.18),transparent 70%)", top: -150, right: -100 }} />
          <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.12),transparent 70%)", bottom: -100, left: 100 }} />
          {/* Star-dots grid */}
          {[...Array(30)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: Math.random() * 2 + 1 + "px", height: Math.random() * 2 + 1 + "px",
              background: "rgba(255,255,255,0.4)", borderRadius: "50%",
              left: Math.random() * 100 + "%", top: Math.random() * 100 + "%",
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: Math.random() * 3 + "s"
            }} />
          ))}
        </div>

        <div style={s.heroGrid} ref={heroRef}>
          {/* Left */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={s.eyebrow}>✨ AI WORKFORCE INTELLIGENCE</div>
            <h1 style={s.h1}>
              AI Workforce Intelligence for&nbsp;
              <span style={s.h1Accent}>Smarter Organizations</span>
            </h1>
            <p style={s.heroSub}>
              Transform workforce data into actionable insights using AI-driven fitment analysis, fatigue monitoring, and performance intelligence.
            </p>
            <div style={s.heroBtns}>
              <button style={s.heroBtnPrimary} onClick={() => navigate("/register")}>
                Get Started <IconArrow />
              </button>
              <button style={s.heroBtnSecondary} onClick={() => navigate("/login")}>Book Demo</button>
            </div>

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 20, marginTop: 36, flexWrap: "wrap" }}>
              {["SOC2 Compliant", "GDPR Ready", "99.9% Uptime"].map(b => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                  <div style={{ color: "#10b981" }}><IconCheck /></div>
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard preview */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{
              animation: "float 5s ease-in-out infinite",
              filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.5))"
            }}>
              <DashboardMock />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ ...s.section, background: "linear-gradient(180deg,#f8fafc 0%,#fff 100%)" }}>
        <div style={s.sectionCenter}>
          <span style={s.chip}>FEATURES</span>
          <h2 style={s.h2}>AI-powered insights to optimize your workforce</h2>
          <p style={s.subtext}>Transform workforce data into actionable insights using AI-driven fitment analysis, fatigue monitoring, and beyond.</p>
        </div>
        <div style={s.featureGrid}>
          {features.map((f, i) => (
            <div
              key={i}
              onMouseEnter={() => setActiveFeature(i)}
              style={{
                background: "#fff", borderRadius: 16, padding: "28px 24px",
                border: `2px solid ${activeFeature === i ? f.color : "#e2e8f0"}`,
                boxShadow: activeFeature === i ? `0 12px 40px ${f.color}22` : "0 2px 12px rgba(0,0,0,0.04)",
                transition: "all 0.3s ease", cursor: "default",
                transform: activeFeature === i ? "translateY(-4px)" : "none"
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: f.bg, color: f.color,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOLUTIONS (Benefits) ── */}
      <section id="solutions" style={{ ...s.section }}>
        <div style={s.sectionCenter}>
          <span style={{ ...s.chip, background: "linear-gradient(135deg,#fef3c7,#fde68a)", color: "#b45309" }}>WHY OPTINXT</span>
          <h2 style={s.h2}>Everything your organization needs</h2>
          <p style={s.subtext}>Built for modern enterprises that want to lead with intelligence, not instinct.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
          {benefits.map((b, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: 16, padding: "28px 24px", border: "1px solid #e2e8f0", transition: "all 0.3s" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${b.color}15`, color: b.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                {b.icon}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>{b.title}</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65, margin: 0 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={s.statsSection}>
        <div style={{ ...s.sectionCenter, margin: "0 auto 48px" }}>
          <span style={{ ...s.chip, background: "rgba(249,115,22,0.15)", color: "#fb923c" }}>BY THE NUMBERS</span>
          <h2 style={{ ...s.h2, color: "#fff" }}>Measurable impact from day one</h2>
        </div>
        <div style={s.statsGrid}>
          {stats.map((st, i) => (
            <div key={i} style={{ padding: 24 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: "#f97316", letterSpacing: "-0.04em", lineHeight: 1 }}>{st.value}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 8, fontWeight: 500 }}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>


      {/* ── CTA BANNER ── */}
      <section style={s.cta}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, margin: "0 0 16px", letterSpacing: "-0.03em" }}>
            Ready to transform your workforce?
          </h2>
          <p style={{ fontSize: 18, opacity: 0.9, lineHeight: 1.7, margin: "0 0 36px" }}>
            Join forward-thinking organizations using OptiNXt to build smarter, healthier, and more productive teams.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "15px 40px", borderRadius: 12, fontSize: 16, fontWeight: 700,
                background: "#fff", color: "#f97316", border: "none", cursor: "pointer",
                boxShadow: "0 8px 30px rgba(0,0,0,0.2)", transition: "all 0.25s"
              }}
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "15px 40px", borderRadius: 12, fontSize: 16, fontWeight: 600,
                background: "rgba(255,255,255,0.15)", color: "#fff",
                border: "1.5px solid rgba(255,255,255,0.5)", cursor: "pointer",
                backdropFilter: "blur(10px)", transition: "all 0.25s"
              }}
            >
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="about" style={s.footer}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 }}>
          <OptiNXtLogo variant="full" size="sm" />
        </div>
        <p style={{ margin: "0 0 12px" }}>AI Workforce Intelligence Platform — Empowering Smarter Organizations</p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
          {["Privacy Policy", "Terms of Service", "Contact Us", "Documentation"].map(l => (
            <a key={l} href="#" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color 0.2s" }}>{l}</a>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 13 }}>© {new Date().getFullYear()} OptiNXt. All rights reserved.</p>
      </footer>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        button:hover { transform: translateY(-1px); filter: brightness(1.05); }
      `}</style>
    </div>
  );
}
