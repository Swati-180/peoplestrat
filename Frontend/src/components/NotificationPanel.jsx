import React, { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle, Info, CheckCircle, RefreshCw, MessageSquare, X, Trash2 } from "lucide-react";

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: "alert",
    title: "Burnout Risk Detected",
    description: "1 employee is showing critical fatigue patterns.",
    time: "2 mins ago",
    read: false,
    path: "/fatigue",
  },
  {
    id: 2,
    type: "info",
    title: "New Features Available",
    description: "Check out the updated 6×6 Workforce Intelligence Matrix.",
    time: "1 hour ago",
    read: false,
    path: "/six-by-six",
  },
  {
    id: 3,
    type: "success",
    title: "Monthly Review Submitted",
    description: "Your performance review has been successfully recorded.",
    time: "3 hours ago",
    read: false,
    path: "/settings",
  },
  {
    id: 4,
    type: "alert",
    title: "Skills Mismatch Detected",
    description: "Gap analysis found role misalignment in 2 employees.",
    time: "Yesterday",
    read: true,
    path: "/gap-analysis",
  },
  {
    id: 5,
    type: "update",
    title: "Manager Sent Feedback",
    description: "You have a new message from your reporting manager.",
    time: "2 days ago",
    read: true,
    path: "/settings",
  },
];

const TYPE_CONFIG = {
  alert:   { color: "#DC2626", bg: "#FEF2F2", Icon: AlertTriangle },
  info:    { color: "#2563EB", bg: "#EFF6FF", Icon: Info },
  success: { color: "#16A34A", bg: "#F0FDF4", Icon: CheckCircle },
  update:  { color: "#6B7280", bg: "#F9FAFB", Icon: RefreshCw },
  message: { color: "#7C3AED", bg: "#F5F3FF", Icon: MessageSquare },
};

export function NotificationPanel({ onNavigate }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const filtered = notifications.filter(n => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "alerts") return n.type === "alert";
    return true;
  });

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);
  const markRead = (id) => setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        aria-label="Notifications"
        onClick={() => setIsOpen(o => !o)}
        style={{
          background: isOpen ? "var(--sidebar-accent)" : "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "8px",
          position: "relative",
          color: isOpen ? "#FFFFFF" : "var(--sidebar-foreground)",
          transition: "all 0.15s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "var(--sidebar-accent)";
          e.currentTarget.style.color = "#FFFFFF";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = isOpen ? "var(--sidebar-accent)" : "none";
          e.currentTarget.style.color = isOpen ? "#FFFFFF" : "var(--sidebar-foreground)";
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            minWidth: "14px",
            height: "14px",
            background: "#EF4444",
            borderRadius: "50%",
            border: "2px solid var(--sidebar)",
            color: "#FFF",
            fontSize: "8px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 2px",
            boxShadow: "0 0 10px rgba(239, 68, 68, 0.4)",
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: "360px",
          maxHeight: "480px",
          background: "#FFFFFF",
          border: "1px solid #D4E5F7",
          borderRadius: "14px",
          boxShadow: "0 20px 60px rgba(5,50,89,0.15)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "dropdownIn 0.18s ease",
        }}>
          <style>{`
            @keyframes dropdownIn {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #EBF4FF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "#053259", textTransform: "uppercase" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{ marginLeft: "8px", background: "#DC2626", color: "#FFF", fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "8px" }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} title="Mark all read" style={{ background: "none", border: "none", cursor: "pointer", color: "#6A89A7", fontSize: "11px", fontWeight: 600, padding: "4px 6px", borderRadius: "6px" }}>
                  Mark all read
                </button>
              )}
              <button onClick={clearAll} title="Clear all" style={{ background: "none", border: "none", cursor: "pointer", color: "#6B8299", padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center" }}>
                <Trash2 size={14} />
              </button>
              <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B8299", padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center" }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", padding: "8px 16px 0", gap: "4px", borderBottom: "1px solid #EBF4FF" }}>
            {["all", "unread", "alerts"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? "#EBF4FF" : "none",
                  color: activeTab === tab ? "#053259" : "#6B8299",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: "6px 6px 0 0",
                  fontSize: "12px",
                  fontWeight: activeTab === tab ? 700 : 500,
                  textTransform: "capitalize",
                  transition: "all 0.15s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "48px 20px", textAlign: "center" }}>
                <Bell size={32} style={{ color: "#D4E5F7", margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#1E2D3D", marginBottom: "6px" }}>You're all caught up</p>
                <p style={{ fontSize: "12px", color: "#6B8299" }}>No new notifications at this time.</p>
              </div>
            ) : (
              filtered.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.update;
                return (
                  <div
                    key={n.id}
                    onClick={() => { markRead(n.id); onNavigate?.(n.path); setIsOpen(false); }}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "13px 16px",
                      borderBottom: "1px solid #F0F7FF",
                      cursor: "pointer",
                      background: n.read ? "transparent" : "rgba(235,244,255,0.5)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F0F7FF"}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(235,244,255,0.5)"}
                  >
                    <div style={{
                      width: "34px", height: "34px", minWidth: "34px", borderRadius: "9px",
                      background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <cfg.Icon size={15} style={{ color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                        <p style={{ fontSize: "13px", fontWeight: n.read ? 500 : 700, color: "#1E2D3D", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {n.title}
                        </p>
                        <span style={{ fontSize: "10px", color: "#9CA3AF", flexShrink: 0 }}>{n.time}</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#6B8299", marginTop: "2px", lineHeight: 1.4 }}>{n.description}</p>
                    </div>
                    {!n.read && (
                      <div style={{ width: "6px", height: "6px", minWidth: "6px", borderRadius: "50%", background: "#2563EB", marginTop: "6px" }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
