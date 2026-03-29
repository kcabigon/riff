"use client";

import { usePathname } from "next/navigation";

export default function EnvironmentBadge() {
  const pathname = usePathname();
  const label = process.env.NEXT_PUBLIC_ENV_LABEL;

  // Leaderboard page renders its own badge
  if (pathname === "/leaderboard") return null;
  if (!label) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: 12,
        zIndex: 9999,
        backgroundColor: "#EECF01",
        color: "#000000",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "11px",
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: "12px",
        border: "1.5px solid #000000",
        boxShadow: "2px 2px 0px #000000",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
}
