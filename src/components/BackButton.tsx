"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  size?: number;
}

export default function BackButton({
  href,
  onClick,
  size = 32,
}: BackButtonProps) {
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
        width: `${size}px`,
        height: `${size}px`,
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
        width={size}
        height={size}
        style={{ display: "block" }}
      />
    </button>
  );
}
