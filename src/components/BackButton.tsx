"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
}

/**
 * Reusable back button component with arrow icon
 * Used in onboarding and other flows for navigation
 */
export default function BackButton({ href, onClick, label }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        gap: label ? "8px" : 0,
      }}
      aria-label={label || "Go back"}
    >
      <Image
        src="/icons/back_arrow.svg"
        alt="Back"
        width={label ? 20 : 32}
        height={label ? 20 : 32}
        style={{ display: "block" }}
      />
      {label && (
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
