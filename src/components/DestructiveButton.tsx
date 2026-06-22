"use client";

import { ButtonHTMLAttributes } from "react";

interface DestructiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: "sm" | "lg";
}

export default function DestructiveButton({
  children,
  loading,
  disabled,
  size = "sm",
  style,
  ...props
}: DestructiveButtonProps) {
  const isDisabled = disabled || loading;
  const isLg = size === "lg";

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        ...(isLg ? {} : { height: "32px" }),
        padding: isLg ? "12px 48px" : "4px 20px",
        backgroundColor: isDisabled
          ? isLg
            ? "#E6E6E6"
            : "#FFFFFF"
          : "#DC2626",
        border: isDisabled && !isLg ? "2px solid #9C9C9C" : "2px solid #000000",
        boxShadow: isDisabled
          ? "none"
          : `${isLg ? "8px 8px" : "4px 4px"} 0px 0px #000000`,
        fontFamily: "var(--font-dm-sans)",
        fontSize: isLg ? "16px" : "13px",
        fontWeight: isLg ? 300 : 700,
        color: isDisabled ? "#9C9C9C" : "#FFFFFF",
        cursor: isDisabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap" as const,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.dataset.baseBg =
            e.currentTarget.style.backgroundColor;
          e.currentTarget.dataset.baseColor = e.currentTarget.style.color;
          e.currentTarget.style.backgroundColor = "#FFFFFF";
          e.currentTarget.style.color = "#DC2626";
          e.currentTarget.style.boxShadow = isLg
            ? "8px 8px 0px 0px #DC2626"
            : "4px 4px 0px 0px #DC2626";
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor =
            e.currentTarget.dataset.baseBg || "#DC2626";
          e.currentTarget.style.color =
            e.currentTarget.dataset.baseColor || "#FFFFFF";
          e.currentTarget.style.boxShadow = isLg
            ? "8px 8px 0px 0px #000000"
            : "4px 4px 0px 0px #000000";
        }
        props.onMouseLeave?.(e);
      }}
      onPointerDown={(e) => {
        if (!isDisabled) {
          const base = e.currentTarget.style.transform;
          e.currentTarget.dataset.baseTransform = base;
          e.currentTarget.style.boxShadow = isLg
            ? "4px 4px 0px 0px #DC2626"
            : "2px 2px 0px 0px #DC2626";
          e.currentTarget.style.transform = base
            ? `${base} translate(2px, 2px)`
            : "translate(2px, 2px)";
        }
        props.onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        if (!isDisabled) {
          if (e.pointerType === "touch") {
            e.currentTarget.style.backgroundColor =
              e.currentTarget.dataset.baseBg || "#DC2626";
            e.currentTarget.style.color =
              e.currentTarget.dataset.baseColor || "#FFFFFF";
            e.currentTarget.style.boxShadow = isLg
              ? "8px 8px 0px 0px #000000"
              : "4px 4px 0px 0px #000000";
          } else {
            e.currentTarget.style.boxShadow = isLg
              ? "8px 8px 0px 0px #DC2626"
              : "4px 4px 0px 0px #DC2626";
          }
          e.currentTarget.style.transform =
            e.currentTarget.dataset.baseTransform ?? "";
        }
        props.onPointerUp?.(e);
      }}
      onPointerCancel={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor =
            e.currentTarget.dataset.baseBg || "#DC2626";
          e.currentTarget.style.color =
            e.currentTarget.dataset.baseColor || "#FFFFFF";
          e.currentTarget.style.boxShadow = isLg
            ? "8px 8px 0px 0px #000000"
            : "4px 4px 0px 0px #000000";
          e.currentTarget.style.transform =
            e.currentTarget.dataset.baseTransform ?? "";
        }
        props.onPointerCancel?.(e);
      }}
    >
      {children}
    </button>
  );
}
