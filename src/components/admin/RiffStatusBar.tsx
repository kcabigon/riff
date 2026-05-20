"use client";

interface RiffStatusBarProps {
  statuses: {
    draft: number;
    active: number;
    revealed: number;
    completed: number;
  };
  total: number;
}

const STATUS_CONFIG = [
  { key: "draft" as const, label: "Draft", color: "#E6E6E6", textColor: "#000000" },
  { key: "active" as const, label: "Active", color: "#EECF01", textColor: "#000000" },
  { key: "revealed" as const, label: "Revealed", color: "#01EFFC", textColor: "#000000" },
  { key: "completed" as const, label: "Completed", color: "#00FF66", textColor: "#000000" },
];

export default function RiffStatusBar({ statuses, total }: RiffStatusBarProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Visual bar */}
      <div
        style={{
          display: "flex",
          height: "48px",
          border: "2px solid #000000",
          overflow: "hidden",
        }}
      >
        {STATUS_CONFIG.map(({ key, color }) => {
          const count = statuses[key];
          if (count === 0) return null;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div
              key={key}
              style={{
                width: `${pct}%`,
                backgroundColor: color,
                minWidth: count > 0 ? "2px" : 0,
              }}
            />
          );
        })}
        {total === 0 && (
          <div style={{ flex: 1, backgroundColor: "#F5F5F5" }} />
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        {STATUS_CONFIG.map(({ key, label, color, textColor }) => (
          <div
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: color,
                border: "2px solid #000000",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: textColor,
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 700,
                color: "#000000",
              }}
            >
              {statuses[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
