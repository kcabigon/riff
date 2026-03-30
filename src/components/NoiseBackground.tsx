"use client";

import { CSSProperties } from "react";

interface NoiseBackgroundProps {
  /**
   * How the noise pattern should fill the container
   * - 'tile': Repeat the pattern (best for noise textures)
   * - 'cover': Scale to cover without distortion (may crop)
   * - 'stretch': Stretch to fill (may distort)
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
  fillMode = "tile",
  className = "",
  style = {},
}: NoiseBackgroundProps) {
  // SVG as inline element for different fill modes
  if (fillMode === "cover" || fillMode === "stretch") {
    return (
      <svg
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          ...style,
        }}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio={fillMode === "cover" ? "xMidYMid slice" : "none"}
        viewBox="0 0 1438 1024"
      >
        <g filter="url(#filter0_n_686_2149)">
          <rect width="1440" height="1024" fill="white" />
        </g>
        <defs>
          <filter
            id="filter0_n_686_2149"
            x="0"
            y="0"
            width="1440"
            height="1024"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.5 0.5"
              stitchTiles="stitch"
              numOctaves="3"
              result="noise"
              seed="7463"
            />
            <feColorMatrix
              in="noise"
              type="luminanceToAlpha"
              result="alphaNoise"
            />
            <feComponentTransfer in="alphaNoise" result="coloredNoise1">
              <feFuncA
                type="discrete"
                tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
              />
            </feComponentTransfer>
            <feComposite
              operator="in"
              in2="shape"
              in="coloredNoise1"
              result="noise1Clipped"
            />
            <feFlood floodColor="#000000" result="color1Flood" />
            <feComposite
              operator="in"
              in2="noise1Clipped"
              in="color1Flood"
              result="color1"
            />
            <feMerge result="effect1_noise_686_2149">
              <feMergeNode in="shape" />
              <feMergeNode in="color1" />
            </feMerge>
          </filter>
        </defs>
      </svg>
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

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        backgroundImage: `url("${svgDataUrl}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "1438px 1024px",
        backgroundColor: "white",
        ...style,
      }}
    />
  );
}
