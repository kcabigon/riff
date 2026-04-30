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
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export default function Dropdown({
  trigger,
  items,
  align = "right",
  minWidth = 160,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  onClose: controlledOnClose,
}: DropdownProps) {
  const [localIsOpen, setLocalIsOpen] = useState(false);
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
            top: "calc(100% + 8px)",
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
                  padding: "12px 16px",
                  fontFamily: "var(--font-dm-sans)",
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
