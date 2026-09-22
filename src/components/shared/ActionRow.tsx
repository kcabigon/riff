"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Full-width disclosure row: label on the left, arrow on the right, border
 * and hover fill, no shadow.
 *
 * Styled like the app's menu convention (Dropdown/ThreeDotButton) rather than
 * CTAButton — these are disclosure rows that open something, not decisive
 * commit actions, so they get a light border and hover fill instead of a
 * heavy brutal shadow.
 *
 * Two arrow behaviours:
 * - "next" points right — the row opens another screen.
 * - "expand" points down and flips up while open — the row toggles a menu
 *   in place. Pair it with `active` so the trigger keeps its hover fill for
 *   as long as the menu is open.
 *
 * Colours are set explicitly here rather than inherited: form controls fall
 * back to the user agent's styling otherwise, which on iOS renders label text
 * in system blue.
 */
export default function ActionRow({
  label,
  onClick,
  disabled = false,
  arrow = "next",
  active = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  arrow?: "next" | "expand";
  active?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const filled = (hovered || active) && !disabled;

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "16px",
        border: "2px solid #000000",
        backgroundColor: filled ? "#F5F5F5" : "#FFFFFF",
        color: "#000000",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        textAlign: "left",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
        }}
      >
        {label}
      </span>
      <Image
        src="/icons/arrow_down.svg"
        alt=""
        width={16}
        height={16}
        style={{
          transform:
            arrow === "next"
              ? "rotate(-90deg)"
              : active
                ? "rotate(180deg)"
                : "none",
          flexShrink: 0,
        }}
      />
    </button>
  );
}
