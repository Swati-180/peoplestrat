import React from "react";

/**
 * SkeletonCard — animated shimmer placeholder
 * Props:
 *   width?: string/number  (default "100%")
 *   height?: string/number (default 100)
 *   borderRadius?: number  (default 12)
 *   style?: object         (extra style overrides)
 */
export function SkeletonCard({ width = "100%", height = 100, borderRadius = 12, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #E5E7EB 25%, #D1D5DB 50%, #E5E7EB 75%)",
        backgroundSize: "400% 100%",
        animation: "shimmer 1.5s infinite linear",
        ...style,
      }}
    />
  );
}

/**
 * SkeletonKPICard — matches the exact shape of a kpi-analytics-card
 */
export function SkeletonKPICard() {
  return (
    <div className="kpi-analytics-card" style={{ pointerEvents: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <SkeletonCard width={80} height={10} borderRadius={4} style={{ marginBottom: 12 }} />
          <SkeletonCard width={110} height={28} borderRadius={6} />
        </div>
        <SkeletonCard width={44} height={44} borderRadius={10} />
      </div>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400% 0; }
          100% { background-position: 400% 0; }
        }
      `}</style>
    </div>
  );
}

/**
 * SkeletonTableRow — matches a table row shape
 */
export function SkeletonTableRow({ cols = 5 }) {
  return (
    <tr style={{ borderBottom: "1px solid #F0F7FF" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "16px 12px" }}>
          <SkeletonCard height={14} borderRadius={4} width={i === 0 ? 140 : "70%"} />
        </td>
      ))}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400% 0; }
          100% { background-position: 400% 0; }
        }
      `}</style>
    </tr>
  );
}
