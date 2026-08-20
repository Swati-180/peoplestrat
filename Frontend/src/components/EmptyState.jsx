import React from "react";
import { Button } from "@/components/ui/button";

/**
 * EmptyState — standardised empty-state display
 * Props:
 *   icon: string (emoji)
 *   title: string
 *   description: string
 *   actionLabel?: string
 *   onAction?: () => void
 */
export function EmptyState({ icon = "📭", title, description, actionLabel, onAction }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 24px 40px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "48px", lineHeight: 1, marginBottom: "16px" }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: "18px",
        fontWeight: 700,
        color: "#1F2937",
        margin: "0 0 8px",
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: "14px",
        color: "#6B7280",
        lineHeight: 1.5,
        maxWidth: "340px",
        margin: 0,
        ...(actionLabel ? { marginBottom: "24px" } : {}),
      }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          style={{
            background: "#2563EB",
            color: "#FFFFFF",
            padding: "10px 22px",
            borderRadius: "6px",
            fontWeight: 600,
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            transition: "background 0.2s, transform 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#1D4ED8"}
          onMouseLeave={e => e.currentTarget.style.background = "#2563EB"}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
