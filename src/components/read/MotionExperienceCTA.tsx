"use client";

import { useEffect, useState } from "react";
import StrangeCaseExperience from "@/components/read/StrangeCaseExperience";

/**
 * Entry point for the immersive "riff in motion" experience. Lives under the
 * author metadata in the read view. Clicking it opens the experience as a
 * full-screen overlay; its back arrow / leave button closes it, returning to
 * the default read view. Rendered only for the opted-in piece (or any piece in
 * non-production environments, for testing).
 */
export default function MotionExperienceCTA() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

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
          margin: "0 0 48px",
        }}
      >
        <button
          onClick={() => setOpen(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Experience this riff in motion (beta)"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 700,
            color: "#000000",
            backgroundColor: hovered ? "#00FF66" : "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: hovered
              ? "4px 4px 0px 0px #000000"
              : "4px 4px 0px 0px #00FF66",
            padding: "11px 22px",
            cursor: "pointer",
            transition: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/riff_in_motion.svg" alt="" width={18} height={18} />
          Riff in motion
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
        </button>
      </div>

      {open && <StrangeCaseExperience onClose={() => setOpen(false)} />}
    </>
  );
}
