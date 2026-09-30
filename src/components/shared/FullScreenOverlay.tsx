"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { noiseTileStyle } from "@/components/NoiseBackground";
import CloseButton from "@/components/CloseButton";

interface FullScreenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}

// Full-viewport dismissable takeover — same portal/ESC-key/scroll-lock/
// focus-restore technique as Modal, just sized to fill the screen instead
// of a centered card. Shared chrome for CreateRiffOverlay and
// CreateClubOverlay; callers are expected to also gate their own heavy
// content on `isOpen` before rendering into `children`, so closed overlays
// don't pay for mounting/animating content nobody sees.
export default function FullScreenOverlay({
  isOpen,
  onClose,
  ariaLabel,
  children,
}: FullScreenOverlayProps) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Portaled to document.body — same reasoning as Modal: guarantees this
  // sits above everything regardless of where it's triggered from.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        zIndex: 100,
        ...noiseTileStyle,
      }}
    >
      <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 2 }}>
        <CloseButton onClick={onClose} />
      </div>

      {children}
    </div>,
    document.body
  );
}
