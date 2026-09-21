"use client";

import { CSSProperties } from "react";

interface NoiseBackgroundProps {
  /**
   * Accepted for backwards compatibility with existing call sites, but no
   * longer meaningful: the noise is always painted as a repeating background
   * image. Scaling it was the expensive path (see the note in the component).
   */
  fillMode?: "tile" | "cover" | "stretch";
  className?: string;
  style?: CSSProperties;
}

/**
 * Reusable noise background component
 * Based on the Figma design noise texture
 */
export default function NoiseBackground({
  className = "",
  style = {},
}: NoiseBackgroundProps) {
  // Every fill mode paints the same tiled data-URI background. Cover/stretch
  // used to render the filter as a live inline <svg> sized to the viewport,
  // which makes the browser re-rasterise a 1440x1024 feTurbulence whenever
  // that box resizes — including every time a mobile keyboard opens or the
  // URL bar collapses, which is why typing on a phone crawled. As a
  // background-image the noise is rasterised once and cached, and it never
  // scales with the container.
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        ...noiseTileStyle,
        ...style,
      }}
    />
  );
}

// For tile mode, use CSS background with the SVG as a data URL
const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1438" height="1024" viewBox="0 0 1438 1024" fill="none">
      <g filter="url(#filter0_n_686_2149)">
        <rect width="1440" height="1024" fill="white"/>
      </g>
      <defs>
        <filter id="filter0_n_686_2149" x="0" y="0" width="1440" height="1024" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feTurbulence type="fractalNoise" baseFrequency="0.5 0.5" stitchTiles="stitch" numOctaves="3" result="noise" seed="7463"/>
          <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise"/>
          <feComponentTransfer in="alphaNoise" result="coloredNoise1">
            <feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
          </feComponentTransfer>
          <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped"/>
          <feFlood flood-color="#000000" result="color1Flood"/>
          <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1"/>
          <feMerge result="effect1_noise_686_2149">
            <feMergeNode in="shape"/>
            <feMergeNode in="color1"/>
          </feMerge>
        </filter>
      </defs>
    </svg>
  `)}`;

/**
 * The tiled noise as plain background properties, for spreading straight into a
 * container's own `style`. Preferred for full-page backgrounds: it paints behind
 * the container's content with no extra element and no stacking-order juggling,
 * and it never scales the filter (see the cover-mode note above).
 */
export const noiseTileStyle: CSSProperties = {
  backgroundImage: `url("${svgDataUrl}")`,
  backgroundRepeat: "repeat",
  backgroundSize: "1438px 1024px",
  backgroundColor: "#FFFFFF",
};
