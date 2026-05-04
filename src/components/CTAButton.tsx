"use client";

import { useState } from "react";
import { ButtonHTMLAttributes } from "react";

/**
 * RiffCTA visual pattern — white bg + green shadow at rest, green bg on hover.
 * Use for in-context page and card actions (club page, riff page, editor).
 * For riff-specific actions (join, start/continue writing), use RiffCTAButton instead.
 */
export default function CTAButton({
  children,
  disabled,
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      {...props}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) setIsHovered(true);
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!disabled) setIsHovered(false);
        props.onMouseLeave?.(e);
      }}
      style={{
        border: "2px solid #000000",
        padding: "12px 48px",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "16px",
        fontWeight: 300,
        lineHeight: "normal",
        color: "#000000",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "none",
        whiteSpace: "nowrap" as const,
        ...style,
        backgroundColor: isHovered
          ? "#00FF66"
          : (style?.backgroundColor ?? "#FFFFFF"),
        boxShadow: isHovered
          ? (style?.boxShadow ?? "8px 8px 0px 0px #00FF66").replace(
              "#00FF66",
              "#000000"
            )
          : (style?.boxShadow ?? "8px 8px 0px 0px #00FF66"),
      }}
    >
      {children}
    </button>
  );
}
