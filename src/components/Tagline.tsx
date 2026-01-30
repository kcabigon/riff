"use client";

import Image from "next/image";

interface TaglineProps {
  text: string;
}

/**
 * Reusable tagline component with yellow vector highlight effect
 * Used across auth and onboarding flows
 */
export default function Tagline({ text }: TaglineProps) {
  return (
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
        {text}
      </p>
    </div>
  );
}
