"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface LandingNavBarProps {
  sticky?: boolean;
}

export default function LandingNavBar({ sticky = false }: LandingNavBarProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav
        style={{
          position: sticky ? "sticky" : "relative",
          top: sticky ? 0 : undefined,
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
          {/* Left: Logo + wordmark (wordmark hidden on mobile) */}
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <Image
              src="/images/landing/riff_logo.svg"
              alt="Riff logo"
              width={30}
              height={22}
              priority
            />
            <span
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "32px",
                fontWeight: 900,
                fontStyle: "italic",
                color: "#FFFFFF",
                lineHeight: 1,
              }}
              className="lnav-hidden-mobile"
            >
              Riff
            </span>
          </a>

          {/* Right: About + Sign In (desktop only) */}
          <div
            className="lnav-desktop"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "40px",
            }}
          >
            <a
              href="/about"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#FFFFFF",
                textDecoration: "none",
              }}
            >
              About
            </a>
            <button
              onClick={() => router.push("/login")}
              style={{
                backgroundColor: "#000000",
                border: "1px solid #FFFFFF",
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
            className="lnav-mobile"
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
            <Image
              src="/icons/mobile_menu.svg"
              alt="Menu"
              width={32}
              height={32}
            />
          </button>
        </div>
      </nav>

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

        <button
          onClick={() => {
            setDrawerOpen(false);
            router.push("/login");
          }}
          style={{
            backgroundColor: "#000000",
            border: "1px solid #FFFFFF",
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

        <a
          href="/about"
          onClick={() => setDrawerOpen(false)}
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#FFFFFF",
            textDecoration: "none",
          }}
        >
          About
        </a>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .lnav-hidden-mobile { display: none !important; }
          .lnav-desktop { display: none !important; }
          .lnav-mobile { display: flex !important; }
        }
        @media (min-width: 768px) {
          .lnav-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
