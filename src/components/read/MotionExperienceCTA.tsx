"use client";

import { useEffect, useState } from "react";
import CTAButton from "@/components/CTAButton";
import StrangeCaseExperience from "@/components/read/StrangeCaseExperience";

/**
 * Entry point for the immersive "riff in motion" experience. Lives under the
 * author metadata in the read view. Clicking it opens the experience as a
 * full-screen overlay; its back arrow / leave button closes it, returning to
 * the default read view. Rendered only for the opted-in piece.
 */
export default function MotionExperienceCTA() {
  const [open, setOpen] = useState(false);

  // lock background scroll while the overlay is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "0 0 24px",
        }}
      >
        <CTAButton
          onClick={() => setOpen(true)}
          style={{ padding: "11px 22px", fontWeight: 700 }}
          aria-label="Experience this riff in motion (beta)"
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
            Experience in motion
            <span
              style={{
                backgroundColor: "#EECF01",
                color: "#000000",
                border: "2px solid #000000",
                padding: "1px 6px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1.4,
              }}
            >
              Beta
            </span>
          </span>
        </CTAButton>
      </div>

      {open && <StrangeCaseExperience onClose={() => setOpen(false)} />}
    </>
  );
}
