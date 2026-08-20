import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import OptiNXtLogo from "../components/OptiNXtLogo.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/* ─── Inline SVG Icons (no extra deps) ─── */
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 7L2 7" />
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 1 0-16 0" />
  </svg>
);
const IconBriefcase = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);
const IconChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
  </svg>
);
const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IconTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
    <path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/* ─── Mini animated background dots ─── */
function FloatingDots() {
  const dots = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 3,
  }));
  return (
    <>
      {dots.map((d) => (
        <div
          key={d.id}
          style={{
            position: "absolute",
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.35)",
            left: `${d.left}%`,
            top: `${d.top}%`,
            animation: `twinkle ${d.duration}s ease-in-out infinite`,
            animationDelay: `${d.delay}s`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [activePortal, setActivePortal] = useState("manager");
  const [focusedField, setFocusedField] = useState(null);

  /* ─── Auth logic ─── */
  const handleLogin = async (e, targetRole) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError("");
    const roleToValidate = targetRole || activePortal;
    
    try {
      const loggedInUser = await login(usernameOrEmail, password);
      if (loggedInUser && loggedInUser.role !== roleToValidate) {
        localStorage.removeItem("mock_user");
        setError(
          `Wrong portal! This account is a registered "${loggedInUser.role}". Please use the correct section.`
        );
        setIsLoading(false);
        return;
      }
      toast({
        title: "Welcome back! 🎉",
        description: `Redirecting to ${roleToValidate === "employee" ? "Employee" : "Manager"} Dashboard`,
      });
      setLocation("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const { user } = useAuth();
  React.useEffect(() => {
    if (user) setLocation("/dashboard", { replace: true });
  }, [user, setLocation]);

  const handleForgotPassword = () => {
    if (!resetEmail) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    toast({ title: "Reset link sent ✉️", description: "Check your inbox for password reset instructions." });
    setShowForgotPassword(false);
    setResetEmail("");
  };

  /* ─── Styles ─── */
  const inputStyle = (field, portalColor = "#f97316") => ({
    width: "100%",
    padding: "13px 13px 13px 42px",
    borderRadius: 10,
    border: `1.5px solid ${focusedField === field ? portalColor : "#e2e8f0"}`,
    fontSize: 14,
    outline: "none",
    background: "#f8fafc",
    color: "#0f172a",
    transition: "all 0.2s",
    boxShadow: focusedField === field ? `0 0 0 3px ${portalColor}20` : "none",
    fontFamily: "inherit",
  });

  const featureCards = [
    { icon: <IconChart />, title: "AI-Powered Insights", desc: "Real-time analytics on workforce performance, risk and efficiency.", color: "#60a5fa" },
    { icon: <IconTarget />, title: "Fitment & Gap Analysis", desc: "Detect skill gaps, role mismatches and align talent to roles.", color: "#fb923c" },
    { icon: <IconTrend />, title: "Growth & Productivity", desc: "Track development readiness, utilization and career momentum.", color: "#34d399" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "48px 56px", position: "relative", overflow: "hidden", color: "#fff"
      }}>
        {/* animated background */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.15),transparent 70%)", top: -150, right: -120 }} />
          <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle,rgba(249,115,22,0.1),transparent 70%)", bottom: -80, left: 60 }} />
          <FloatingDots />
        </div>

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <OptiNXtLogo variant="full" size="md" />
        </div>

        {/* Headline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 20, padding: "4px 14px", fontSize: 11, fontWeight: 700,
            color: "#fb923c", letterSpacing: "0.08em", marginBottom: 20
          }}>
            ✨ AI WORKFORCE INTELLIGENCE PLATFORM
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.1, margin: "0 0 16px", letterSpacing: "-0.03em" }}>
            AI Workforce<br />
            <span style={{ color: "#f97316" }}>Intelligence</span>
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 36px", maxWidth: 400 }}>
            Enterprise intelligence to align people, roles, productivity and future workforce strategy.
          </p>

          {/* Feature cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {featureCards.map((f, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, padding: "16px 18px",
                display: "flex", alignItems: "flex-start", gap: 14,
                backdropFilter: "blur(8px)",
                transition: "all 0.25s",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `${f.color}20`, border: `1px solid ${f.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: f.color
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer badge */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ color: "#10b981" }}><IconShield /></div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
            © 2026 OptiNXt · SOC2 Compliant · Secure Enterprise Access
          </span>
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)",
        padding: "40px",
      }}>
        <div style={{ width: "100%", maxWidth: 500 }}>

          {/* Heading */}
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.03em" }}>Sign In</h2>
            <p style={{ fontSize: 15, color: "#64748b" }}>Access your specialized workforce dashboard</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* PORTAL SECTIONS */}
            {[
              { id: "manager", title: "Manager Portal", icon: <IconBriefcase />, color: "#f97316", gradient: "linear-gradient(135deg,#f97316,#dc2626)" },
              { id: "employee", title: "Employee Portal", icon: <IconUser />, color: "#3b82f6", gradient: "linear-gradient(135deg,#3b82f6,#2563eb)" }
            ].map((p) => {
              const isActive = activePortal === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => !isActive && setActivePortal(p.id)}
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    padding: isActive ? "32px 36px" : "20px 28px",
                    boxShadow: isActive ? "0 20px 40px rgba(0,0,0,0.12)" : "0 4px 12px rgba(0,0,0,0.03)",
                    border: `2px solid ${isActive ? p.color : "#e2e8f0"}`,
                    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    cursor: isActive ? "default" : "pointer",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {/* Background Accent */}
                  {isActive && (
                    <div style={{
                      position: "absolute", top: -20, right: -20, width: 100, height: 100,
                      background: p.color, opacity: 0.05, borderRadius: "50%"
                    }} />
                  )}

                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: isActive ? 24 : 0
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                        background: isActive ? p.gradient : "#f1f5f9",
                        color: isActive ? "#fff" : "#94a3b8",
                        transition: "all 0.3s"
                      }}>
                        {p.icon}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: isActive ? p.color : "#1e293b", margin: 0 }}>
                          {p.title}
                        </h3>
                        {!isActive && <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Click to open portal</p>}
                      </div>
                    </div>
                    {!isActive && <div style={{ color: "#cbd5e1" }}>→</div>}
                  </div>

                  {isActive && (
                    <form onSubmit={(e) => handleLogin(e, p.id)} style={{ animation: "fadeIn 0.4s ease" }}>
                      {/* Error in specific section */}
                      {error && (
                        <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16, border: "1px solid #fee2e2" }}>
                          ⚠️ {error}
                        </div>
                      )}

                      {/* Email */}
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.02em" }}>Username or Email</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: focusedField === "email" ? p.color : "#94a3b8" }}><IconMail /></span>
                          <input
                            style={inputStyle("email", p.color)}
                            value={usernameOrEmail}
                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Enter credentials"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.02em" }}>Password</label>
                          <button type="button" onClick={() => setShowForgotPassword(true)} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 600, color: p.color, cursor: "pointer", padding: 0 }}>Forgot?</button>
                        </div>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: focusedField === "password" ? p.color : "#94a3b8" }}><IconLock /></span>
                          <input
                            type={showPassword ? "text" : "password"}
                            style={inputStyle("password", p.color)}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedField("password")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                          >
                            {showPassword ? <IconEyeOff /> : <IconEye />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                          width: "100%", padding: "14px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                          background: isLoading ? "#cbd5e1" : p.gradient,
                          color: "#fff", border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                          boxShadow: isLoading ? "none" : `0 8px 16px ${p.color}40`,
                          transition: "all 0.2s",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                        }}
                      >
                        {isLoading ? "Signing in..." : `Sign into ${p.id.charAt(0).toUpperCase() + p.id.slice(1)} Portal →`}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom links */}
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <div style={{
              padding: "16px", borderRadius: 16, background: "rgba(255,255,255,0.5)",
              border: "1px dashed #cbd5e1", marginBottom: 24
            }}>
              <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", fontWeight: 600 }}>Demo Credentials</p>
              <div style={{ display: "flex", gap: 20, justifyContent: "center", fontSize: 11, color: "#475569" }}>
                <span><strong>Mgr:</strong> manager@peoplestat.com</span>
                <span><strong>Emp:</strong> employee@peoplestat.com</span>
              </div>
            </div>

            <div style={{ fontSize: 14, color: "#64748b" }}>
              New to OptiNXt?{" "}
              <button
                type="button"
                onClick={() => setLocation("/register")}
                style={{ background: "none", border: "none", fontSize: 14, fontWeight: 700, color: "#f97316", cursor: "pointer", padding: 0, textDecoration: "underline" }}
              >
                Create an account
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => setLocation("/")}
              style={{ marginTop: 16, background: "none", border: "none", fontSize: 13, color: "#94a3b8", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 20, fontWeight: 800 }}>Reset Password</DialogTitle>
            <DialogDescription>Enter your email and we'll send a reset link.</DialogDescription>
          </DialogHeader>
          <div style={{ padding: "8px 0" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}><IconMail /></span>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                style={{
                  width: "100%", padding: "12px 12px 12px 40px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
                  background: "#f8fafc", color: "#0f172a", fontFamily: "inherit"
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForgotPassword(false)}>Cancel</Button>
            <Button
              onClick={handleForgotPassword}
              style={{ background: "linear-gradient(135deg,#f97316,#dc2626)", border: "none", color: "#fff", fontWeight: 700 }}
            >
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes twinkle { 0%,100%{opacity:0.2} 50%{opacity:0.8} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
