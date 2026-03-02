"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NoiseBackground from "@/components/NoiseBackground";

export default function LandingPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ height: "100vh", overflow: "hidden", position: "relative", backgroundColor: "#FFFFFF" }}>
      <NoiseBackground fillMode="cover" />

      {/* Navigation Bar */}
      <nav
        style={{
          position: "relative",
          backgroundColor: "#000000",
          zIndex: 100,
        }}
      >
        <div
          style={{
            padding: "8px 42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", textDecoration: "none" }}>
            <Image
              src="/images/landing/riff_logo.svg"
              alt="Riff logo"
              width={30}
              height={22}
              priority
            />
            {/* "Riff" wordmark — desktop only */}
            <span
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "32px",
                fontWeight: 900,
                fontStyle: "italic",
                color: "#FFFFFF",
                lineHeight: 1,
              }}
              className="hidden-mobile"
            >
              Riff
            </span>
          </a>

          {/* Desktop: nav links + sign in */}
          <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "40px" }}>
            <a
              href="#"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#FFFFFF",
                textDecoration: "none",
              }}
            >
              What is this?
            </a>
            <a
              href="#"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#FFFFFF",
                textDecoration: "none",
              }}
            >
              Who built this?
            </a>
            <button
              onClick={() => router.push("/login")}
              style={{
                backgroundColor: "#000000",
                border: "2px solid #FFFFFF",
                padding: "12px 24px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 400,
                color: "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.color = "#000000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#000000";
                e.currentTarget.style.color = "#FFFFFF";
              }}
            >
              Sign In
            </button>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="mobile-nav"
            onClick={() => setDrawerOpen(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "none",
            }}
            aria-label="Open menu"
          >
            <Image src="/images/landing/menu_icon.svg" alt="Menu" width={32} height={32} />
          </button>
        </div>
      </nav>

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

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 199,
          }}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: "280px",
          backgroundColor: "#000000",
          zIndex: 200,
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          gap: "24px",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setDrawerOpen(false)}
          style={{
            alignSelf: "flex-end",
            background: "none",
            border: "none",
            color: "#FFFFFF",
            fontSize: "24px",
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
          aria-label="Close menu"
        >
          ✕
        </button>

        {/* Sign In */}
        <button
          onClick={() => { setDrawerOpen(false); router.push("/login"); }}
          style={{
            backgroundColor: "#000000",
            border: "2px solid #FFFFFF",
            padding: "12px 24px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 400,
            color: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          Sign In
        </button>

        {/* Nav links */}
        <a
          href="#"
          onClick={() => setDrawerOpen(false)}
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#FFFFFF",
            textDecoration: "none",
          }}
        >
          What is this?
        </a>
        <a
          href="#"
          onClick={() => setDrawerOpen(false)}
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#FFFFFF",
            textDecoration: "none",
          }}
        >
          Who built this?
        </a>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
          .hero-desktop { display: none !important; }
          .hero-mobile { display: flex !important; }
        }
        @media (min-width: 768px) {
          .mobile-nav { display: none !important; }
          .hero-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
