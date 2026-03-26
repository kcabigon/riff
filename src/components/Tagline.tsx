"use client";

import Image from "next/image";

interface TaglineProps {
  text: string;
  color?: string;
  textColor?: string;
  width?: number;
  fontSize?: number;
}

/**
 * Reusable tagline component with colored vector highlight effect
 * Used across auth and onboarding flows
 * @param text - The text to display
 * @param color - Background vector color (hex format, e.g., "#EECF01") - uses CSS filter to tint
 * @param textColor - Text color (defaults to white for custom colors, black for default yellow)
 * @param width - Custom width in pixels (defaults to 262px)
 */
export default function Tagline({
  text,
  color,
  textColor,
  width = 262,
  fontSize = 20,
}: TaglineProps) {
  const foregroundColor = textColor || (color ? "#FFFFFF" : "#000000");

  // Generate CSS filter for color transformation
  // This is a simplified approach - for yellow (#EECF01), no filter
  const getColorFilter = (hexColor?: string) => {
    if (!hexColor || hexColor === "#EECF01") return "none";

    // Convert hex to filter for common colors
    const colorFilters: Record<string, string> = {
      "#C01582":
        "brightness(0) saturate(100%) invert(18%) sepia(82%) saturate(3721%) hue-rotate(307deg) brightness(95%) contrast(98%)", // pink
      "#955CB5":
        "brightness(0) saturate(100%) invert(42%) sepia(42%) saturate(887%) hue-rotate(232deg) brightness(94%) contrast(89%)", // purple
      "#FF6B35":
        "brightness(0) saturate(100%) invert(57%) sepia(87%) saturate(2645%) hue-rotate(339deg) brightness(101%) contrast(101%)", // orange
      "#01EFFC":
        "brightness(0) saturate(100%) invert(79%) sepia(91%) saturate(2670%) hue-rotate(137deg) brightness(103%) contrast(101%)", // cyan
      "#00FF66":
        "brightness(0) saturate(100%) invert(61%) sepia(97%) saturate(1000%) hue-rotate(88deg) brightness(102%) contrast(101%)", // green
    };

    return colorFilters[hexColor] || "none";
  };

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${fontSize + 6}px`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        src="/images/tagline_vector.svg"
        alt=""
        fill
        style={{
          objectFit: "contain",
          filter: getColorFilter(color),
        }}
      />
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: `${fontSize}px`,
          fontWeight: 300,
          lineHeight: "normal",
          color: foregroundColor,
          margin: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        {text}
      </p>
    </div>
  );
}
