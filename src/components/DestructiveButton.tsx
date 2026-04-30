"use client";

import { ButtonHTMLAttributes } from "react";

interface DestructiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export default function DestructiveButton({
  children,
  loading,
  disabled,
  style,
  ...props
}: DestructiveButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        height: "32px",
        padding: "4px 20px",
        backgroundColor: isDisabled ? "#FFFFFF" : "#DC2626",
        border: isDisabled ? "2px solid #9C9C9C" : "2px solid #000000",
        boxShadow: isDisabled ? "none" : "4px 4px 0px 0px #000000",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "13px",
        fontWeight: 700,
        color: isDisabled ? "#9C9C9C" : "#FFFFFF",
        cursor: isDisabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled)
          e.currentTarget.style.boxShadow = "4px 4px 0px 0px #DC2626";
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isDisabled)
          e.currentTarget.style.boxShadow = "4px 4px 0px 0px #000000";
        props.onMouseLeave?.(e);
      }}
      onPointerDown={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = "2px 2px 0px 0px #DC2626";
          e.currentTarget.style.transform = "translate(2px, 2px)";
        }
        props.onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = "4px 4px 0px 0px #000000";
          e.currentTarget.style.transform = "translate(0, 0)";
        }
        props.onPointerUp?.(e);
      }}
      onPointerCancel={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = "4px 4px 0px 0px #000000";
          e.currentTarget.style.transform = "translate(0, 0)";
        }
        props.onPointerCancel?.(e);
      }}
    >
      {loading ? "Deleting..." : children}
    </button>
  );
}
