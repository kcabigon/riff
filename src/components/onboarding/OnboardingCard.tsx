"use client";

import { ReactNode } from "react";
import Image from "next/image";
import NoiseBackground from "@/components/NoiseBackground";

interface OnboardingCardProps {
  children: ReactNode;
  showLogo?: boolean;
  headerContent?: ReactNode;
}

export default function OnboardingCard({
  children,
  showLogo = true,
  headerContent,
}: OnboardingCardProps) {
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
      <NoiseBackground fillMode="cover" />
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
        {/* Logo and Header Content (optional) */}
        {(showLogo || headerContent) && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
            }}
          >
            {showLogo && (
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
            )}
            {headerContent}
          </div>
        )}

        {/* Form Content */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            alignItems: "stretch",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
