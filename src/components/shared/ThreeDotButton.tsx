"use client";

import { useState } from "react";
import Dropdown, { DropdownItem } from "@/components/shared/Dropdown";

interface ThreeDotButtonProps {
  variant: "dark" | "light";
  items: DropdownItem[];
  align?: "left" | "right";
}

export default function ThreeDotButton({
  variant,
  items,
  align = "left",
}: ThreeDotButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isActive = isOpen || isHovered;

  const buttonStyle: React.CSSProperties = {
    background: isActive ? "#01EFFC" : "transparent",
    border: isActive ? "2px solid #000000" : "2px solid transparent",
    boxShadow: isActive ? "4px 4px 0px 0px #000000" : "none",
    color: isActive ? "#000000" : variant === "dark" ? "#FFFFFF" : "#000000",
    opacity: isActive ? 1 : variant === "dark" ? 0.7 : 0.4,
    cursor: "pointer",
    padding: "4px 6px",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    transition:
      "opacity 0.15s ease, background-color 0.15s ease, box-shadow 0.1s ease",
  };

  return (
    <Dropdown
      trigger={
        <button
          aria-label="More options"
          style={buttonStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <svg
            width="12"
            height="3"
            viewBox="0 0 12 3"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="1.5" cy="1.5" r="1.5" />
            <circle cx="6" cy="1.5" r="1.5" />
            <circle cx="10.5" cy="1.5" r="1.5" />
          </svg>
        </button>
      }
      items={items}
      align={align}
      isOpen={isOpen}
      onToggle={() => setIsOpen((o) => !o)}
      onClose={() => setIsOpen(false)}
    />
  );
}
