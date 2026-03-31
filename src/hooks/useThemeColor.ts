"use client";

import { useEffect } from "react";

const DEFAULT_THEME = "#000000";

/**
 * Dynamically updates the theme-color meta tag and body background.
 * Safari uses both the meta tag and the actual page background to
 * determine the status bar color. Resets on unmount.
 */
export function useThemeColor(color: string) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const prevBackground = document.body.style.background;

    if (meta) {
      meta.setAttribute("content", color);
    }
    document.body.style.background = color;

    return () => {
      if (meta) {
        meta.setAttribute("content", DEFAULT_THEME);
      }
      document.body.style.background = prevBackground;
    };
  }, [color]);
}
