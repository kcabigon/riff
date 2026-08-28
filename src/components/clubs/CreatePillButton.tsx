"use client";

import { useState } from "react";
import Image from "next/image";

interface CreatePillButtonProps {
  label: string;
  onClick?: () => void;
  icon?: "chevron" | "plus";
  // Leading = before the label (reads as "do something new", used for the
  // "+" on Create/New Riff). Trailing = after the label (reads as "pick
  // from a list", used for the chevron on Clubs). Default trailing.
  iconLeading?: boolean;
  // Hides the icon under 768px, keeping just the text label — for cases
  // where the icon doesn't earn its space at pill width on mobile.
  hideIconOnMobile?: boolean;
  // External "open" state to keep the shadow accent while a dropdown menu
  // this button triggers is open, even if the mouse isn't hovering it.
  forceActive?: boolean;
  // Swaps the resting/active shadow colors (cyan at rest, green active)
  // instead of the default (green at rest, cyan active) — gives Clubs a
  // distinct feel from Create/New Riff without a different color scheme.
  reverseShadow?: boolean;
  // On mobile, drop the pill bg/border/shadow and the text label — show
  // just the icon, matching the app's compact nav treatment.
  compactOnMobile?: boolean;
}

const ICON_SRC = {
  chevron: "/icons/arrow_down.svg",
  plus: "/icons/add.svg",
};

export default function CreatePillButton({
  label,
  onClick,
  icon,
  iconLeading = false,
  hideIconOnMobile = false,
  forceActive = false,
  reverseShadow = false,
  compactOnMobile = false,
}: CreatePillButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const active = isHovered || forceActive;
  const restColor = reverseShadow ? "#01EFFC" : "#00FF66";
  const activeColor = reverseShadow ? "#00FF66" : "#01EFFC";

  const iconEl = icon && (
    <Image
      src={ICON_SRC[icon]}
      alt=""
      width={16}
      height={16}
      className={
        hideIconOnMobile
          ? "create-pill-icon hide-icon-mobile"
          : "create-pill-icon"
      }
      style={{ filter: "invert(1)" }}
    />
  );

  return (
    <>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={compactOnMobile ? "create-pill compact-mobile" : undefined}
        style={{
          backgroundColor: "#000000",
          border: "2px solid #FFFFFF",
          boxShadow: `4px 4px 0px 0px ${active ? activeColor : restColor}`,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          transition: "none",
        }}
      >
        {iconLeading && iconEl}

        <span
          className="create-pill-label"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#FFFFFF",
            transition: "none",
          }}
        >
          {label}
        </span>

        {!iconLeading && iconEl}
      </button>

      {(compactOnMobile || hideIconOnMobile) && (
        <style>{`
          @media (max-width: 767px) {
            .hide-icon-mobile { display: none; }
            ${
              compactOnMobile
                ? `.compact-mobile {
                    background: none !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                  }
                  .compact-mobile .create-pill-label { display: none; }
                  /* Match the other navbar controls' size (logo/bell/avatar
                     are ~40px tall) instead of the small 16px in-pill icon size. */
                  .compact-mobile .create-pill-icon {
                    width: 40px !important;
                    height: 40px !important;
                  }`
                : ""
            }
          }
        `}</style>
      )}
    </>
  );
}
