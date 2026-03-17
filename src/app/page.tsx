"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import NoiseBackground from "@/components/NoiseBackground";
import LandingNavBar from "@/components/LandingNavBar";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ height: "100vh", overflow: "hidden", position: "relative", backgroundColor: "#FFFFFF" }}>
      <NoiseBackground fillMode="cover" />

      <LandingNavBar />

      {/* Hero */}
      <main
        style={{
          position: "relative",
          overflow: "hidden",
          height: "calc(100vh - 61px)",
          zIndex: 1,
        }}
      >
        {/* Desktop hero content — 661px tall, vertically centered */}
        <div
          className="hero-desktop"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", height: "661px", width: "100%" }}>
            {/* SVG + text row */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                marginLeft: "-260px",
              }}
            >
              {/* Left SVG — bleeds off left edge */}
              <Image
                src="/images/landing/riff_lp.svg"
                alt="Riff"
                width={599}
                height={502}
                priority
                style={{ flexShrink: 0 }}
              />

              {/* Text block */}
              <div
                style={{
                  width: "540px",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "96px",
                    lineHeight: "normal",
                    color: "#000000",
                    textAlign: "left",
                  }}
                >
                  with friends.
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "96px",
                    lineHeight: "normal",
                    color: "#000000",
                    textAlign: "right",
                  }}
                >
                  Start a
                </div>
              </div>

              {/* Right SVG — bleeds off right edge */}
              <Image
                src="/images/landing/write_club_lp.svg"
                alt="write club"
                width={815}
                height={477}
                priority
                style={{ flexShrink: 0 }}
              />
            </div>

            {/* CTA Button — absolute, horizontally centered */}
            <button
              onClick={() => router.push("/login")}
              style={{
                position: "absolute",
                top: "489px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#01EFFC",
                border: "2px solid #000000",
                boxShadow: "8px 8px 0px 0px #000000",
                padding: "12px 48px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                cursor: "pointer",
                transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.boxShadow = "8px 8px 0px 0px #01EFFC";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#01EFFC";
                e.currentTarget.style.boxShadow = "8px 8px 0px 0px #000000";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateX(-50%) translate(4px, 4px)";
                e.currentTarget.style.boxShadow = "4px 4px 0px 0px #000000";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateX(-50%)";
                e.currentTarget.style.boxShadow = "8px 8px 0px 0px #01EFFC";
              }}
            >
              Let&apos;s do this
            </button>
          </div>
        </div>

        {/* Mobile hero content */}
        <div
          className="hero-mobile"
          style={{
            position: "absolute",
            inset: 0,
            display: "none",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {/* SVG + text row — scaled ~55% */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                marginLeft: "-143px",
                position: "absolute",
                top: "50%",
                transform: "translateY(-50%) translateY(-40px)",
              }}
            >
              <Image
                src="/images/landing/riff_lp.svg"
                alt="Riff"
                width={329}
                height={276}
                priority
                style={{ flexShrink: 0 }}
              />
              <div
                style={{
                  width: "297px",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "13px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "clamp(44px, 12vw, 96px)",
                    lineHeight: "normal",
                    color: "#000000",
                    textAlign: "left",
                  }}
                >
                  with friends.
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "clamp(44px, 12vw, 96px)",
                    lineHeight: "normal",
                    color: "#000000",
                    textAlign: "right",
                  }}
                >
                  Start a
                </div>
              </div>
              <Image
                src="/images/landing/write_club_lp.svg"
                alt="write club"
                width={448}
                height={262}
                priority
                style={{ flexShrink: 0 }}
              />
            </div>

            {/* Mobile CTA Button */}
            <button
              onClick={() => router.push("/login")}
              style={{
                position: "absolute",
                bottom: "60px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#01EFFC",
                border: "2px solid #000000",
                boxShadow: "8px 8px 0px 0px #000000",
                padding: "12px 48px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.boxShadow = "8px 8px 0px 0px #01EFFC";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#01EFFC";
                e.currentTarget.style.boxShadow = "8px 8px 0px 0px #000000";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateX(-50%) translate(4px, 4px)";
                e.currentTarget.style.boxShadow = "4px 4px 0px 0px #000000";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateX(-50%)";
                e.currentTarget.style.boxShadow = "8px 8px 0px 0px #01EFFC";
              }}
            >
              Let&apos;s do this
            </button>
          </div>
        </div>
      </main>

      {/* Responsive styles for hero */}
      <style>{`
        @media (max-width: 767px) {
          .hero-desktop { display: none !important; }
          .hero-mobile { display: flex !important; }
        }
        @media (min-width: 768px) {
          .hero-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
