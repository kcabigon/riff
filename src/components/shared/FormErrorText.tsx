"use client";

import type { CSSProperties } from "react";

interface FormErrorTextProps {
  /** Renders nothing when empty, so callers don't need their own guard. */
  message?: string | null;
  /** Spacing overrides (e.g. a margin) for layouts that aren't a gap column. */
  style?: CSSProperties;
}

// The standard inline form error line, shared by the creation flows so their
// error states stay visually identical.
export default function FormErrorText({ message, style }: FormErrorTextProps) {
  if (!message) return null;

  return (
    <p
      style={{
        fontFamily: "var(--font-dm-sans)",
        fontSize: "14px",
        fontWeight: 300,
        color: "#DC2626",
        margin: 0,
        textAlign: "center",
        ...style,
      }}
    >
      {message}
    </p>
  );
}
