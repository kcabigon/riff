"use client";

import { ReactNode } from "react";

interface WelcomeNoteProps {
  children: ReactNode;
}

/**
 * Welcome note component with "Over the Rainbow" font
 * Used in onboarding flows to provide friendly messages from founders
 */
export default function WelcomeNote({ children }: WelcomeNoteProps) {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#FFFFFF",
        padding: "16px",
        fontFamily: "var(--font-over-the-rainbow)",
        fontSize: "20px",
        lineHeight: "normal",
        color: "#000000",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}
