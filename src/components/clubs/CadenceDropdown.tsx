"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CadenceOption, CadenceValue } from "@/lib/cadence";

interface CadenceDropdownProps {
  value: CadenceValue;
  options: CadenceOption[];
  onSelect: (value: CadenceValue) => void;
  /** Open the menu above the trigger — for a trigger sitting near the
   * bottom of a scrollable container (e.g. Modal's maxHeight/overflowY),
   * same reasoning as ShareModal's AccessDropdown. */
  openUp?: boolean;
}

// Modeled directly on ShareModal's AccessDropdown — collapsed trigger showing
// the current selection, expands into an overlay menu on click.
export default function CadenceDropdown({
  value,
  options,
  onSelect,
  openUp = false,
}: CadenceDropdownProps) {
  const [open, setOpen] = useState(false);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          border: "2px solid #000000",
          backgroundColor: open || triggerHovered ? "#F5F5F5" : "#FFFFFF",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
          }}
        >
          {current.label}
        </span>
        <Image
          src="/icons/arrow_down.svg"
          alt=""
          width={16}
          height={16}
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            [openUp ? "bottom" : "top"]: "calc(100% + 8px)",
            left: 0,
            right: 0,
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: "4px 4px 0px 0px #000000",
            zIndex: 60,
          }}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setHoveredOption(option.value)}
                onMouseLeave={() => setHoveredOption(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
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
                    border: "2px solid #000000",
                    backgroundColor: isSelected ? "#00FF66" : "#FFFFFF",
                    flexShrink: 0,
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
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
