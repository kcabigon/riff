"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

// --- Item types ---

interface DropdownActionItem {
  type: "action";
  label: string;
  icon?: ReactNode;
  active?: boolean;
  color?: string;
  backgroundColor?: string;
  /** Render the label in a specific typeface (e.g. a font picker). Defaults to DM Sans. */
  labelFontFamily?: string;
  /** If set, clicking first shows this label as a confirmation step. A second click executes onClick. */
  confirm?: string;
  onClick: () => void;
}

interface DropdownDividerItem {
  type: "divider";
}

export type DropdownItem = DropdownActionItem | DropdownDividerItem;

// --- Props ---

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  minWidth?: number;
  size?: "sm";
  /** Open the menu above the trigger instead of below (e.g. for a bottom-anchored toolbar). */
  openUp?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export default function Dropdown({
  trigger,
  items,
  align = "right",
  minWidth = 160,
  size,
  openUp = false,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  onClose: controlledOnClose,
}: DropdownProps) {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : localIsOpen;

  const handleToggle = () => {
    if (isControlled) {
      controlledOnToggle?.();
    } else {
      setLocalIsOpen((o) => !o);
    }
  };

  const handleClose = () => {
    setConfirmingIndex(null);
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setLocalIsOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  });

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Trigger */}
      <div onClick={handleToggle} style={{ cursor: "pointer" }}>
        {trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            [openUp ? "bottom" : "top"]: "calc(100% + 8px)",
            [align === "right" ? "right" : "left"]: 0,
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: "4px 4px 0px 0px #000000",
            minWidth: `${minWidth}px`,
            zIndex: 60,
          }}
        >
          {items.map((item, i) => {
            if (item.type === "divider") {
              return (
                <div
                  // eslint-disable-next-line react/no-array-index-key -- dropdown items are stable during their visible lifetime
                  key={`divider-${i}`}
                  style={{
                    height: 0,
                    borderTop: "1px solid #E6E6E6",
                    margin: "4px 0",
                  }}
                />
              );
            }

            const isConfirming = confirmingIndex === i;
            const displayLabel =
              isConfirming && item.confirm ? item.confirm : item.label;

            return (
              <button
                // eslint-disable-next-line react/no-array-index-key -- dropdown items are stable during their visible lifetime
                key={`item-${i}`}
                onClick={() => {
                  if (item.confirm !== undefined) {
                    if (isConfirming) {
                      item.onClick();
                      handleClose();
                    } else {
                      setConfirmingIndex(i);
                    }
                  } else {
                    item.onClick();
                    handleClose();
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  textAlign: "left",
                  background: item.backgroundColor || "none",
                  border: "none",
                  padding: size === "sm" ? "8px 12px" : "12px 16px",
                  fontFamily: item.labelFontFamily || "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: isConfirming ? 500 : item.active ? 700 : 300,
                  color: item.color || "#000000",
                  cursor: item.active ? "default" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.backgroundColor =
                      item.backgroundColor || "#F5F5F5";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    item.backgroundColor || "transparent";
                }}
              >
                {item.icon && item.icon}
                {displayLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
