"use client";

import { useState } from "react";

interface ExpandRiffButtonProps {
  // Everyone who has a progress card waiting behind this — club members plus
  // anyone who submitted and has since left.
  total: number;
  // How many of them have actually written something. Worth showing: it's the
  // difference between "nobody's started, come back later" and "three people
  // are already in, go read", which is the whole reason to open this.
  started: number;
  onClick: () => void;
}

// Stands in for a freshly opened riff's progress grid when there are pieces
// waiting to be read above it. A new riff renders one card per member, nearly
// all of them empty, which pushes the actual reading below the fold — so the
// grid waits for a click. Borrows the upload drop zone's dashed treatment and
// hover, being the same kind of "something goes here" container.
export default function ExpandRiffButton({
  total,
  started,
  onClick,
}: ExpandRiffButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const label =
    started === 0
      ? `Nobody's started yet — show all ${total}`
      : `${started} of ${total} started — show progress`;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "block",
        width: "100%",
        marginTop: "48px",
        padding: "24px",
        backgroundColor: isHovered ? "#F5F5F5" : "transparent",
        border: `2px dashed ${isHovered ? "#000000" : "#CCCCCC"}`,
        cursor: "pointer",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "16px",
        fontWeight: 300,
        color: isHovered ? "#000000" : "#808080",
        textAlign: "center",
      }}
    >
      {label}
    </button>
  );
}
