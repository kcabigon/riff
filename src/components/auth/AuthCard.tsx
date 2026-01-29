"use client";

import { ReactNode } from "react";
import Image from "next/image";
import NoiseBackground from "@/components/NoiseBackground";

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
