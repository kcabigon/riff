"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
}

/**
 * Reusable back button component with arrow icon
 * Used in onboarding and other flows for navigation
 */
export default function BackButton({ href, onClick }: BackButtonProps) {
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
        width: "32px",
        height: "32px",
        backgroundColor: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="Go back"
    >
      <Image
        src="/icons/back_arrow.svg"
        alt="Back"
        width={32}
        height={32}
        style={{ display: "block" }}
      />
    </button>
  );
}
