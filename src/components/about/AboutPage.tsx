"use client";

import { useRouter } from "next/navigation";
import NoiseBackground from "@/components/NoiseBackground";
import LandingNavBar from "@/components/LandingNavBar";
import { useIsMobile } from "@/hooks/useMediaQuery";
import SecondaryButton from "@/components/SecondaryButton";

const FILTERS = {
  yellow: "none",
  orange:
    "brightness(0) saturate(100%) invert(57%) sepia(87%) saturate(2645%) hue-rotate(339deg) brightness(101%) contrast(101%)",
  pink: "brightness(0) saturate(100%) invert(18%) sepia(82%) saturate(3721%) hue-rotate(307deg) brightness(95%) contrast(98%)",
  cyan: "brightness(0) saturate(100%) invert(79%) sepia(91%) saturate(2670%) hue-rotate(137deg) brightness(103%) contrast(101%)",
  purple:
    "brightness(0) saturate(100%) invert(42%) sepia(42%) saturate(887%) hue-rotate(232deg) brightness(94%) contrast(89%)",
  green:
    "brightness(0) saturate(100%) invert(61%) sepia(97%) saturate(431%) hue-rotate(91deg) brightness(109%) contrast(103%)",
};

function Highlight({
  children,
  filter = FILTERS.yellow,
}: {
  children: string;
  filter?: string;
}) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <img
        src="/images/tagline_vector.svg"
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "2px",
          left: "-4px",
          width: "calc(100% + 8px)",
          height: "22px",
          zIndex: 0,
          filter,
        }}
      />
      <strong style={{ position: "relative", zIndex: 1, fontWeight: 700 }}>
        {children}
      </strong>
    </span>
  );
}

export default function AboutPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
        position: "relative",
      }}
    >
      <NoiseBackground fillMode="cover" style={{ position: "fixed" }} />

      <LandingNavBar sticky />

      <main
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "64px 24px 96px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: isMobile ? "52px" : "80px",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 24px 0",
            lineHeight: 1.15,
            textAlign: "center",
          }}
        >
          <span style={{ position: "relative", display: "inline-block" }}>
            <img
              src="/images/tagline_vector.svg"
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: "6px",
                left: "-6px",
                width: "calc(100% + 12px)",
                height: "28px",
                zIndex: 0,
                filter: FILTERS.cyan,
              }}
            />
            <strong
              style={{ fontWeight: 700, position: "relative", zIndex: 1 }}
            >
              Write clubs
            </strong>
          </span>

          {" are the new"}
          <br />
          {"book clubs"}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: isMobile ? "20px" : "28px",
            fontWeight: 300,
            color: "#000000",
            margin: "0 0 48px 0",
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          {"Good "}
          <Highlight>friends</Highlight>
          {" consume together. Great friends "}
          <Highlight filter={FILTERS.orange}>create</Highlight>
          {" together."}
          <br />
          {"Share "}
          <Highlight filter={FILTERS.pink}>stories</Highlight>
          {" with friends, "}
          <Highlight filter={FILTERS.purple}>once a month</Highlight>
          {"."}
        </p>

        {/* Top section CTA */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "48px",
          }}
        >
          <SecondaryButton
            onClick={() => router.push("/login")}
            style={{ width: "auto" }}
          >
            Start the party
          </SecondaryButton>
        </div>

        {/* GIF */}
        <div
          style={{
            width: "100%",
            marginBottom: "12px",
            overflow: "hidden",
          }}
        >
          <img
            src="/images/about/friendsgiving2025.gif"
            alt="Friendsgiving 2025"
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>

        {/* GIF caption */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: "0 0 48px 0",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#000000",
              fontStyle: "italic",
              margin: 0,
              padding: "6px 16px",
              backgroundColor: "#FFFFFF",
              border: "2px solid #000000",
              display: "inline",
            }}
          >
            (This is us. 5 of us are building Riff for the 8 of us in a write
            club.)
          </p>
        </div>
      </main>

      {/* Riff tagline band — full bleed */}
      <div
        style={{
          backgroundColor: "#00FF66",
          borderTop: "2px solid #000000",
          borderBottom: "2px solid #000000",
          padding: "64px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div style={{ width: "160px", height: "104px" }}>
            <img
              src="/images/riff_wordmark_black_outline.svg"
              alt="Riff"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <p
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: isMobile ? "28px" : "40px",
              fontWeight: 400,
              color: "#000000",
              margin: "0 0 24px 0",
              lineHeight: 1.25,
              textAlign: "center",
              maxWidth: "640px",
            }}
          >
            Host a write club with minimal stress and maximum fun.
          </p>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "18px",
              fontWeight: 300,
              color: "#333333",
              margin: "0 0 32px 0",
              lineHeight: 1.8,
              textAlign: "center",
              maxWidth: "560px",
            }}
          >
            Create your club, invite friends, manage monthly riffs, write solo,
            reveal together, and comment on each others&apos; writing.
          </p>
        </div>

        {/* Product screenshot — full bleed within band */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto 0 auto",
            padding: "0 24px",
            boxSizing: "border-box",
          }}
        >
          <picture>
            <source
              srcSet="/images/about/Riff_club_mobile.png"
              media="(max-width: 768px)"
            />
            <img
              src="/images/about/Riff_club_screenshot.png"
              alt="Riff club page screenshot"
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: "4px",
                border: "2px solid #000000",
                boxShadow: "8px 8px 0px 0px #000000",
              }}
            />
          </picture>
          {/* Gradient fade */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: "24px",
              right: "24px",
              height: "40%",
              background: "linear-gradient(to bottom, transparent, #000000)",
              borderRadius: "0 0 4px 4px",
              pointerEvents: "none",
            }}
          />
        </div>

        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <SecondaryButton
            onClick={() => router.push("/login")}
            style={{ width: "auto", marginTop: "32px" }}
          >
            Be the hostess with the mostest
          </SecondaryButton>
        </div>
      </div>

      {/* Our Promise */}
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "64px 24px 96px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <section>
          <h2
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 700,
              color: "#000000",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: "0 0 16px 0",
            }}
          >
            Our Promise
          </h2>
          <div
            style={{
              border: "2px solid #000000",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              backgroundColor: "#FFFFFF",
            }}
          >
            {[
              "Your data is yours. We will never sell it or use it for ads.",
              "You can export all your writing at any time.",
              "You can delete your account and all your data whenever you want.",
            ].map((promise, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#00FF66",
                    lineHeight: 1.8,
                    flexShrink: 0,
                  }}
                >
                  &bull;
                </span>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 300,
                    color: "#000000",
                    margin: 0,
                    lineHeight: 1.8,
                  }}
                >
                  {promise}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
