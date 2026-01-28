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
        background: `
          radial-gradient(circle, #000000 1px, transparent 1px),
          radial-gradient(circle, #000000 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0, 10px 10px",
        backgroundColor: "#FFFFFF",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "392px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "56px",
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
          {/* TODO: Replace with colorful wordmark from Figma */}
          <div
            style={{
              width: "220px",
              height: "144px",
              position: "relative",
            }}
          >
            <Image
              src="/images/riff_wordmark_white_outline.svg"
              alt="Riff"
              fill
              priority
              style={{ objectFit: "contain", filter: "invert(1)" }}
            />
          </div>

          {/* Tagline */}
          <div
            style={{
              backgroundColor: "#FFD700",
              padding: "4px 16px",
              borderRadius: "64px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                lineHeight: "normal",
                color: "#000000",
                margin: 0,
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
          }}
        >
          {children}
        </div>
      </div>

      {/* Desktop Media Query */}
      <style jsx>{`
        @media (min-width: 1024px) {
          div:first-child > div:first-child {
            max-width: 560px;
          }
        }
      `}</style>
    </div>
  );
}
