"use client";

import { ButtonHTMLAttributes } from "react";

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  size?: "sm";
}

/**
 * Secondary button component with cyan background
 * Scalable and reusable across the application
 */
export default function SecondaryButton({
  children,
  loading,
  disabled,
  size,
  ...props
}: SecondaryButtonProps) {
  const isDisabled = disabled || loading;
  const isSm = size === "sm";

  const shadowDefault = isSm
    ? "4px 4px 0px 0px #000000"
    : "8px 8px 0px 0px #000000";
  const shadowHover = isSm
    ? "4px 4px 0px 0px #01EFFC"
    : "8px 8px 0px 0px #01EFFC";
  const shadowActive = isSm
    ? "2px 2px 0px 0px #01EFFC"
    : "4px 4px 0px 0px #01EFFC";
  const translateActive = isSm ? "translate(2px, 2px)" : "translate(4px, 4px)";

  return (
    <button
      {...props}
      disabled={isDisabled}
      style={{
        width: isSm ? "auto" : "100%",
        height: isSm ? "auto" : "45px",
        backgroundColor: isDisabled ? "#FFFFFF" : "#01EFFC",
        border: isDisabled ? "2px solid #9C9C9C" : "2px solid #000000",
        boxShadow: isDisabled ? "none" : shadowDefault,
        padding: isSm ? "8px 24px" : "12px 48px",
        fontFamily: "var(--font-dm-sans)",
        fontSize: isSm ? "12px" : "16px",
        fontWeight: 300,
        lineHeight: "normal",
        color: isDisabled ? "#9C9C9C" : "#000000",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        whiteSpace: "nowrap",
        ...props.style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = "#FFFFFF";
          e.currentTarget.style.borderColor = "#000000";
          e.currentTarget.style.boxShadow = shadowHover;
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = "#01EFFC";
          e.currentTarget.style.borderColor = "#000000";
          e.currentTarget.style.boxShadow = shadowDefault;
        }
        props.onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = shadowActive;
          e.currentTarget.style.transform = translateActive;
        }
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.boxShadow = shadowHover;
          e.currentTarget.style.transform = "translate(0, 0)";
        }
        props.onMouseUp?.(e);
      }}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
