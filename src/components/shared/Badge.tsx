import React from "react";

type BadgeVariant = "green" | "cyan" | "yellow" | "pink";

interface BadgeTheme {
  backgroundColor: string;
  borderColor: string;
  color: string;
}

const THEMES: Record<BadgeVariant, BadgeTheme> = {
  green: {
    backgroundColor: "#00FF66",
    borderColor: "#000000",
    color: "#000000",
  },
  cyan: {
    backgroundColor: "#01EFFC",
    borderColor: "#000000",
    color: "#000000",
  },
  yellow: {
    backgroundColor: "#EECF01",
    borderColor: "#000000",
    color: "#000000",
  },
  pink: {
    backgroundColor: "#C01582",
    borderColor: "#000000",
    color: "#FFFFFF",
  },
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Badge({ variant, children, style }: BadgeProps) {
  const { backgroundColor, borderColor, color } = THEMES[variant];
  return (
    <span
      style={{
        position: "absolute",
        top: "8px",
        left: "8px",
        display: "inline-block",
        backgroundColor,
        color,
        border: `2px solid ${borderColor}`,
        padding: "2px 6px",
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
