"use client";

import { useEffect, useRef, useCallback, ReactNode } from "react";
import NoiseBackground from "@/components/NoiseBackground";
import CloseButton from "@/components/CloseButton";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  footer?: ReactNode;
  noiseBackground?: boolean;
}

const SIZE_MAP = { sm: 400, md: 480, lg: 600 };

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = "md",
  children,
  footer,
  noiseBackground = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trapping
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    // Save current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Add key listener
    document.addEventListener("keydown", handleKeyDown);

    // Focus first focusable element
    requestAnimationFrame(() => {
      if (dialogRef.current) {
        const first = dialogRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      }
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 100,
        }}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#FFFFFF",
          border: "2px solid #000000",
          boxShadow: "8px 8px 0px 0px #000000",
          padding: 0,
          width: `${SIZE_MAP[size]}px`,
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
          zIndex: 101,
        }}
      >
        {/* Padding lives here so noise covers edge-to-edge and full scroll height */}
        <div style={{ position: "relative", padding: "40px" }}>
          {/* Noise background layer */}
          {noiseBackground && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                pointerEvents: "none",
              }}
            >
              <NoiseBackground fillMode="cover" />
            </div>
          )}

          {/* Content above noise */}
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Header */}
            {title && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "32px",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontFamily: "var(--font-dm-serif-text)",
                      fontSize: "24px",
                      fontWeight: 400,
                      color: "#000000",
                      margin: 0,
                    }}
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "13px",
                        fontWeight: 300,
                        color: "#000000",
                        margin: "6px 0 0 0",
                      }}
                    >
                      {subtitle}
                    </p>
                  )}
                </div>
                <CloseButton onClick={onClose} size={24} />
              </div>
            )}

            {/* Body */}
            {children}

            {/* Footer */}
            {footer && <div style={{ marginTop: "24px" }}>{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
