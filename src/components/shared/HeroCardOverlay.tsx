"use client";

import FullScreenOverlay from "./FullScreenOverlay";
import BrushWordHero from "./BrushWordHero";
import type { BrushWord } from "./BrushWordHero";

interface HeroCardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  /** Which brush-art line to render above the card. */
  word: BrushWord;
  /**
   * How far to pull the card up over the bottom of the brush art, in px.
   * Tuned per hero: the two brush images have different heights and
   * baselines, so they need different overlaps to sit the same way.
   */
  cardOverlap: { desktop: number; mobile: number };
  children: React.ReactNode;
}

// Shared shell for the multi-step creation flows (riff, club): a full-bleed
// brush-reveal hero with a white card pulled up to overlap its bottom edge.
// The hero renders once for the whole flow — only `children` swap per step —
// so the reveal animation never replays mid-flow.
export default function HeroCardOverlay({
  isOpen,
  onClose,
  ariaLabel,
  word,
  cardOverlap,
  children,
}: HeroCardOverlayProps) {
  return (
    <FullScreenOverlay isOpen={isOpen} onClose={onClose} ariaLabel={ariaLabel}>
      <div
        className="hco-hero"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "64px 24px 96px",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "840px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <BrushWordHero word={word} />

          {/* Overlap is injected as CSS vars rather than a per-flow class so
              the breakpoint rules below can stay a single static block. */}
          <div
            className="hco-card"
            style={
              {
                position: "relative",
                zIndex: 1,
                width: "100%",
                maxWidth: "560px",
                backgroundColor: "#FFFFFF",
                border: "2px solid #000000",
                boxShadow: "8px 8px 0px 0px #000000",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                textAlign: "left",
                "--hco-card-mt": `-${cardOverlap.desktop}px`,
                "--hco-card-mt-mobile": `-${cardOverlap.mobile}px`,
              } as React.CSSProperties
            }
          >
            {children}
          </div>
        </div>
      </div>

      <style>{`
        .hco-card {
          margin-top: var(--hco-card-mt);
        }
        @media (max-width: 767px) {
          .hco-hero {
            padding: 48px 24px 64px !important;
          }
          .hco-card {
            margin-top: var(--hco-card-mt-mobile);
          }
        }
      `}</style>
    </FullScreenOverlay>
  );
}
