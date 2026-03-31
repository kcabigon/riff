"use client";

import { useState, useEffect, useRef } from "react";

interface UseScrollDirectionOptions {
  threshold?: number;
  topOffset?: number;
}

export function useScrollDirection({
  threshold = 15,
  topOffset = 10,
}: UseScrollDirectionOptions = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const cooldown = useRef(false);

  useEffect(() => {
    const update = () => {
      const scrollY = window.scrollY;

      // Always show at top of page
      if (scrollY < topOffset) {
        setIsVisible(true);
        lastScrollY.current = scrollY;
        ticking.current = false;
        return;
      }

      const delta = scrollY - lastScrollY.current;

      if (Math.abs(delta) >= threshold && !cooldown.current) {
        const newVisible = delta < 0;
        setIsVisible(newVisible);
        lastScrollY.current = scrollY;
        cooldown.current = true;
        setTimeout(() => {
          cooldown.current = false;
        }, 100);
      }

      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(update);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, topOffset]);

  return isVisible;
}
