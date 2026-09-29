"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import IconButton from "@/components/shared/IconButton";
import { ChevronIcon } from "@/components/shared/icons";

const GAP_PX = 24;

// Desktop row of fixed-width cards that scrolls sideways, under a header line.
// On its own, an overflowing row gives no hint past the last card that fits:
// the scrollbar only shows while scrolling on macOS, and a card boundary can
// land exactly at the edge. So when the row overflows, a quiet ‹ › pair sits at
// the right end of the header line (the Airbnb / Spotify shelf convention),
// kept off the cards themselves. Each chevron shows only when there's
// something that way; neither shows when everything fits.
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

  const overflows = canScrollLeft || canScrollRight;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "12px",
        }}
      >
        {header}
        {overflows && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {/* visibility, not unmount, so the › doesn't shift left when the
                ‹ comes and goes. */}
            <div style={{ visibility: canScrollLeft ? "visible" : "hidden" }}>
              <IconButton
                onClick={() => scrollByCard(-1)}
                ariaLabel="Scroll left"
              >
                {(color) => (
                  <ChevronIcon direction="left" color={color} size={18} />
                )}
              </IconButton>
            </div>
            <div style={{ visibility: canScrollRight ? "visible" : "hidden" }}>
              <IconButton
                onClick={() => scrollByCard(1)}
                ariaLabel="Scroll right"
              >
                {(color) => (
                  <ChevronIcon direction="right" color={color} size={18} />
                )}
              </IconButton>
            </div>
          </div>
        )}
      </div>

      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        style={{
          display: "flex",
          flexDirection: "row",
          gap: `${GAP_PX}px`,
          overflowX: "auto",
          paddingBottom: "8px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
