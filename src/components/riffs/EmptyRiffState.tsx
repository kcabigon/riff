"use client";

import { useState } from "react";

interface EmptyRiffStateProps {
  onStartNewRiff: () => void;
}

export default function EmptyRiffState({ onStartNewRiff }: EmptyRiffStateProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        width: "100%",
      }}
    >
      {/* Header */}
      <h3
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "20px",
          fontWeight: 300,
          lineHeight: 1.2,
          color: "#000000",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        NO CURRENT RIFF
      </h3>

      {/* Action Button */}
      <button
        onClick={onStartNewRiff}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: isHovered ? "#00FF66" : "#FFFFFF",
          border: "2px solid #000000",
          boxShadow: isHovered
            ? "8px 8px 0px 0px #000000"
            : "8px 8px 0px 0px #01EFFC",
          padding: "12px 48px",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          cursor: "pointer",
          transition: "none",
          width: "100%",
          textAlign: "center",
        }}
      >
        Start new riff
      </button>
    </div>
  );
}
