import React, { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";

export function OrganizationSwitcher() {
  const { 
    activeOrganization, 
    organizations, 
    setActiveOrganization, 
    isLoading 
  } = useOrganization();
  
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      ref.current?.querySelector("button")?.focus();
      return;
    }

    const itemCount = organizations?.length || 0;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % itemCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < itemCount) {
        const org = organizations[focusedIndex];
        handleSelect(org.organizationId._id);
      }
    }
  };

  const handleSelect = (orgId) => {
    setActiveOrganization(orgId);
    setIsOpen(false);
  };

  // Safe Empty State
  if (!isLoading && (!organizations || organizations.length === 0)) {
    return null; 
  }

  const isSingleOrg = organizations?.length === 1;

  return (
    <div ref={ref} style={{ position: "relative" }} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        aria-label="Select organization"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => { 
          if (!isSingleOrg && !isLoading) {
            setIsOpen(o => !o); 
            setFocusedIndex(-1);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: isOpen ? "var(--sidebar-accent)" : "none",
          border: "none",
          borderRadius: "8px",
          cursor: isSingleOrg || isLoading ? "default" : "pointer",
          padding: "6px 12px",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => {
          if (!isSingleOrg && !isLoading) e.currentTarget.style.background = "var(--sidebar-accent)";
        }}
        onMouseLeave={e => {
          if (!isSingleOrg && !isLoading) e.currentTarget.style.background = isOpen ? "var(--sidebar-accent)" : "none";
        }}
      >
        <Building2
          size={18}
          style={{ color: "var(--sidebar-foreground)" }}
        />
        
        <div style={{ textAlign: "left" }}>
          {isLoading ? (
            <div style={{ width: "120px", height: "16px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
          ) : (
            <p style={{ fontSize: "14px", fontWeight: 600, color: "#FFFFFF", lineHeight: 1.2, whiteSpace: "nowrap" }}>
              {activeOrganization?.name || "Select Organization"}
            </p>
          )}
        </div>
        
        {!isSingleOrg && !isLoading && (
          <ChevronDown
            size={16}
            style={{
              color: "var(--sidebar-foreground)",
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              marginLeft: "4px"
            }}
          />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && !isSingleOrg && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            width: "280px",
            background: "#FFFFFF",
            border: "1px solid #D4E5F7",
            borderRadius: "12px",
            boxShadow: "0 16px 48px rgba(5,50,89,0.15)",
            zIndex: 9999,
            overflow: "hidden",
            animation: "dropdownIn 0.18s ease",
          }}
        >
          <div style={{ padding: "12px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Organizations
            </p>
          </div>
          
          <div style={{ padding: "8px" }}>
            {organizations.map((org, index) => {
              const isActive = activeOrganization?._id === org.organizationId._id;
              const isFocused = focusedIndex === index;
              
              return (
                <button
                  key={org.organizationId._id}
                  role="menuitem"
                  onClick={() => handleSelect(org.organizationId._id)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "10px 12px",
                    background: isFocused ? "#F1F5F9" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontSize: "14px", 
                      fontWeight: isActive ? 600 : 500, 
                      color: isActive ? "#0F172A" : "#334155",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {org.organizationId.name}
                    </p>
                    <p style={{ 
                      fontSize: "12px", 
                      color: "#64748B", 
                      textTransform: "capitalize",
                      marginTop: "2px"
                    }}>
                      {org.role}
                    </p>
                  </div>
                  
                  {isActive && (
                    <Check size={16} style={{ color: "#2563EB", flexShrink: 0, marginLeft: "12px" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
