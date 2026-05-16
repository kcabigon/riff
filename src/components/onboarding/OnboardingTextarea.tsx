"use client";

import { TextareaHTMLAttributes } from "react";

interface OnboardingTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export default function OnboardingTextarea({
  error,
  ...props
}: OnboardingTextareaProps) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
      <textarea
        {...props}
        style={{
          width: "100%",
          minHeight: "120px",
          padding: "12px",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          lineHeight: "1.5",
          color: "#000000",
          backgroundColor: "#FFFFFF",
          border: "2px solid #000000",
          boxShadow: "8px 8px 0px 0px #000000",
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box",
          ...props.style,
        }}
      />
      {error && (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#FF0000",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}
      <style jsx>{`
        textarea::placeholder {
          color: #9c9c9c;
        }
        textarea:focus {
          box-shadow: 4px 4px 0px 0px #000000;
        }
      `}</style>
    </div>
  );
}
