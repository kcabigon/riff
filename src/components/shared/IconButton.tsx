"use client";

import { useState } from "react";

// Same hover treatment as ThreeDotButton — cyan fill, black border + shadow
// on hover — so every small icon action in the app shares one interaction language.
export default function IconButton({
  onClick,
  ariaLabel,
  variant = "light",
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  ariaLabel: string;
  variant?: "dark" | "light";
  children: (color: string) => React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const color = isHovered
    ? "#000000"
    : variant === "dark"
      ? "#FFFFFF"
      : "#000000";
  const opacity = isHovered ? 1 : variant === "dark" ? 0.7 : 0.4;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={ariaLabel}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isHovered ? "#01EFFC" : "transparent",
        border: isHovered ? "2px solid #000000" : "2px solid transparent",
        boxShadow: isHovered ? "4px 4px 0px 0px #000000" : "none",
        opacity,
        padding: "4px 6px",
        cursor: "pointer",
        transition:
          "opacity 0.15s ease, background-color 0.15s ease, box-shadow 0.1s ease",
      }}
    >
      {children(color)}
    </button>
  );
}
