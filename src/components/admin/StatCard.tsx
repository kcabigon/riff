"use client";

interface StatCardProps {
  label: string;
  value: number;
  accent: string;
  detail?: string;
  format?: boolean;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function StatCard({
  label,
  value,
  accent,
  detail,
  format,
}: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: `8px 8px 0px 0px ${accent}`,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 700,
          color: "#808080",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "36px",
          fontWeight: 400,
          color: "#000000",
          lineHeight: 1.1,
        }}
      >
        {format ? formatNumber(value) : value.toLocaleString()}
      </span>
      {detail && (
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            color: "#808080",
            marginTop: "4px",
          }}
        >
          {detail}
        </span>
      )}
    </div>
  );
}
