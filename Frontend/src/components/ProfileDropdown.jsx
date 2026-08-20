import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronDown,
  User,
  Settings,
  Bell,
  Lock,
  HelpCircle,
  Keyboard,
  LogOut,
} from "lucide-react";

export function ProfileDropdown({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef(null);
  const { logout } = useAuth();
  const [, navigate] = useLocation();

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ESC key
  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape") { setIsOpen(false); setFocusedIndex(-1); }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const menuItems = [
    { label: "View Full Profile", icon: User, action: () => navigate("/settings"), id: "profile" },
    { label: "Account Settings", icon: Settings, action: () => navigate("/settings"), id: "account" },
    { label: "Preferences & Notifications", icon: Bell, action: () => navigate("/settings"), id: "prefs" },
    { label: "Change Password", icon: Lock, action: () => navigate("/settings"), id: "password" },
    null, // divider
    { label: "Help & Support", icon: HelpCircle, action: () => navigate("/documentation"), id: "help" },
    null, // divider
    { label: "Logout", icon: LogOut, action: async () => { await logout(); navigate("/login"); }, id: "logout", danger: true },
  ];

  const actionableItems = menuItems.filter(Boolean);

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex(i => Math.min(i + 1, actionableItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      actionableItems[focusedIndex]?.action();
      setIsOpen(false);
    }
  };

  if (!user) return null;

  return (
    <div ref={ref} style={{ position: "relative" }} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        aria-label="Open user menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => { setIsOpen(o => !o); setFocusedIndex(-1); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: isOpen ? "var(--sidebar-accent)" : "none",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          padding: "4px 6px 4px 4px",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--sidebar-accent)"}
        onMouseLeave={e => e.currentTarget.style.background = isOpen ? "var(--sidebar-accent)" : "none"}
      >
        <Avatar style={{ width: "32px", height: "32px", flexShrink: 0 }}>
          <AvatarFallback style={{ background: "#6A89A7", color: "#fff", fontSize: "12px", fontWeight: 600 }}>
            {user.username?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div style={{ textAlign: "left" }}>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2, whiteSpace: "nowrap" }}>
            {user.username}
          </p>
          <p style={{ fontSize: "11px", color: "var(--sidebar-foreground)", opacity: 0.8, textTransform: "capitalize", lineHeight: 1.2 }}>
            {user.role}
          </p>
        </div>
        <ChevronDown
          size={14}
          style={{
            color: "var(--sidebar-foreground)",
            transition: "transform 0.2s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "260px",
            background: "#FFFFFF",
            border: "1px solid #D4E5F7",
            borderRadius: "12px",
            boxShadow: "0 16px 48px rgba(5,50,89,0.15)",
            zIndex: 9999,
            overflow: "hidden",
            animation: "dropdownIn 0.18s ease",
          }}
        >
          <style>{`
            @keyframes dropdownIn {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* User Header */}
          <div style={{ padding: "16px", background: "linear-gradient(135deg, #053259 0%, #0a4a7a 100%)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar style={{ width: "42px", height: "42px" }}>
                <AvatarFallback style={{ background: "rgba(106,137,167,0.6)", color: "#fff", fontSize: "15px", fontWeight: 700 }}>
                  {user.username?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#FFFFFF" }}>{user.username}</p>
                <p style={{ fontSize: "12px", color: "rgba(189,221,252,0.8)", marginTop: "2px" }}>{user.email || `${user.username}@company.com`}</p>
                <span style={{
                  display: "inline-block", marginTop: "4px",
                  background: "rgba(136,189,242,0.25)", border: "1px solid rgba(136,189,242,0.3)",
                  color: "#88BDF2", fontSize: "10px", fontWeight: 700,
                  padding: "1px 8px", borderRadius: "4px", textTransform: "capitalize",
                }}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: "6px 0" }}>
            {menuItems.map((item, i) => {
              if (item === null) {
                return <div key={`div-${i}`} style={{ height: "1px", background: "#EBF4FF", margin: "4px 0" }} />;
              }
              const actionIdx = actionableItems.indexOf(item);
              const isFocused = focusedIndex === actionIdx;
              return (
                <button
                  key={item.id}
                  role="menuitem"
                  onClick={() => { item.action(); setIsOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    width: "100%",
                    padding: "10px 16px",
                    background: isFocused ? "#F0F7FF" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: item.danger ? "#DC2626" : "#1E2D3D",
                    fontSize: "14px",
                    fontWeight: 500,
                    textAlign: "left",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = item.danger ? "#FFF5F5" : "#F0F7FF"}
                  onMouseLeave={e => e.currentTarget.style.background = isFocused ? "#F0F7FF" : "transparent"}
                >
                  <item.icon size={16} style={{ color: item.danger ? "#DC2626" : "#6A89A7", flexShrink: 0 }} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
