"use client";

import { ReactNode } from "react";
import Image from "next/image";

interface AuthCardProps {
  children: ReactNode;
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Noise Background */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 1024"
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
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "56px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo and Tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Riff Wordmark */}
          <div
            style={{
              width: "220px",
              height: "144px",
              position: "relative",
            }}
          >
            <Image
              src="/images/riff_wordmark_black_outline.svg"
              alt="Riff"
              fill
              priority
              style={{ objectFit: "contain" }}
            />
          </div>

          {/* Tagline */}
          <div
            style={{
              width: "100%",
              maxWidth: "262px",
              height: "26px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src="/images/tagline_vector.svg"
              alt=""
              fill
              style={{ objectFit: "contain" }}
            />
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "20px",
                fontWeight: 300,
                lineHeight: "normal",
                color: "#000000",
                margin: 0,
                position: "relative",
                zIndex: 1,
              }}
            >
              For friends who write for fun.
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            alignItems: "center",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
