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
  /** Preferred direction hint. Auto-flips based on available space inside the nearest scroll container. */
  openUp?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

const MENU_HEIGHT = 100; // 2 items × ~36px + 4px borders + 4px shadow + 8px gap + buffer

/** Walk up the DOM to find the nearest scrollable ancestor. */
function findScrollContainer(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll") return parent;
    parent = parent.parentElement;
  }
  return null;
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
  const [effectiveOpenUp, setEffectiveOpenUp] = useState(openUp);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : localIsOpen;

  const computeDirection = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const container = findScrollContainer(el);
    const containerRect = container?.getBoundingClientRect();
    const spaceBelow =
      (containerRect?.bottom ?? window.innerHeight) - rect.bottom;
    const spaceAbove = rect.top - (containerRect?.top ?? 0);
    // Respect the openUp hint but flip if there isn't enough room in that direction
    if (openUp) {
      setEffectiveOpenUp(spaceAbove >= MENU_HEIGHT || spaceBelow < MENU_HEIGHT);
    } else {
      setEffectiveOpenUp(spaceBelow < MENU_HEIGHT);
    }
  };

  const handleToggle = () => {
    if (!isOpen) computeDirection();
    if (isControlled) {
      controlledOnToggle?.();
    } else {
      setLocalIsOpen((o) => !o);
    }
  };

  const handleClose = () => {
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
      <div
        ref={triggerRef}
        onClick={handleToggle}
        style={{ cursor: "pointer" }}
      >
        {trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            [effectiveOpenUp ? "bottom" : "top"]: "calc(100% + 8px)",
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

            return (
              <button
                // eslint-disable-next-line react/no-array-index-key -- dropdown items are stable during their visible lifetime
                key={`item-${i}`}
                onClick={() => {
                  item.onClick();
                  handleClose();
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
                  fontWeight: item.active ? 700 : 300,
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
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
