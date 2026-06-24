"use client";

import { InputHTMLAttributes } from "react";

interface OnboardingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export default function OnboardingInput({
  error,
  ...props
}: OnboardingInputProps) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <input
        {...props}
        style={{
          width: "100%",
          padding: "12px",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          lineHeight: "normal",
          color: "#000000",
          backgroundColor: "#FFFFFF",
          border: "2px solid #000000",
          boxShadow: "8px 8px 0px 0px #000000",
          outline: "none",
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
            color: "#DC2626",
            margin: 0,
          }}
        >
          {error}
        </p>
      )}
      <style jsx>{`
        input::placeholder {
          color: #9c9c9c;
        }
        input:focus {
          box-shadow: 4px 4px 0px 0px #000000;
        }
      `}</style>
    </div>
  );
}
