"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ArrowIcon } from "@/components/shared/icons";

const GAP_PX = 24;
const FADE_WIDTH_PX = 64;
// Space kept under the cards for the scrollbar, so the fades stop above it.
const SCROLLBAR_ROOM_PX = 8;

// Desktop row of fixed-width cards that scrolls sideways. On its own, an
// overflowing row gives no hint past the last card that fits: the scrollbar
// only shows while scrolling on macOS, and a card boundary can land exactly at
// the edge. So the edge with more to see fades out and gets an arrow button
// that scrolls one card at a time. Each side's fade and button show only when
// there's something that way.
//
// Mobile has its own treatment (MobileCardCarousel, with dot pagination).
export default function HorizontalScrollRow({
  children,
}: {
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

  // Before paint, so a row that overflows shows its arrow on the first frame.
  // The observer covers the window (or the content column) resizing later.
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
        <>
          <EdgeFade side="left" />
          <ScrollArrowButton
            direction="left"
            onClick={() => scrollByCard(-1)}
          />
        </>
      )}
      {canScrollRight && (
        <>
          <EdgeFade side="right" />
          <ScrollArrowButton
            direction="right"
            onClick={() => scrollByCard(1)}
          />
        </>
      )}
    </div>
  );
}

function EdgeFade({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        bottom: `${SCROLLBAR_ROOM_PX}px`,
        [side]: 0,
        width: `${FADE_WIDTH_PX}px`,
        background: `linear-gradient(to ${side}, rgba(255, 255, 255, 0), #FFFFFF)`,
        pointerEvents: "none",
      }}
    />
  );
}

// Same hover language as ThreeDotButton / IconButton — cyan fill on hover —
// but white and bordered at rest, since it sits over card artwork.
function ScrollArrowButton({
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
        [direction]: "8px",
        transform: "translateY(-50%)",
        width: "40px",
        height: "40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        backgroundColor: isHovered ? "#01EFFC" : "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: "4px 4px 0px 0px #000000",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
      }}
    >
      <ArrowIcon direction={direction} size={20} />
    </button>
  );
}
