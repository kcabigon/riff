"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ChevronIcon } from "@/components/shared/icons";

const GAP_PX = 24;
// Space kept under the cards for the scrollbar; the arrows center on the
// cards above it, not on the whole scroller.
const SCROLLBAR_ROOM_PX = 8;

// Desktop row of fixed-width cards that scrolls sideways, under a header line.
// On its own, an overflowing row gives no hint past the last card that fits:
// the scrollbar only shows while scrolling on macOS, and a card boundary can
// land exactly at the edge. So the edge with more to see gets a round,
// see-through arrow floating over the cards (the Netflix / App Store shelf
// convention), right where the eye hits the cut-off. Each arrow shows only
// when there's something that way; neither shows when everything fits.
//
// Round on purpose — the one exception to the no-radius rule, since it floats
// over cover art as an overlay rather than sitting in the layout.
//
// Mobile has its own treatment (MobileCardCarousel, with dot pagination).
export default function HorizontalScrollRow({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // 1px of slack — scrollLeft is fractional on zoomed/high-DPI screens and
    // can stop just shy of the true end.
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // Before paint, so a row that overflows shows its chevron on the first
  // frame. The observer covers the window (or content column) resizing later.
  useLayoutEffect(() => {
    updateEdges();
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateEdges]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + GAP_PX : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <div>
      <div style={{ marginBottom: "12px" }}>{header}</div>

      <div style={{ position: "relative" }}>
        <div
          ref={scrollerRef}
          onScroll={updateEdges}
          style={{
            display: "flex",
            flexDirection: "row",
            gap: `${GAP_PX}px`,
            overflowX: "auto",
            paddingBottom: `${SCROLLBAR_ROOM_PX}px`,
          }}
        >
          {children}
        </div>

        {canScrollLeft && (
          <ScrollArrow direction="left" onClick={() => scrollByCard(-1)} />
        )}
        {canScrollRight && (
          <ScrollArrow direction="right" onClick={() => scrollByCard(1)} />
        )}
      </div>
    </div>
  );
}

function ScrollArrow({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      style={{
        position: "absolute",
        top: `calc(50% - ${SCROLLBAR_ROOM_PX / 2}px)`,
        [direction]: "12px",
        transform: "translateY(-50%)",
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        border: "none",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isHovered
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
      }}
    >
      <ChevronIcon direction={direction} color="#FFFFFF" size={20} />
    </button>
  );
}
