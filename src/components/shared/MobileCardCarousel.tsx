"use client";

import { useEffect, useRef, useState } from "react";

interface MobileCardCarouselProps {
  // Each child must carry its own explicit `key` (callers already key
  // their cards by e.g. user id) — reused below instead of array index.
  children: React.ReactElement[];
}

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
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    setActiveHeight(slideRefs.current[activeIndex]?.offsetHeight);
  }, [activeIndex, children.length]);

  return (
    <div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          display: "flex",
          alignItems: "flex-start",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
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
    </div>
  );
}
