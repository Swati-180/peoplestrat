/**
 * OptiNXtLogo — Reusable animated logo component
 * Converted from OptiNXt_Animated_Logo.html
 *
 * Props:
 *  variant  : "full" | "icon" | "wordmark"   (default: "full")
 *  size     : "sm" | "md" | "lg" | "xl"      (default: "md")
 *  className: extra CSS class string
 *  style    : extra inline style object
 */
export default function OptiNXtLogo({
  variant = "full",
  size = "md",
  className = "",
  style = {},
  onClick,
}) {
  const iconSizes = { sm: 40, md: 40, lg: 60, xl: 100 };
  const fontSizes = { sm: 25, md: 22, lg: 32, xl: 52 };
  const iconPx = iconSizes[size] ?? 40;
  const fontPx = fontSizes[size] ?? 22;

  /* ── Keyframes injected once ── */
  const keyframes = `
    @keyframes optinxt-drawRing   { to { stroke-dashoffset: 0; } }
    @keyframes optinxt-drawOrbit  { to { stroke-dashoffset: 0; } }
    @keyframes optinxt-spinOrbit1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes optinxt-spinOrbit2 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes optinxt-popCore    { to { transform: scale(1); } }
    @keyframes optinxt-corePulse  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:.85} }
    @keyframes optinxt-popNode    { to { opacity:1; transform:scale(1); } }
    @keyframes optinxt-nodeFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(2px,-3px)} }
    @keyframes optinxt-nodeFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-2px,3px)} }
    @keyframes optinxt-nodeFloat3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(3px,2px)} }
    @keyframes optinxt-nodeFloat4 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-3px,-2px)} }
    @keyframes optinxt-drawArrow  { to { stroke-dashoffset: 0; } }
    @keyframes optinxt-arrowPulse { 0%,100%{transform:translateX(0);opacity:1} 50%{transform:translateX(4px);opacity:.7} }
    @keyframes optinxt-drawConn   { to { stroke-dashoffset: 0; } }
    @keyframes optinxt-slideUp    { to { opacity:1; transform:translateY(0); } }
    @keyframes optinxt-ambientPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.15)} }
  `;

  /* ── Animated SVG Icon ── */
  const Icon = () => (
    <svg
      viewBox="0 0 200 200"
      width={iconPx}
      height={iconPx}
      style={{ flexShrink: 0, overflow: "visible" }}
    >
      <defs>
        <linearGradient id="optinxt-pg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4DA8CC" />
          <stop offset="100%" stopColor="#7FC8E8" />
        </linearGradient>
        <linearGradient id="optinxt-ag" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7931E" />
          <stop offset="100%" stopColor="#E84D1E" />
        </linearGradient>
      </defs>

      {/* Outer ring draw-in */}
      <circle
        cx="100" cy="100" r="72" fill="none"
        stroke="url(#optinxt-pg)" strokeWidth="4" opacity="0.8"
        style={{
          strokeDasharray: 460, strokeDashoffset: 460,
          animation: "optinxt-drawRing 1.4s cubic-bezier(.65,0,.35,1) .2s forwards",
        }}
      />

      {/* Orbit 1 (spins CW) */}
      <g style={{ transformOrigin: "100px 100px", animation: "optinxt-spinOrbit1 12s linear 1.8s infinite" }}>
        <ellipse
          cx="100" cy="100" rx="52" ry="22" fill="none"
          stroke="url(#optinxt-ag)" strokeWidth="3" strokeLinecap="round"
          transform="rotate(-28, 100, 100)"
          style={{
            strokeDasharray: 280, strokeDashoffset: 280,
            transformOrigin: "100px 100px",
            animation: "optinxt-drawOrbit 1.2s cubic-bezier(.65,0,.35,1) .6s forwards",
          }}
        />
      </g>

      {/* Orbit 2 (spins CCW) */}
      <g style={{ transformOrigin: "100px 100px", animation: "optinxt-spinOrbit2 15s linear 1.8s infinite reverse" }}>
        <ellipse
          cx="100" cy="100" rx="52" ry="22" fill="none"
          stroke="url(#optinxt-ag)" strokeWidth="3" strokeLinecap="round" opacity="0.6"
          transform="rotate(28, 100, 100)"
          style={{
            strokeDasharray: 280, strokeDashoffset: 280,
            transformOrigin: "100px 100px",
            animation: "optinxt-drawOrbit 1.2s cubic-bezier(.65,0,.35,1) .8s forwards",
          }}
        />
      </g>

      {/* Connection lines */}
      <line x1="52" y1="72" x2="62" y2="80" stroke="url(#optinxt-pg)" strokeWidth="1.5" opacity="0.35" strokeLinecap="round"
        style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: "optinxt-drawConn .4s ease 1.5s forwards" }} />
      <line x1="138" y1="120" x2="148" y2="128" stroke="url(#optinxt-pg)" strokeWidth="1.5" opacity="0.35" strokeLinecap="round"
        style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: "optinxt-drawConn .4s ease 1.5s forwards" }} />

      {/* Core */}
      <g style={{ transformOrigin: "100px 100px", animation: "optinxt-corePulse 2.5s ease-in-out 2s infinite" }}>
        <circle cx="100" cy="100" r="11" fill="url(#optinxt-ag)"
          style={{ transform: "scale(0)", transformOrigin: "100px 100px", animation: "optinxt-popCore .5s cubic-bezier(.34,1.56,.64,1) 1.0s forwards" }} />
        <circle cx="100" cy="100" r="5.5" fill="#0A1A2A"
          style={{ transform: "scale(0)", transformOrigin: "100px 100px", animation: "optinxt-popCore .4s cubic-bezier(.34,1.56,.64,1) 1.15s forwards" }} />
      </g>

      {/* Nodes */}
      <g style={{ animation: "optinxt-nodeFloat1 3s ease-in-out 2s infinite" }}>
        <circle cx="144" cy="78" r="4.5" fill="url(#optinxt-pg)"
          style={{ opacity: 0, transform: "scale(0)", transformOrigin: "144px 78px", animation: "optinxt-popNode .4s cubic-bezier(.34,1.56,.64,1) 1.3s forwards" }} />
      </g>
      <g style={{ animation: "optinxt-nodeFloat2 3.5s ease-in-out 2.2s infinite" }}>
        <circle cx="56" cy="122" r="4.5" fill="url(#optinxt-pg)"
          style={{ opacity: 0, transform: "scale(0)", transformOrigin: "56px 122px", animation: "optinxt-popNode .4s cubic-bezier(.34,1.56,.64,1) 1.45s forwards" }} />
      </g>
      <g style={{ animation: "optinxt-nodeFloat3 2.8s ease-in-out 2.4s infinite" }}>
        <circle cx="132" cy="134" r="3.5" fill="url(#optinxt-ag)" opacity="0.75"
          style={{ opacity: 0, transform: "scale(0)", transformOrigin: "132px 134px", animation: "optinxt-popNode .4s cubic-bezier(.34,1.56,.64,1) 1.6s forwards" }} />
      </g>
      <g style={{ animation: "optinxt-nodeFloat4 3.2s ease-in-out 2.6s infinite" }}>
        <circle cx="68" cy="66" r="3.5" fill="url(#optinxt-ag)" opacity="0.75"
          style={{ opacity: 0, transform: "scale(0)", transformOrigin: "68px 66px", animation: "optinxt-popNode .4s cubic-bezier(.34,1.56,.64,1) 1.75s forwards" }} />
      </g>

      {/* Forward arrow */}
      <g style={{ transformOrigin: "166px 100px", animation: "optinxt-arrowPulse 2s ease-in-out 2.5s infinite" }}>
        <path d="M 158,91 L 176,100 L 158,109" fill="none"
          stroke="url(#optinxt-ag)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: "optinxt-drawArrow .6s cubic-bezier(.65,0,.35,1) 1.9s forwards" }} />
      </g>
    </svg>
  );

  /* ── Wordmark text ── */
  const Wordmark = ({ dark = false }) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1, fontFamily: "'Outfit','Inter',sans-serif" }}>
      <span style={{
        fontSize: fontPx, fontWeight: 300, letterSpacing: "-0.04em",
        color: dark ? "#0f172a" : "#ffffff",
        opacity: 0, transform: "translateY(8px)",
        animation: "optinxt-slideUp .7s cubic-bezier(.16,1,.3,1) 2.1s forwards",
        display: "inline-block",
      }}>Opti</span>
      <span style={{
        fontSize: fontPx, fontWeight: 800, letterSpacing: "-0.04em",
        background: "linear-gradient(135deg,#F7931E,#F15A29,#E8421E)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        opacity: 0, transform: "translateY(8px)",
        animation: "optinxt-slideUp .7s cubic-bezier(.16,1,.3,1) 2.3s forwards",
        display: "inline-block",
      }}>NXt</span>
    </div>
  );

  /* ── Wordmark (no animation — for use in compact navbars) ── */
  const WordmarkStatic = ({ dark = false }) => (
    <div style={{ display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1, fontFamily: "'Outfit','Inter',sans-serif" }}>
      <span style={{ fontSize: fontPx, fontWeight: 300, letterSpacing: "-0.04em", color: dark ? "#0f172a" : "#ffffff" }}>Opti</span>
      <span style={{
        fontSize: fontPx, fontWeight: 800, letterSpacing: "-0.04em",
        background: "linear-gradient(135deg,#F7931E,#F15A29,#E8421E)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      }}>NXt</span>
    </div>
  );

  return (
    <>
      <style>{keyframes}</style>
      <div
        className={className}
        onClick={onClick}
        style={{
          display: "inline-flex", alignItems: "center", gap: iconPx * 0.25,
          cursor: onClick ? "pointer" : "default",
          userSelect: "none",
          ...style,
        }}
      >
        {(variant === "full" || variant === "icon") && <Icon />}
        {variant === "full" && (
          <WordmarkStatic dark={style?.dark} />
        )}
        {variant === "wordmark" && <WordmarkStatic dark={style?.dark} />}
      </div>
    </>
  );
}

/**
 * OptiNXtLogoAnimated — Full cinematic version (icon + animated wordmark slide-up)
 * Use on landing / splash screens only (heavy animation)
 */
export function OptiNXtLogoAnimated({ style = {} }) {
  const keyframes = `
    @keyframes optinxt-drawRing   { to { stroke-dashoffset: 0; } }
    @keyframes optinxt-drawOrbit  { to { stroke-dashoffset: 0; } }
    @keyframes optinxt-spinOrbit1 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes optinxt-spinOrbit2 { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes optinxt-popCore    { to { transform: scale(1); } }
    @keyframes optinxt-corePulse  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:.85} }
    @keyframes optinxt-popNode    { to { opacity:1; transform:scale(1); } }
    @keyframes optinxt-nodeFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(2px,-3px)} }
    @keyframes optinxt-nodeFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-2px,3px)} }
    @keyframes optinxt-nodeFloat3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(3px,2px)} }
    @keyframes optinxt-nodeFloat4 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-3px,-2px)} }
    @keyframes optinxt-drawArrow  { to { stroke-dashoffset: 0; } }
    @keyframes optinxt-arrowPulse { 0%,100%{transform:translateX(0);opacity:1} 50%{transform:translateX(4px);opacity:.7} }
    @keyframes optinxt-drawConn   { to { stroke-dashoffset: 0; } }
    @keyframes optinxt-slideUp    { to { opacity:1; transform:translateY(0); } }
    @keyframes optinxt-wipeLine   { to { width: 260px; } }
    @keyframes optinxt-fadeIn     { to { opacity: 1; } }
    @keyframes optinxt-ambientPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
    @keyframes optinxt-sparkle    { 0%,100%{opacity:0;transform:scale(.5)} 50%{opacity:.6;transform:scale(1.2)} }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, position: "relative", fontFamily: "'Outfit',sans-serif", ...style }}>
        <svg viewBox="0 0 200 200" width={180} height={180} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="optinxt-pg2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4DA8CC" /><stop offset="100%" stopColor="#7FC8E8" />
            </linearGradient>
            <linearGradient id="optinxt-ag2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F7931E" /><stop offset="100%" stopColor="#E84D1E" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="72" fill="none" stroke="url(#optinxt-pg2)" strokeWidth="4" opacity="0.8"
            style={{ strokeDasharray:460, strokeDashoffset:460, animation:"optinxt-drawRing 1.4s cubic-bezier(.65,0,.35,1) .2s forwards" }}/>
          <g style={{transformOrigin:"100px 100px",animation:"optinxt-spinOrbit1 12s linear 1.8s infinite"}}>
            <ellipse cx="100" cy="100" rx="52" ry="22" fill="none" stroke="url(#optinxt-ag2)" strokeWidth="3" strokeLinecap="round" transform="rotate(-28,100,100)"
              style={{strokeDasharray:280,strokeDashoffset:280,transformOrigin:"100px 100px",animation:"optinxt-drawOrbit 1.2s cubic-bezier(.65,0,.35,1) .6s forwards"}}/>
          </g>
          <g style={{transformOrigin:"100px 100px",animation:"optinxt-spinOrbit2 15s linear 1.8s infinite reverse"}}>
            <ellipse cx="100" cy="100" rx="52" ry="22" fill="none" stroke="url(#optinxt-ag2)" strokeWidth="3" strokeLinecap="round" opacity="0.6" transform="rotate(28,100,100)"
              style={{strokeDasharray:280,strokeDashoffset:280,transformOrigin:"100px 100px",animation:"optinxt-drawOrbit 1.2s cubic-bezier(.65,0,.35,1) .8s forwards"}}/>
          </g>
          <line x1="52" y1="72" x2="62" y2="80" stroke="url(#optinxt-pg2)" strokeWidth="1.5" opacity="0.35" strokeLinecap="round"
            style={{strokeDasharray:20,strokeDashoffset:20,animation:"optinxt-drawConn .4s ease 1.5s forwards"}}/>
          <line x1="138" y1="120" x2="148" y2="128" stroke="url(#optinxt-pg2)" strokeWidth="1.5" opacity="0.35" strokeLinecap="round"
            style={{strokeDasharray:20,strokeDashoffset:20,animation:"optinxt-drawConn .4s ease 1.5s forwards"}}/>
          <g style={{transformOrigin:"100px 100px",animation:"optinxt-corePulse 2.5s ease-in-out 2s infinite"}}>
            <circle cx="100" cy="100" r="11" fill="url(#optinxt-ag2)"
              style={{transform:"scale(0)",transformOrigin:"100px 100px",animation:"optinxt-popCore .5s cubic-bezier(.34,1.56,.64,1) 1.0s forwards"}}/>
            <circle cx="100" cy="100" r="5.5" fill="#0A1A2A"
              style={{transform:"scale(0)",transformOrigin:"100px 100px",animation:"optinxt-popCore .4s cubic-bezier(.34,1.56,.64,1) 1.15s forwards"}}/>
          </g>
          <g style={{animation:"optinxt-nodeFloat1 3s ease-in-out 2s infinite"}}>
            <circle cx="144" cy="78" r="4.5" fill="url(#optinxt-pg2)"
              style={{opacity:0,transform:"scale(0)",transformOrigin:"144px 78px",animation:"optinxt-popNode .4s cubic-bezier(.34,1.56,.64,1) 1.3s forwards"}}/>
          </g>
          <g style={{animation:"optinxt-nodeFloat2 3.5s ease-in-out 2.2s infinite"}}>
            <circle cx="56" cy="122" r="4.5" fill="url(#optinxt-pg2)"
              style={{opacity:0,transform:"scale(0)",transformOrigin:"56px 122px",animation:"optinxt-popNode .4s cubic-bezier(.34,1.56,.64,1) 1.45s forwards"}}/>
          </g>
          <g style={{animation:"optinxt-nodeFloat3 2.8s ease-in-out 2.4s infinite"}}>
            <circle cx="132" cy="134" r="3.5" fill="url(#optinxt-ag2)" opacity="0.75"
              style={{opacity:0,transform:"scale(0)",transformOrigin:"132px 134px",animation:"optinxt-popNode .4s cubic-bezier(.34,1.56,.64,1) 1.6s forwards"}}/>
          </g>
          <g style={{animation:"optinxt-nodeFloat4 3.2s ease-in-out 2.6s infinite"}}>
            <circle cx="68" cy="66" r="3.5" fill="url(#optinxt-ag2)" opacity="0.75"
              style={{opacity:0,transform:"scale(0)",transformOrigin:"68px 66px",animation:"optinxt-popNode .4s cubic-bezier(.34,1.56,.64,1) 1.75s forwards"}}/>
          </g>
          <g style={{transformOrigin:"166px 100px",animation:"optinxt-arrowPulse 2s ease-in-out 2.5s infinite"}}>
            <path d="M 158,91 L 176,100 L 158,109" fill="none" stroke="url(#optinxt-ag2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              style={{strokeDasharray:50,strokeDashoffset:50,animation:"optinxt-drawArrow .6s cubic-bezier(.65,0,.35,1) 1.9s forwards"}}/>
          </g>
        </svg>

        {/* Animated wordmark */}
        <div style={{display:"flex",alignItems:"baseline",gap:0}}>
          <span style={{fontSize:52,fontWeight:300,letterSpacing:"-1.5px",color:"#fff",opacity:0,transform:"translateY(20px)",animation:"optinxt-slideUp .7s cubic-bezier(.16,1,.3,1) 2.1s forwards",display:"inline-block"}}>Opti</span>
          <span style={{fontSize:52,fontWeight:800,letterSpacing:"-1.5px",background:"linear-gradient(135deg,#F7931E,#F15A29,#E8421E)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",opacity:0,transform:"translateY(20px)",animation:"optinxt-slideUp .7s cubic-bezier(.16,1,.3,1) 2.3s forwards",display:"inline-block"}}>NXt</span>
        </div>

        {/* Divider wipe */}
        <div style={{height:1.5,background:"linear-gradient(90deg,transparent,rgba(247,147,30,.4),transparent)",width:0,animation:"optinxt-wipeLine .8s cubic-bezier(.16,1,.3,1) 2.5s forwards"}}/>

        {/* Tagline */}
        <div style={{fontSize:11,letterSpacing:"4.5px",textTransform:"uppercase",color:"rgba(255,255,255,.35)",fontWeight:500,opacity:0,animation:"optinxt-fadeIn 1s ease 2.7s forwards"}}>
          Enterprise AI · Workforce Intelligence
        </div>
      </div>
    </>
  );
}
