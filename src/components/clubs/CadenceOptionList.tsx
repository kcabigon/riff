"use client";

import { useState, type ReactNode } from "react";
import { CadenceOption, CadenceValue } from "@/lib/cadence";

interface CadenceOptionListProps {
  // Null when nothing in the list is picked yet.
  value: CadenceValue | null;
  options: CadenceOption[];
  onSelect: (value: CadenceValue) => void;
  // Optional note under the last option, inside the same card — the cadence
  // modal's "what this change does" line, kept on white rather than the
  // modal's noise background.
  footer?: ReactNode;
}

// Modeled on ShareModal's AccessDropdown row styling (radio circle + label,
// bordered container), permanently visible rather than behind a trigger —
// avoids a popover's absolute-positioned menu getting clipped by an
// ancestor's overflow (e.g. Modal's overflow-y: auto).
export default function CadenceOptionList({
  value,
  options,
  onSelect,
  footer,
}: CadenceOptionListProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: "4px 4px 0px 0px #000000",
      }}
    >
      {options.map((option, i) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            onMouseEnter={() => setHoveredOption(option.value)}
            onMouseLeave={() => setHoveredOption(null)}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
              width: "100%",
              border: "none",
              borderBottom:
                i === options.length - 1 ? "none" : "1px solid #E6E6E6",
              backgroundColor: isSelected
                ? "#F5F5F5"
                : hoveredOption === option.value
                  ? "#F5F5F5"
                  : "#FFFFFF",
              padding: "16px",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "64px",
                border: "1px solid #000000",
                backgroundColor: isSelected ? "#00FF66" : "#FFFFFF",
                flexShrink: 0,
                alignSelf: "center",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
              }}
            >
              {option.label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
              }}
            >
              &middot; {option.description}
            </span>
          </button>
        );
      })}
      {footer && (
        <div style={{ borderTop: "1px solid #E6E6E6", padding: "16px" }}>
          {footer}
        </div>
      )}
    </div>
  );
}
