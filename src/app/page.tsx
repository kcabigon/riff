"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import NoiseBackground from "@/components/NoiseBackground";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        backgroundColor: "#FFFFFF",
      }}
    >
      <NoiseBackground fillMode="cover" />

      {/* Navigation Bar */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: "#000000",
          zIndex: 100,
          borderBottom: "1px solid #000000",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Image
              src="/images/landing/riff_logo.svg"
              alt="Riff"
              width={50}
              height={50}
              priority
            />
          </a>

          {/* Nav Links & Sign In */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
            }}
          >
            {/* Nav Links */}
            <div
              style={{
                display: "flex",
                gap: "24px",
              }}
            >
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
            </div>

            {/* Sign In Button */}
            <button
              onClick={() => router.push("/onboarding/login")}
              style={{
                backgroundColor: "transparent",
                border: "2px solid #FFFFFF",
                borderRadius: "0",
                padding: "8px 24px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.color = "#000000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#FFFFFF";
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "82px", // Account for fixed nav bar
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "0 24px",
          }}
        >
          {/* Riff with decorative vector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src="/images/landing/riff_lp.svg"
              alt="Riff"
              width={600}
              height={200}
              priority
              style={{
                maxWidth: "100%",
                height: "auto",
              }}
            />
          </div>

          {/* "with friends." */}
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "64px",
              fontWeight: 400,
              color: "#000000",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            with friends.
          </h1>

          {/* "Start a" */}
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "64px",
              fontWeight: 400,
              color: "#000000",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Start a
          </h1>

          {/* "write club" with decorative vector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src="/images/landing/write_club_lp.svg"
              alt="write club"
              width={600}
              height={200}
              priority
              style={{
                maxWidth: "100%",
                height: "auto",
              }}
            />
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push("/onboarding/login")}
            style={{
              marginTop: "32px",
              backgroundColor: "#01EFFC",
              border: "2px solid #000000",
              borderRadius: "0",
              boxShadow: "8px 8px 0px 0px #000000",
              padding: "16px 48px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "20px",
              fontWeight: 300,
              color: "#000000",
              cursor: "pointer",
              transition: "all 0.2s ease",
              position: "relative",
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
              e.currentTarget.style.transform = "translate(4px, 4px)";
              e.currentTarget.style.boxShadow = "4px 4px 0px 0px #000000";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translate(0, 0)";
              e.currentTarget.style.boxShadow = "8px 8px 0px 0px #01EFFC";
            }}
          >
            Yeah ok, let's do it
          </button>
        </div>
      </main>
    </div>
  );
}
