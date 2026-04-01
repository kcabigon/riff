"use client";

import { useState } from "react";

interface EmptyRiffStateProps {
  onStartNewRiff: () => void;
  isAdmin?: boolean;
  hostName?: string | null;
}

export default function EmptyRiffState({
  onStartNewRiff,
  isAdmin = true,
  hostName,
}: EmptyRiffStateProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!isAdmin) {
    const hostFirstName = hostName?.split(" ")[0] ?? "The host";
    return (
      <div
        style={{
          padding: "40px",
          backgroundColor: "#F9F9F9",
          border: "2px dashed #E6E6E6",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#959595",
            margin: 0,
          }}
        >
          {hostFirstName} will start the next riff soon.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
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
          whiteSpace: "nowrap",
        }}
      >
        Start new riff
      </button>
    </div>
  );
}
