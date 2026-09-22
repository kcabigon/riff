"use client";

import { CadenceOption } from "@/lib/cadence";

interface CadenceOptionCardProps {
  option: CadenceOption;
  selected: boolean;
  onSelect: () => void;
}

export default function CadenceOptionCard({
  option,
  selected,
  onSelect,
}: CadenceOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "16px",
        border: selected ? "2px solid #00FF66" : "2px solid #000000",
        boxShadow: selected ? "4px 4px 0px 0px #00FF66" : "none",
        backgroundColor: "#FFFFFF",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 700,
          color: "#000000",
        }}
      >
        {option.label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "13px",
          fontWeight: 300,
          color: "#808080",
          lineHeight: 1.4,
        }}
      >
        {option.description}
      </span>
    </button>
  );
}
