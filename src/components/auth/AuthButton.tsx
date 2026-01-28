"use client";

import { ButtonHTMLAttributes } from "react";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function AuthButton({
  children,
  loading,
  disabled,
  ...props
}: AuthButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        width: "100%",
        height: "45px",
        backgroundColor: isDisabled ? "#FFFFFF" : "#00FF66",
        border: isDisabled ? "2px solid #9C9C9C" : "2px solid #000000",
        boxShadow: isDisabled ? "none" : "8px 8px 0px 0px #000000",
        padding: "12px 48px",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "16px",
        fontWeight: 300,
        lineHeight: "normal",
        color: isDisabled ? "#9C9C9C" : "#000000",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...props.style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = "#FFFFFF";
          e.currentTarget.style.borderColor = "#000000";
          e.currentTarget.style.boxShadow = "8px 8px 0px 0px #00FF66";
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = "#00FF66";
          e.currentTarget.style.borderColor = "#000000";
          e.currentTarget.style.boxShadow = "8px 8px 0px 0px #000000";
        }
        props.onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = "4px 4px 0px 0px #00FF66";
          e.currentTarget.style.transform = "translate(4px, 4px)";
        }
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = "8px 8px 0px 0px #00FF66";
          e.currentTarget.style.transform = "translate(0, 0)";
        }
        props.onMouseUp?.(e);
      }}
    >
      {loading ? "Sending..." : children}
    </button>
  );
}
