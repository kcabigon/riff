import React from "react";

type BadgeVariant = "green" | "cyan" | "yellow" | "purple";

const COLORS: Record<BadgeVariant, string> = {
  green: "#00FF66",
  cyan: "#01EFFC",
  yellow: "#EECF01",
  purple: "#955CB5",
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Badge({ variant, children, style }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: COLORS[variant],
        color: "#000000",
        border: "2px solid #000000",
        padding: "4px 8px",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
