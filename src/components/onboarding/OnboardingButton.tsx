"use client";

import { ButtonHTMLAttributes } from "react";

interface OnboardingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  loading?: boolean;
}

export default function OnboardingButton({
  variant = "primary",
  loading = false,
  children,
  disabled,
  ...props
}: OnboardingButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        width: "100%",
        padding: "12px 48px",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "16px",
        fontWeight: 300,
        lineHeight: "normal",
        color: isPrimary ? "#000000" : "#000000",
        backgroundColor: isPrimary ? "#00FF66" : "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: "8px 8px 0px 0px #000000",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.5 : 1,
        transition: "all 0.2s",
        boxSizing: "border-box",
        ...props.style,
      }}
    >
      {loading ? "Loading..." : children}
      <style jsx>{`
        button:hover:not(:disabled) {
          background-color: ${isPrimary ? "#FFFFFF" : "#00FF66"};
          box-shadow: 4px 4px 0px 0px ${isPrimary ? "#00FF66" : "#000000"};
        }
      `}</style>
    </button>
  );
}
