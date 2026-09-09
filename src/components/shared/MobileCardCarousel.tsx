"use client";

import { useLayoutEffect, useRef, useState } from "react";

interface MobileCardCarouselProps {
  // Each child must carry its own explicit `key` (callers already key
  // their cards by e.g. user id) — reused below instead of array index.
  children: React.ReactElement[];
}

// Visible breathing room between slides while swiping — kept out of each
// slide's own width so cards stay full-bleed at rest. Also factored into
// the active-slide math below, since each "page" of scroll distance is a
// full card width plus one gap, not just the card width.
const SLIDE_GAP_PX = 16;

// Full-bleed, one-card-at-a-time swipe carousel with dot pagination —
// the mobile treatment for card rows where one card (the lead) matters
// most and the rest are a couple of swipes away. Callers control lead
// order by the order of `children`.
//
// Card heights vary by content (e.g. a draft card vs. a fixed-aspect-ratio
// cover card), but a non-wrapping flex row always sizes to its tallest
// child regardless of which slide is scrolled into view — left alone,
// that leaves dead space under every shorter slide. So the scroll
// container's height is pinned to the active slide's measured height
// instead of left to size itself.
export default function MobileCardCarousel({
  children,
}: MobileCardCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeHeight, setActiveHeight] = useState<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / (el.clientWidth + SLIDE_GAP_PX)));
  };

  // Layout effect (not a plain effect) — measures and applies the height
  // before the browser paints, so there's no visible frame at the wrong
  // (stale/tallest-sibling) height on mount or on slide change.
  //
  // A single measurement on mount isn't enough: cards size themselves off
  // their own width (aspect-ratio), so the pinned height goes stale if
  // anything reflows the container's width afterward — content loading in
  // above the carousel, a scrollbar appearing, a resizing dev-tools viewport
  // — without ever changing activeIndex. The ResizeObserver below catches
  // those cases; the effect itself still handles the mount/slide-change case
  // immediately (before paint), since a resize observer's first callback
  // fires async and would otherwise show a stale height for a frame.
  useLayoutEffect(() => {
    setActiveHeight(slideRefs.current[activeIndex]?.offsetHeight);

    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      setActiveHeight(slideRefs.current[activeIndex]?.offsetHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeIndex, children.length]);

  return (
    <div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="mobile-card-carousel-track"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: `${SLIDE_GAP_PX}px`,
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          height: activeHeight,
          transition: "height 0.2s ease",
        }}
      >
        {children.map((child, i) => (
          <div
            key={child.key}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            style={{ width: "100%", flexShrink: 0, scrollSnapAlign: "start" }}
          >
            {child}
          </div>
        ))}
      </div>

      {children.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginTop: "12px",
          }}
        >
          {children.map((child, i) => (
            <div
              key={child.key}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: i === activeIndex ? "#000000" : "#CCCCCC",
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        .mobile-card-carousel-track::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
